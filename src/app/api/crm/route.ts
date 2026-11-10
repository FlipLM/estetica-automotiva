import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "ALL"; // ALL | RAINY_DAY | CHURN_RISK | COATING_WARRANTY | POST_SALE | VIP

    const now = new Date();
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Busca todos os clientes do tenant com seus veículos e ordens de serviço
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        vehicles: {
          include: {
            serviceOrders: {
              where: {
                status: { in: ["DONE", "PAID"] },
              },
              include: {
                items: true,
              },
              orderBy: {
                completedAt: "desc",
              },
            },
          },
        },
      },
    });

    // Mapeamento e métricas de LTV, Recorrência e Classificação ABC
    const analyzedCustomers = customers.map((c) => {
      // Coletar todas as OS dos veículos do cliente
      const allOrders = c.vehicles.flatMap((v) => v.serviceOrders);
      allOrders.sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });

      const totalSpent = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const ordersCount = allOrders.length;
      const lastOrder = allOrders[0] || null;

      const lastVisitDate = lastOrder?.completedAt ? new Date(lastOrder.completedAt) : null;
      const daysSinceLastVisit = lastVisitDate
        ? Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Veículo principal
      const primaryVehicle = c.vehicles[0] || null;

      // Histórico de serviços realizados
      const allItems = allOrders.flatMap((o) => o.items);
      const hasCoating = allItems.some((i) =>
        i.serviceName.toLowerCase().includes("vitrifica")
      );
      const hasInteriorClean = allItems.some((i) =>
        i.serviceName.toLowerCase().includes("higieniza")
      );

      // Status de retenção
      const isChurnRisk = daysSinceLastVisit !== null && daysSinceLastVisit >= 45;
      const isPostSaleReady = daysSinceLastVisit !== null && daysSinceLastVisit >= 1 && daysSinceLastVisit <= 3;
      const isCoatingDue = hasCoating && daysSinceLastVisit !== null && daysSinceLastVisit >= 150;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp || c.phone,
        email: c.email,
        totalSpent,
        ordersCount,
        lastVisitDate,
        daysSinceLastVisit,
        primaryVehicle: primaryVehicle
          ? {
              plate: primaryVehicle.plate,
              model: primaryVehicle.model,
              category: primaryVehicle.category,
            }
          : null,
        lastServiceName: lastOrder?.items[0]?.serviceName || "Lavagem",
        hasCoating,
        hasInteriorClean,
        isChurnRisk,
        isPostSaleReady,
        isCoatingDue,
        classification: "C", // Será calculado após ordenar por LTV
      };
    });

    // Ordenar por LTV para calcular a Curva ABC
    analyzedCustomers.sort((a, b) => b.totalSpent - a.totalSpent);

    const totalTenantRevenue = analyzedCustomers.reduce((acc, c) => acc + c.totalSpent, 0);
    let accumulated = 0;

    analyzedCustomers.forEach((c) => {
      accumulated += c.totalSpent;
      const ratio = totalTenantRevenue > 0 ? accumulated / totalTenantRevenue : 1;
      if (ratio <= 0.7) {
        c.classification = "A"; // Top 70% da receita
      } else if (ratio <= 0.9) {
        c.classification = "B"; // Próximos 20% da receita
      } else {
        c.classification = "C"; // Base restante 10%
      }
    });

    // Filtragem por campanha ou segmento solicitado
    let filtered = analyzedCustomers;

    if (filter === "RAINY_DAY") {
      // Clientes para serviços internos que não dependem do tempo seco
      filtered = analyzedCustomers.filter(
        (c) => c.primaryVehicle !== null
      );
    } else if (filter === "CHURN_RISK") {
      filtered = analyzedCustomers.filter((c) => c.isChurnRisk);
    } else if (filter === "COATING_WARRANTY") {
      filtered = analyzedCustomers.filter((c) => c.isCoatingDue || c.hasCoating);
    } else if (filter === "POST_SALE") {
      filtered = analyzedCustomers.filter((c) => c.isPostSaleReady);
    } else if (filter === "VIP") {
      filtered = analyzedCustomers.filter((c) => c.classification === "A");
    }

    // Métricas para o Dashboard do CRM
    const summary = {
      totalCustomers: analyzedCustomers.length,
      vipCustomersCount: analyzedCustomers.filter((c) => c.classification === "A").length,
      churnRiskCount: analyzedCustomers.filter((c) => c.isChurnRisk).length,
      coatingDueCount: analyzedCustomers.filter((c) => c.isCoatingDue).length,
      postSalePendingCount: analyzedCustomers.filter((c) => c.isPostSaleReady).length,
      averageLTV:
        analyzedCustomers.length > 0
          ? totalTenantRevenue / analyzedCustomers.length
          : 0,
    };

    return NextResponse.json({
      summary,
      customers: filtered,
    });
  } catch (error: any) {
    console.error("Erro na inteligência do CRM:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

