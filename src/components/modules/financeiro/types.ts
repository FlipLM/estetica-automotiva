export interface DREOverviewData {
  period: string;
  startDate: string;
  endDate: string;
  ordersCount: number;
  paymentsCount?: number;
  averageTicket: number;
  grossReceived: number;
  cardFees: number;
  netReceived: number;
  grossRevenue: number;
  discounts: number;
  netRevenue: number;
  variableCosts: {
    products: number;
    commissions: number;
    total: number;
  };
  grossProfit: number;
  grossMarginPercentage: number;
  fixedCosts: {
    rent: number;
    utilities: number;
    salaries: number;
    maintenance: number;
    marketing: number;
    other: number;
    total: number;
  };
  totalExpenses: number;
  netProfit: number;
  netMarginPercentage: number;
  expenseBreakdown: Record<string, number>;
  paymentMethodBreakdown: {
    PIX: number;
    CREDIT_CARD: number;
    DEBIT_CARD: number;
    CASH: number;
    TRANSFER: number;
  };
  paymentMethodNetBreakdown?: {
    PIX: number;
    CREDIT_CARD: number;
    DEBIT_CARD: number;
    CASH: number;
    TRANSFER: number;
  };
  receivables: {
    readyCount: number;
    readyTotal: number;
    inProgressCount: number;
    inProgressTotal: number;
    readyOrders: ReadyOrderItem[];
  };
  payables: {
    overdueCount: number;
    overdueTotal: number;
    upcomingCount: number;
    upcomingTotal: number;
    pendingTotal: number;
    attentionExpenses: ExpenseItem[];
  };
  recentPayments: RecentPaymentItem[];
}

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  paid: boolean;
  paidAt?: string | null;
  paymentMethod?: string | null;
  supplier?: string | null;
  recurrenceGroupId?: string | null;
  recurrenceType?: string;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  notes?: string | null;
  stockMovement?: {
    id: string;
    productId: string;
    type: string;
  } | null;
}

export interface ReadyOrderItem {
  id: string;
  orderNumber: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  completedAt?: string | null;
  createdAt: string;
  plate: string;
  model: string;
  customerName: string;
  customerPhone?: string | null;
  mainService: string;
}

export interface RecentPaymentItem {
  id: string;
  amount: number;
  method: string;
  installments?: number;
  feeRate?: number;
  feeAmount?: number;
  netAmount?: number;
  paidAt: string;
  notes?: string | null;
  serviceOrderId: string;
  orderNumber: number;
  orderStatus?: string;
  orderTotalAmount?: number;
  orderPaidAmount?: number;
  plate: string;
  model: string;
  customerName: string;
}

export interface DailyCashData {
  date: string;
  summary: {
    cashIn: number;
    cashOut: number;
    cashDrawerBalance: number;
    digitalIn: number;
    digitalOut: number;
    digitalBalance: number;
    totalGrossIn: number;
    totalCardFees: number;
    totalNetIn: number;
    totalOut: number;
    dayNetBalance: number;
    paymentsCount: number;
    expensesCount: number;
  };
  incomeByMethod: Array<{
    method: string;
    count: number;
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
  }>;
  expenseByMethod: Record<string, number>;
  payments: RecentPaymentItem[];
  expenses: ExpenseItem[];
}

export const CATEGORY_LABELS: Record<string, string> = {
  PRODUCTS: "Insumos & Produtos",
  COMMISSION: "Comissões",
  SALARY: "Salários & Pró-labore",
  RENT: "Aluguel & Ponto",
  UTILITIES: "Água, Luz e Internet",
  MAINTENANCE: "Manutenção de Equipamentos",
  MARKETING: "Marketing & Anúncios",
  OTHER: "Outras Despesas",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
  BOLETO: "Boleto",
  OTHER: "Outro",
};

export const PERIOD_OPTIONS = [
  { value: "current_month", label: "Mês Atual" },
  { value: "last_month", label: "Mês Anterior" },
  { value: "7_days", label: "Últimos 7 dias" },
  { value: "year", label: "Ano Atual" },
];

export function formatMoney(val: number | null | undefined): string {
  return `R$ ${(val ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatShortDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

export function isExpenseOverdue(
  expense: Pick<ExpenseItem, "paid" | "dueDate">
): boolean {
  if (expense.paid) return false;
  const due = new Date(expense.dueDate);
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  return due < todayStart;
}

export function getDaysDiffFromToday(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const dueDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
    0,
    0,
    0,
    0
  );
  return Math.round(
    (dueDay.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );
}
