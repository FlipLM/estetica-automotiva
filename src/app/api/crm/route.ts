import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { extractValidWhatsAppDigits } from "@/lib/phone";

export const dynamic = "force-dynamic";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const COATING_KEYWORD_REGEX =
  /vitrifica|ppf|ceramic|cerâmic|selante|coating|cristaliza/i;

export type CrmFilter =
  | "TODAY"
  | "BUDGET_RECOVERY"
  | "COATING_WARRANTY"
  | "CHURN_RISK"
  | "POST_SALE"
  | "RAINY_DAY"
  | "BIRTHDAY"
  | "VIP"
  | "ALL";

const VALID_FILTERS = new Set<CrmFilter>([
  "TODAY",
  "BUDGET_RECOVERY",
  "COATING_WARRANTY",
  "CHURN_RISK",
  "POST_SALE",
  "RAINY_DAY",
  "BIRTHDAY",
  "VIP",
  "ALL",
]);

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getOrderVisitDate(order: {
  completedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
}): Date {
  return order.completedAt ?? order.paidAt ?? order.createdAt;
}

function diffDaysFloor(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY));
}

function getDaysUntilBirthday(birthDate: Date, now: Date): {
  daysUntil: number;
  isSameMonth: boolean;
} {
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const bMonth = birthDate.getMonth();
  const bDay = birthDate.getDate();

  let nextBirthday = new Date(now.getFullYear(), bMonth, bDay);
  if (nextBirthday.getTime() < todayMidnight.getTime()) {
    nextBirthday = new Date(now.getFullYear() + 1, bMonth, bDay);
  }

  const daysUntil = Math.round(
    (nextBirthday.getTime() - todayMidnight.getTime()) / MS_PER_DAY
  );
  const isSameMonth = bMonth === now.getMonth();

  return { daysUntil, isSameMonth };
}

function getSuppressionCooldownDays(campaign: string): number {
  if (campaign === "BUDGET_RECOVERY" || campaign === "POST_SALE") {
    return 7;
  }
  return 15;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const rawFilter = (searchParams.get("filter") || "TODAY").toUpperCase();
    const filter: CrmFilter = VALID_FILTERS.has(rawFilter as CrmFilter)
      ? (rawFilter as CrmFilter)
      : "TODAY";

    const queryText = (searchParams.get("q") || "").trim().toLowerCase();
    const hideContactedParam = searchParams.get("hideContacted");
    const hideContacted =
      hideContactedParam !== null
        ? hideContactedParam === "true"
        : filter !== "VIP" && filter !== "ALL";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10) || 25)
    );

    const now = new Date();
    const days45Ago = new Date(now.getTime() - 45 * MS_PER_DAY);
    const days30Ago = new Date(now.getTime() - 30 * MS_PER_DAY);

    const [tenant, customers, contactLogs] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          tradingName: true,
          googleReviewUrl: true,
        },
      }),
      prisma.customer.findMany({
        where: { tenantId },
        include: {
          vehicles: {
            include: {
              serviceOrders: {
                where: {
                  tenantId,
                  status: { in: ["PAID", "BUDGET_PENDING", "BUDGET_APPROVED"] },
                },
                orderBy: { createdAt: "desc" },
                include: {
                  items: {
                    select: {
                      serviceName: true,
                      totalPrice: true,
                      service: {
                        select: {
                          id: true,
                          category: true,
                          maintenanceIntervalDays: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          customerVehicles: {
            include: {
              vehicle: {
                include: {
                  serviceOrders: {
                    where: {
                      tenantId,
                      status: {
                        in: ["PAID", "BUDGET_PENDING", "BUDGET_APPROVED"],
                      },
                    },
                    orderBy: { createdAt: "desc" },
                    include: {
                      items: {
                        select: {
                          serviceName: true,
                          totalPrice: true,
                          service: {
                            select: {
                              id: true,
                              category: true,
                              maintenanceIntervalDays: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.crmContactLog.findMany({
        where: {
          tenantId,
          OR: [
            { createdAt: { gte: days45Ago } },
            { snoozeUntil: { gt: now } },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Agrupa logs de contato por cliente
    const logsByCustomer = new Map<string, typeof contactLogs>();
    for (const log of contactLogs) {
      const arr = logsByCustomer.get(log.customerId) || [];
      arr.push(log);
      logsByCustomer.set(log.customerId, arr);
    }

    // Controle global de OS pagas para cálculo deduplicado de ROI (últimos 30 dias)
    const paidOrderForRoiMap = new Map<
      string,
      { customerId: string; totalAmount: number; paidAt: Date }
    >();

    // Passo 1: Normalizar cada cliente (multi-veículos, LTV exclusivo em PAID, datas, proteções e orçamentos)
    const normalized = customers.map((c) => {
      // Unifica veículos diretos e N:N (CustomerVehicle) sem duplicação
      const vehiclesMap = new Map<
        string,
        {
          id: string;
          plate: string;
          brand: string | null;
          model: string;
          color: string | null;
          isPrimary: boolean;
          serviceOrders: typeof c.vehicles[number]["serviceOrders"];
        }
      >();

      for (const v of c.vehicles) {
        vehiclesMap.set(v.id, {
          id: v.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          color: v.color,
          isPrimary: false,
          serviceOrders: v.serviceOrders,
        });
      }

      for (const cv of c.customerVehicles) {
        const existingV = vehiclesMap.get(cv.vehicle.id);
        if (existingV) {
          existingV.isPrimary = existingV.isPrimary || cv.isPrimary;
        } else {
          vehiclesMap.set(cv.vehicle.id, {
            id: cv.vehicle.id,
            plate: cv.vehicle.plate,
            brand: cv.vehicle.brand,
            model: cv.vehicle.model,
            color: cv.vehicle.color,
            isPrimary: cv.isPrimary,
            serviceOrders: cv.vehicle.serviceOrders,
          });
        }
      }

      const unifiedVehicles = Array.from(vehiclesMap.values());

      // Deduplica ordens de serviço caso o mesmo veículo esteja nos dois relacionamentos
      const ordersById = new Map<
        string,
        typeof unifiedVehicles[number]["serviceOrders"][number]
      >();
      for (const v of unifiedVehicles) {
        for (const o of v.serviceOrders) {
          ordersById.set(o.id, o);
        }
      }

      const allOrders = Array.from(ordersById.values());

      const paidOrders = allOrders
        .filter((o) => o.status === "PAID")
        .sort(
          (a, b) =>
            getOrderVisitDate(b).getTime() - getOrderVisitDate(a).getTime()
        );

      const openBudgets = allOrders
        .filter(
          (o) =>
            o.status === "BUDGET_PENDING" || o.status === "BUDGET_APPROVED"
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Registra OS pagas dos últimos 30 dias para apuração de ROI
      for (const po of paidOrders) {
        const refDate = po.paidAt ?? getOrderVisitDate(po);
        if (refDate.getTime() >= days30Ago.getTime()) {
          paidOrderForRoiMap.set(po.id, {
            customerId: c.id,
            totalAmount: po.totalAmount,
            paidAt: refDate,
          });
        }
      }

      // LTV e frequência estritamente sobre OS com status === "PAID"
      const totalSpent = roundMoney(
        paidOrders.reduce((acc, o) => acc + o.totalAmount, 0)
      );
      const ordersCount = paidOrders.length;

      const latestPaidOrder = paidOrders[0] || null;
      const lastVisitDate = latestPaidOrder
        ? getOrderVisitDate(latestPaidOrder)
        : null;
      const daysSinceLastVisit = lastVisitDate
        ? diffDaysFloor(lastVisitDate, now)
        : null;

      // Orçamentos em aberto
      const openBudgetTotal = roundMoney(
        openBudgets.reduce((acc, b) => acc + b.totalAmount, 0)
      );
      const latestOpenBudget = openBudgets[0]
        ? {
            id: openBudgets[0].id,
            orderNumber: openBudgets[0].orderNumber,
            status: openBudgets[0].status,
            totalAmount: roundMoney(openBudgets[0].totalAmount),
            vehicleId: openBudgets[0].vehicleId,
            createdAt: openBudgets[0].createdAt.toISOString(),
            daysOpen: diffDaysFloor(openBudgets[0].createdAt, now),
          }
        : null;
      const hasOpenBudget = openBudgets.length > 0;
      const isStaleBudget = Boolean(
        latestOpenBudget && latestOpenBudget.daysOpen >= 2
      );

      // Rastreio específico da última OS com serviço de proteção ou ciclo configurado
      let protectionInfo: {
        orderId: string;
        vehicleId: string;
        serviceName: string;
        visitDate: Date;
        intervalDays: number;
        daysSince: number;
      } | null = null;

      for (const po of paidOrders) {
        const matchItem = po.items.find(
          (item) =>
            item.service?.maintenanceIntervalDays != null ||
            item.service?.category === "PROTECAO" ||
            COATING_KEYWORD_REGEX.test(item.serviceName)
        );

        if (matchItem) {
          const visitDate = getOrderVisitDate(po);
          const intervalDays = matchItem.service?.maintenanceIntervalDays ?? 180;
          const daysSince = diffDaysFloor(visitDate, now);
          protectionInfo = {
            orderId: po.id,
            vehicleId: po.vehicleId,
            serviceName: matchItem.serviceName,
            visitDate,
            intervalDays,
            daysSince,
          };
          break;
        }
      }

      const isCoatingDue = Boolean(
        protectionInfo &&
          (protectionInfo.intervalDays === 180
            ? protectionInfo.daysSince >= 150
            : protectionInfo.daysSince >=
              Math.max(1, protectionInfo.intervalDays - 15))
      );

      // Risco de churn e pós-venda
      const isChurnRisk = Boolean(
        ordersCount > 0 &&
          daysSinceLastVisit !== null &&
          daysSinceLastVisit >= 45
      );
      const isPostSale = Boolean(
        ordersCount > 0 &&
          daysSinceLastVisit !== null &&
          daysSinceLastVisit >= 1 &&
          daysSinceLastVisit <= 7
      );
      const isRecentPostSale = Boolean(
        ordersCount > 0 &&
          daysSinceLastVisit !== null &&
          daysSinceLastVisit >= 1 &&
          daysSinceLastVisit <= 3
      );

      // WhatsApp válido
      const rawPhone = c.whatsapp || c.phone || null;
      const whatsappDigits = extractValidWhatsAppDigits(rawPhone);
      const hasValidWhatsApp = Boolean(whatsappDigits);

      // Dia de chuva: apenas clientes com WhatsApp válido que NÃO visitaram nos últimos 15 dias
      const isRainyDayEligible = Boolean(
        hasValidWhatsApp &&
          (daysSinceLastVisit === null || daysSinceLastVisit > 15)
      );

      // Aniversariante
      const birthdayMeta = c.birthDate
        ? getDaysUntilBirthday(c.birthDate, now)
        : null;
      const isBirthdayMonthOrWeek = Boolean(
        birthdayMeta &&
          (birthdayMeta.isSameMonth || birthdayMeta.daysUntil <= 7)
      );
      const isBirthdaySoon = Boolean(
        birthdayMeta && birthdayMeta.daysUntil >= 0 && birthdayMeta.daysUntil <= 7
      );

      // Escolhe veículo principal para exibição:
      // 1) veículo da OS relevante (orçamento / proteção / última OS paga)
      // 2) veículo marcado isPrimary
      // 3) primeiro veículo da lista unificada
      const targetVehicleId =
        (filter === "BUDGET_RECOVERY" && latestOpenBudget?.vehicleId) ||
        (filter === "COATING_WARRANTY" && protectionInfo?.vehicleId) ||
        latestOpenBudget?.vehicleId ||
        protectionInfo?.vehicleId ||
        latestPaidOrder?.vehicleId ||
        null;

      const displayedVehicle =
        (targetVehicleId
          ? vehiclesMap.get(targetVehicleId)
          : undefined) ||
        unifiedVehicles.find((v) => v.isPrimary) ||
        unifiedVehicles[0] ||
        null;

      // Últimos logs de contato do cliente (anti-spam / adiamento)
      const customerLogs = logsByCustomer.get(c.id) || [];
      const latestContact = customerLogs[0] || null;
      const daysSinceLastContact = latestContact
        ? diffDaysFloor(latestContact.createdAt, now)
        : null;

      const activeSnoozeLog = customerLogs.find(
        (l) => l.snoozeUntil && l.snoozeUntil.getTime() > now.getTime()
      );

      const isSuppressedFor = (campaignKey: string): boolean => {
        if (activeSnoozeLog) return true;
        if (!latestContact || daysSinceLastContact === null) return false;
        const cooldown = getSuppressionCooldownDays(campaignKey);
        return daysSinceLastContact < cooldown;
      };

      const lastServiceNames = latestPaidOrder
        ? latestPaidOrder.items.map((i) => i.serviceName).slice(0, 3)
        : [];

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        whatsapp: rawPhone,
        whatsappDigits,
        hasValidWhatsApp,
        email: c.email,
        birthDate: c.birthDate ? c.birthDate.toISOString() : null,
        birthdayDaysUntil: birthdayMeta ? birthdayMeta.daysUntil : null,
        isBirthdayMonthOrWeek,
        isBirthdaySoon,
        totalSpent,
        ordersCount,
        lastVisitAt: lastVisitDate ? lastVisitDate.toISOString() : null,
        daysSinceLastVisit,
        lastServiceNames,
        mainVehicle: displayedVehicle
          ? {
              id: displayedVehicle.id,
              plate: displayedVehicle.plate,
              brand: displayedVehicle.brand,
              model: displayedVehicle.model,
              color: displayedVehicle.color,
            }
          : null,
        vehiclesCount: unifiedVehicles.length,
        hasOpenBudget,
        isStaleBudget,
        openBudgetTotal,
        latestOpenBudget,
        protectionInfo: protectionInfo
          ? {
              orderId: protectionInfo.orderId,
              vehicleId: protectionInfo.vehicleId,
              serviceName: protectionInfo.serviceName,
              visitDate: protectionInfo.visitDate.toISOString(),
              intervalDays: protectionInfo.intervalDays,
              daysSince: protectionInfo.daysSince,
            }
          : null,
        isCoatingDue,
        isChurnRisk,
        isPostSale,
        isRecentPostSale,
        isRainyDayEligible,
        latestContact: latestContact
          ? {
              id: latestContact.id,
              campaign: latestContact.campaign,
              outcome: latestContact.outcome,
              snoozeUntil: latestContact.snoozeUntil
                ? latestContact.snoozeUntil.toISOString()
                : null,
              createdAt: latestContact.createdAt.toISOString(),
              daysAgo: daysSinceLastContact ?? 0,
            }
          : null,
        isSnoozed: Boolean(activeSnoozeLog),
        isSuppressedFor,
      };
    });

    // Passo 2: Curva ABC corrigida (quem tem R$ 0 sempre fica em C; 1o pagante sempre recebe A)
    const totalTenantRevenue = roundMoney(
      normalized.reduce((acc, c) => acc + c.totalSpent, 0)
    );

    const sortedBySpend = [...normalized].sort(
      (a, b) => b.totalSpent - a.totalSpent
    );

    let accumulatedRevenue = 0;
    const abcById = new Map<string, "A" | "B" | "C">();

    for (const c of sortedBySpend) {
      if (c.totalSpent <= 0 || totalTenantRevenue <= 0) {
        abcById.set(c.id, "C");
        continue;
      }

      const ratioBefore = accumulatedRevenue / totalTenantRevenue;
      if (accumulatedRevenue === 0 || ratioBefore < 0.7) {
        abcById.set(c.id, "A");
      } else if (ratioBefore < 0.9) {
        abcById.set(c.id, "B");
      } else {
        abcById.set(c.id, "C");
      }

      accumulatedRevenue += c.totalSpent;
    }

    // Passo 3: Enriquecer com Classificação Humana, Prioridade TODAY e Motivo Acionável
    const enriched = normalized.map((c) => {
      const abcClass = abcById.get(c.id) || "C";
      const tierLabel =
        abcClass === "A"
          ? "Cliente Ouro (VIP)"
          : abcClass === "B"
          ? "Recorrente"
          : c.ordersCount === 0
          ? "Novo"
          : "Ocasional";

      // Determina melhor motivo acionável e campanha sugerida
      let primaryCampaign:
        | "BUDGET_RECOVERY"
        | "COATING_WARRANTY"
        | "POST_SALE"
        | "BIRTHDAY"
        | "CHURN_RISK"
        | "RAINY_DAY"
        | "VIP"
        | "MANUAL" = "MANUAL";
      let todayPriority = 0;
      let reasonTitle = "Cliente na base";
      let targetOrderId: string | null = null;
      let targetVehicleId: string | null = c.mainVehicle?.id || null;

      if (c.isStaleBudget && c.latestOpenBudget) {
        primaryCampaign = "BUDGET_RECOVERY";
        todayPriority = 100 + Math.min(30, c.latestOpenBudget.daysOpen);
        reasonTitle = `Orçamento #${c.latestOpenBudget.orderNumber} aberto há ${c.latestOpenBudget.daysOpen} dia(s) (R$ ${c.latestOpenBudget.totalAmount.toFixed(2).replace(".", ",")})`;
        targetOrderId = c.latestOpenBudget.id;
        targetVehicleId = c.latestOpenBudget.vehicleId;
      } else if (c.isCoatingDue && c.protectionInfo) {
        primaryCampaign = "COATING_WARRANTY";
        const overdueDays =
          c.protectionInfo.daysSince - c.protectionInfo.intervalDays;
        todayPriority = 90 + Math.max(0, Math.min(20, overdueDays));
        reasonTitle =
          overdueDays >= 0
            ? `Manutenção de ${c.protectionInfo.serviceName} venceu há ${overdueDays} dia(s)`
            : `Manutenção de ${c.protectionInfo.serviceName} vence em ${Math.abs(overdueDays)} dia(s)`;
        targetOrderId = c.protectionInfo.orderId;
        targetVehicleId = c.protectionInfo.vehicleId;
      } else if (c.isRecentPostSale && c.daysSinceLastVisit !== null) {
        primaryCampaign = "POST_SALE";
        todayPriority = 80;
        reasonTitle = `Atendido há ${c.daysSinceLastVisit} dia(s) — pedir feedback e avaliação`;
      } else if (c.isBirthdaySoon && c.birthdayDaysUntil !== null) {
        primaryCampaign = "BIRTHDAY";
        todayPriority = 75;
        reasonTitle =
          c.birthdayDaysUntil === 0
            ? "Faz aniversário hoje! Enviar parabéns com mimo"
            : `Aniversário em ${c.birthdayDaysUntil} dia(s)`;
      } else if (c.isChurnRisk && c.daysSinceLastVisit !== null) {
        primaryCampaign = "CHURN_RISK";
        todayPriority = 60 + (abcClass === "A" ? 15 : abcClass === "B" ? 8 : 0);
        reasonTitle = `Sem voltar há ${c.daysSinceLastVisit} dias (${abcClass === "A" ? "Cliente Ouro" : "Cliente recorrente"})`;
      } else if (c.hasOpenBudget && c.latestOpenBudget) {
        primaryCampaign = "BUDGET_RECOVERY";
        reasonTitle = `Orçamento #${c.latestOpenBudget.orderNumber} em aberto`;
        targetOrderId = c.latestOpenBudget.id;
        targetVehicleId = c.latestOpenBudget.vehicleId;
      } else if (c.isPostSale && c.daysSinceLastVisit !== null) {
        primaryCampaign = "POST_SALE";
        reasonTitle = `Atendido há ${c.daysSinceLastVisit} dia(s)`;
      } else if (c.isBirthdayMonthOrWeek) {
        primaryCampaign = "BIRTHDAY";
        reasonTitle = "Aniversariante do mês";
      } else if (abcClass === "A") {
        primaryCampaign = "VIP";
        reasonTitle = "Cliente Ouro (VIP) da estética";
      } else if (c.daysSinceLastVisit === null) {
        reasonTitle = "Ainda sem serviços pagos registrados";
      } else {
        reasonTitle = `Última visita há ${c.daysSinceLastVisit} dia(s)`;
      }

      // Remove helper closure antes de serializar JSON
      const { isSuppressedFor, ...publicFields } = c;

      return {
        ...publicFields,
        abcClass,
        tierLabel,
        primaryCampaign,
        todayPriority,
        reasonTitle,
        targetOrderId,
        targetVehicleId,
        isSuppressedForToday: isSuppressedFor(primaryCampaign),
        isSuppressedForBudget: isSuppressedFor("BUDGET_RECOVERY"),
        isSuppressedForCoating: isSuppressedFor("COATING_WARRANTY"),
        isSuppressedForChurn: isSuppressedFor("CHURN_RISK"),
        isSuppressedForPostSale: isSuppressedFor("POST_SALE"),
        isSuppressedForRainyDay: isSuppressedFor("RAINY_DAY"),
        isSuppressedForBirthday: isSuppressedFor("BIRTHDAY"),
      };
    });

    // Passo 4: Calcular ROI dos últimos 30 dias (OS pagas até 14 dias após contato SENT)
    const sentLogsLast45d = contactLogs.filter((l) => l.outcome === "SENT");
    let roi30dRevenue = 0;
    let roi30dOrdersCount = 0;

    paidOrderForRoiMap.forEach((orderInfo) => {
      const hasAttributableContact = sentLogsLast45d.some((log) => {
        if (log.customerId !== orderInfo.customerId) return false;
        const diffMs = orderInfo.paidAt.getTime() - log.createdAt.getTime();
        return diffMs >= 0 && diffMs <= 14 * MS_PER_DAY;
      });

      if (hasAttributableContact) {
        roi30dRevenue += orderInfo.totalAmount;
        roi30dOrdersCount += 1;
      }
    });

    // Passo 5: Selecionar listas por segmento respeitando `hideContacted`
    const matchesSegment = (
      item: (typeof enriched)[number],
      seg: CrmFilter
    ): { matches: boolean; suppressed: boolean } => {
      switch (seg) {
        case "TODAY":
          return {
            matches: item.todayPriority > 0,
            suppressed: item.isSuppressedForToday,
          };
        case "BUDGET_RECOVERY":
          return {
            matches: item.hasOpenBudget,
            suppressed: item.isSuppressedForBudget,
          };
        case "COATING_WARRANTY":
          return {
            matches: item.isCoatingDue,
            suppressed: item.isSuppressedForCoating,
          };
        case "CHURN_RISK":
          return {
            matches: item.isChurnRisk,
            suppressed: item.isSuppressedForChurn,
          };
        case "POST_SALE":
          return {
            matches: item.isPostSale,
            suppressed: item.isSuppressedForPostSale,
          };
        case "RAINY_DAY":
          return {
            matches: item.isRainyDayEligible,
            suppressed: item.isSuppressedForRainyDay,
          };
        case "BIRTHDAY":
          return {
            matches: item.isBirthdayMonthOrWeek,
            suppressed: item.isSuppressedForBirthday,
          };
        case "VIP":
          return {
            matches: item.abcClass === "A",
            suppressed: false,
          };
        case "ALL":
        default:
          return {
            matches: true,
            suppressed: false,
          };
      }
    };

    const countSegment = (seg: CrmFilter) =>
      enriched.filter((item) => {
        const { matches, suppressed } = matchesSegment(item, seg);
        if (!matches) return false;
        if (hideContacted && suppressed) return false;
        return true;
      }).length;

    const summary = {
      totalCustomers: enriched.length,
      totalRevenue: totalTenantRevenue,
      todayCount: countSegment("TODAY"),
      budgetRecoveryCount: countSegment("BUDGET_RECOVERY"),
      coatingDueCount: countSegment("COATING_WARRANTY"),
      churnRiskCount: countSegment("CHURN_RISK"),
      postSaleCount: countSegment("POST_SALE"),
      rainyDayCount: countSegment("RAINY_DAY"),
      birthdayCount: countSegment("BIRTHDAY"),
      vipCount: enriched.filter((c) => c.abcClass === "A").length,
      allCount: enriched.length,
      contactedLast30Days: sentLogsLast45d.filter(
        (l) => l.createdAt.getTime() >= days30Ago.getTime()
      ).length,
      roi30dRevenue: roundMoney(roi30dRevenue),
      roi30dOrdersCount,
    };

    // Passo 6: Filtrar lista da aba selecionada + busca textual `q` + ordenação + paginação
    let filtered = enriched
      .map((item) => {
        const { matches, suppressed } = matchesSegment(item, filter);
        return { item, matches, suppressed };
      })
      .filter(({ matches, suppressed }) => {
        if (!matches) return false;
        if (hideContacted && suppressed) return false;
        return true;
      })
      .map(({ item, suppressed }) => ({
        ...item,
        isSuppressedInCurrentTab: suppressed,
      }));

    if (queryText) {
      filtered = filtered.filter((c) => {
        const haystacks = [
          c.name,
          c.phone,
          c.whatsapp,
          c.email,
          c.mainVehicle?.plate,
          c.mainVehicle?.model,
          c.mainVehicle?.brand,
          c.reasonTitle,
        ];
        return haystacks.some((h) => h && h.toLowerCase().includes(queryText));
      });
    }

    // Ordenação específica da aba
    if (filter === "TODAY") {
      filtered.sort(
        (a, b) =>
          b.todayPriority - a.todayPriority || b.totalSpent - a.totalSpent
      );
    } else if (filter === "BUDGET_RECOVERY") {
      filtered.sort(
        (a, b) =>
          (b.latestOpenBudget?.daysOpen || 0) -
            (a.latestOpenBudget?.daysOpen || 0) ||
          b.openBudgetTotal - a.openBudgetTotal
      );
    } else if (filter === "BIRTHDAY") {
      filtered.sort(
        (a, b) =>
          (a.birthdayDaysUntil ?? 999) - (b.birthdayDaysUntil ?? 999) ||
          b.totalSpent - a.totalSpent
      );
    } else if (filter === "CHURN_RISK") {
      filtered.sort(
        (a, b) =>
          (b.daysSinceLastVisit ?? 0) - (a.daysSinceLastVisit ?? 0) ||
          b.totalSpent - a.totalSpent
      );
    } else if (filter === "COATING_WARRANTY") {
      filtered.sort(
        (a, b) =>
          (b.protectionInfo?.daysSince ?? 0) -
            (a.protectionInfo?.daysSince ?? 0) || b.totalSpent - a.totalSpent
      );
    } else {
      filtered.sort((a, b) => b.totalSpent - a.totalSpent);
    }

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;
    const paginatedCustomers = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      tenant: {
        name: tenant?.tradingName || tenant?.name || "Sua Estética",
        googleReviewUrl: tenant?.googleReviewUrl || null,
      },
      summary,
      customers: paginatedCustomers,
      pagination: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
      },
      filter,
      hideContacted,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
