export type CrmSegment =
  | "TODAY"
  | "BUDGET_RECOVERY"
  | "COATING_WARRANTY"
  | "CHURN_RISK"
  | "POST_SALE"
  | "RAINY_DAY"
  | "BIRTHDAY"
  | "VIP"
  | "ALL";

export type CrmCampaign =
  | "BUDGET_RECOVERY"
  | "COATING_WARRANTY"
  | "CHURN_RISK"
  | "POST_SALE"
  | "RAINY_DAY"
  | "BIRTHDAY"
  | "VIP"
  | "MANUAL";

export interface CrmVehicleSummary {
  id: string;
  plate: string;
  brand: string | null;
  model: string;
  color: string | null;
}

export interface CrmOpenBudgetSummary {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  vehicleId: string;
  createdAt: string;
  daysOpen: number;
}

export interface CrmProtectionSummary {
  orderId: string;
  vehicleId: string;
  serviceName: string;
  visitDate: string;
  intervalDays: number;
  daysSince: number;
}

export interface CrmContactSummary {
  id: string;
  campaign: string;
  outcome: string;
  snoozeUntil: string | null;
  createdAt: string;
  daysAgo: number;
}

export interface CrmCustomer {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  whatsappDigits: string | null;
  hasValidWhatsApp: boolean;
  email: string | null;
  birthDate: string | null;
  birthdayDaysUntil: number | null;
  isBirthdayMonthOrWeek: boolean;
  isBirthdaySoon: boolean;
  totalSpent: number;
  ordersCount: number;
  lastVisitAt: string | null;
  daysSinceLastVisit: number | null;
  lastServiceNames: string[];
  mainVehicle: CrmVehicleSummary | null;
  vehiclesCount: number;
  hasOpenBudget: boolean;
  isStaleBudget: boolean;
  openBudgetTotal: number;
  latestOpenBudget: CrmOpenBudgetSummary | null;
  protectionInfo: CrmProtectionSummary | null;
  isCoatingDue: boolean;
  isChurnRisk: boolean;
  isPostSale: boolean;
  isRecentPostSale: boolean;
  isRainyDayEligible: boolean;
  latestContact: CrmContactSummary | null;
  isSnoozed: boolean;
  abcClass: "A" | "B" | "C";
  tierLabel: string;
  primaryCampaign: CrmCampaign;
  todayPriority: number;
  reasonTitle: string;
  targetOrderId: string | null;
  targetVehicleId: string | null;
  isSuppressedInCurrentTab?: boolean;
}

export type CrmPeriod =
  | "7d"
  | "30d"
  | "60d"
  | "90d"
  | "month"
  | "all"
  | "custom";

export interface CrmSummary {
  totalCustomers: number;
  totalRevenue: number;
  todayCount: number;
  budgetRecoveryCount: number;
  coatingDueCount: number;
  churnRiskCount: number;
  postSaleCount: number;
  rainyDayCount: number;
  birthdayCount: number;
  vipCount: number;
  allCount: number;
  contactedLast30Days: number;
  roi30dRevenue: number;
  roi30dOrdersCount: number;
  period?: CrmPeriod;
  periodLabel?: string;
  churnDays?: number;
}

export interface CrmPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface CrmTenantInfo {
  name: string;
  googleReviewUrl: string | null;
}

export function resolveEffectiveCampaign(
  customer: CrmCustomer,
  activeTab: CrmSegment
): CrmCampaign {
  if (activeTab === "TODAY" || activeTab === "ALL") {
    return customer.primaryCampaign;
  }
  return activeTab;
}

export function buildCrmTemplateMessage(
  customer: CrmCustomer,
  campaign: CrmCampaign,
  tenant: CrmTenantInfo
): string {
  const firstName = customer.name.trim().split(/\s+/)[0] || "Cliente";
  const carLabel = customer.mainVehicle
    ? `${customer.mainVehicle.model}${
        customer.mainVehicle.plate ? ` (${customer.mainVehicle.plate})` : ""
      }`
    : "seu carro";
  const shopName = tenant.name || "nossa estética automotiva";

  switch (campaign) {
    case "BUDGET_RECOVERY": {
      const budgetRef = customer.latestOpenBudget
        ? ` (#${customer.latestOpenBudget.orderNumber})`
        : "";
      return `Olá ${firstName}! Tudo bem?\n\nPassando aqui da ${shopName} para saber se ficou alguma dúvida sobre o orçamento${budgetRef} que preparamos para o ${carLabel}.\n\nSe quiser, consigo encaixar um horário especial nesta semana para deixarmos ele impecável. Posso verificar a agenda para você?`;
    }
    case "COATING_WARRANTY": {
      const serviceName =
        customer.protectionInfo?.serviceName || "proteção de pintura";
      const days = customer.protectionInfo?.daysSince ?? 180;
      return `Olá ${firstName}, tudo bem?\n\nJá faz cerca de ${days} dias desde o serviço de ${serviceName} no ${carLabel}.\n\nPara manter o brilho, a repelência e a proteção em dia, recomendamos uma revisão de manutenção. Gostaria de agendar um horário nesta semana na ${shopName}?`;
    }
    case "POST_SALE": {
      const base = `Olá ${firstName}! Tudo bem?\n\nAqui é da ${shopName}. Obrigado por confiar o ${carLabel} à nossa equipe! Ficou tudo 100% do jeito que você esperava com o resultado?`;
      if (tenant.googleReviewUrl) {
        return `${base}\n\nSe tiver 30 segundinhos, sua avaliação no Google ajuda muito nosso trabalho:\n${tenant.googleReviewUrl}`;
      }
      return `${base}\n\nQualquer detalhe que precisar, estamos à disposição!`;
    }
    case "CHURN_RISK": {
      const days = customer.daysSinceLastVisit ?? 45;
      return `Olá ${firstName}! Sentimos sua falta aqui na ${shopName}.\n\nJá fazem ${days} dias que o ${carLabel} não passa por um cuidado especial conosco.\n\nEsta semana temos horários disponíveis com uma atenção especial na lavagem técnica e proteção. Vamos agendar?`;
    }
    case "RAINY_DAY":
      return `Olá ${firstName}, tudo bem?\n\nChuva por aí? Aqui na ${shopName} estamos com condições especiais para limpeza interna, higienização e proteção de vidros (cristalização) para o ${carLabel} não sofrer com o tempo chuvoso.\n\nSe quiser aproveitar hoje sem fila, só responder aqui!`;
    case "BIRTHDAY":
      return `Parabéns, ${firstName}! 🎉\n\nToda a equipe da ${shopName} deseja um feliz aniversário com muita saúde e sucesso!\n\nPara comemorar com você, preparamos um mimo especial quando trouxer o ${carLabel} neste mês. Quer reservar um horário?`;
    case "VIP":
      return `Olá ${firstName}, tudo bem?\n\nComo você é um dos nossos clientes Ouro aqui da ${shopName}, queremos saber quando o ${carLabel} vem para a próxima manutenção preventiva com atendimento prioritário.`;
    case "MANUAL":
    default:
      return `Olá ${firstName}, tudo bem? Passando aqui da ${shopName} para saber como está o ${carLabel} e colocar nossa agenda à disposição!`;
  }
}
