"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
  StatCard,
} from "@/components/ui";
import {
  CATEGORY_LABELS,
  DREOverviewData,
  ExpenseItem,
  ReadyOrderItem,
  formatMoney,
  formatShortDate,
  getDaysDiffFromToday,
} from "./types";

interface ResumoSimplesTabProps {
  data: DREOverviewData;
  onPayExpense: (expense: ExpenseItem) => void;
  onReceiveOrder: (order: ReadyOrderItem) => void;
  onGoToPayables: (status?: "ALL" | "OVERDUE" | "PENDING") => void;
  onGoToReceivables: () => void;
}

export function ResumoSimplesTab({
  data,
  onPayExpense,
  onReceiveOrder,
  onGoToPayables,
  onGoToReceivables,
}: ResumoSimplesTabProps) {
  const pm = data.paymentMethodBreakdown || {
    PIX: 0,
    CREDIT_CARD: 0,
    DEBIT_CARD: 0,
    CASH: 0,
    TRANSFER: 0,
  };
  const cardsTotal = pm.CREDIT_CARD + pm.DEBIT_CARD;
  const isPositiveBalance = data.netProfit >= 0;
  const cardFees = data.cardFees ?? 0;

  const paymentChannels = [
    { key: "PIX", label: "PIX", amount: pm.PIX, tone: "brand" as const },
    {
      key: "CREDIT_CARD",
      label: "Cartão de Crédito",
      amount: pm.CREDIT_CARD,
      tone: "info" as const,
    },
    {
      key: "DEBIT_CARD",
      label: "Cartão de Débito",
      amount: pm.DEBIT_CARD,
      tone: "success" as const,
    },
    {
      key: "CASH",
      label: "Dinheiro",
      amount: pm.CASH,
      tone: "warning" as const,
    },
    {
      key: "TRANSFER",
      label: "Transferência",
      amount: pm.TRANSFER,
      tone: "brand" as const,
    },
  ];

  const totalPaymentsReceived = paymentChannels.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const expenseCategories = Object.entries(data.expenseBreakdown || {})
    .map(([key, amount]) => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      amount: amount || 0,
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const attentionExpenses = data.payables?.attentionExpenses || [];
  const readyOrders = data.receivables?.readyOrders || [];

  return (
    <div className="space-y-6">
      {/* 4 Cards Principais em Linguagem Humana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Entrou no Caixa (Líquido)"
          value={
            <span className="text-[#247653]">
              {formatMoney(data.netReceived ?? data.netRevenue)}
            </span>
          }
          subtitle={
            totalPaymentsReceived > 0
              ? cardFees > 0
                ? `Bruto ${formatMoney(data.grossReceived)} • Taxas -${formatMoney(
                    cardFees
                  )}`
                : `PIX ${formatMoney(pm.PIX)} • Cartão ${formatMoney(
                    cardsTotal
                  )} • Dinheiro ${formatMoney(pm.CASH)}`
              : "Nenhum recebimento no período"
          }
          icon={<ArrowUpCircle className="w-5 h-5" />}
          variant="brand"
        />

        <StatCard
          label="Saiu do Caixa"
          value={
            <span className="text-[#DC4C4C]">
              {formatMoney(data.totalExpenses)}
            </span>
          }
          subtitle={`Produtos ${formatMoney(
            data.variableCosts?.products
          )} • Contas ${formatMoney(data.fixedCosts?.total)}`}
          icon={<ArrowDownCircle className="w-5 h-5" />}
          variant="error"
        />

        <StatCard
          label="Sobrou no Bolso"
          value={
            <span
              className={
                isPositiveBalance ? "text-[#16A36A]" : "text-[#DC4C4C]"
              }
            >
              {formatMoney(data.netProfit)}
            </span>
          }
          subtitle={
            isPositiveBalance
              ? "Caixa positivo após taxas e contas pagas"
              : "Saídas maiores que as entradas neste período"
          }
          trend={{
            value: `${data.netMarginPercentage.toFixed(1)}% de sobra`,
            positive: isPositiveBalance,
          }}
          icon={<Wallet className="w-5 h-5" />}
          variant={isPositiveBalance ? "success" : "error"}
        />

        <StatCard
          label="A Receber vs. A Pagar"
          value={
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[#16A36A] text-[20px]">
                +{formatMoney(data.receivables?.readyTotal)}
              </span>
              <span className="text-[#9CA49E] text-[14px] font-normal">/</span>
              <span className="text-[#D97706] text-[18px]">
                -{formatMoney(data.payables?.pendingTotal)}
              </span>
            </div>
          }
          subtitle={`${data.receivables?.readyCount || 0} carro(s) pronto(s) • ${
            data.payables?.overdueCount || 0
          } conta(s) atrasada(s)`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant={
            (data.payables?.overdueCount || 0) > 0 ? "warning" : "info"
          }
        />
      </div>

      {/* Bloco Atenção Hoje */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contas atrasadas ou vencendo nos próximos 7 dias */}
        <Card padding="none" className="overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#E7EAE7] bg-[#F7F8F6] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#252B27]">
                  Atenção Hoje — Contas a Pagar
                </h3>
                <p className="text-[12px] text-[#737D75]">
                  Contas atrasadas ou que vencem nos próximos 7 dias
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onGoToPayables(
                  (data.payables?.overdueCount || 0) > 0 ? "OVERDUE" : "PENDING"
                )
              }
            >
              Ver todas
            </Button>
          </div>

          <div className="p-5 flex-1">
            {attentionExpenses.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#16A36A] mx-auto" />
                <p className="text-[14px] font-semibold text-[#252B27]">
                  Nenhuma conta urgente para pagar!
                </p>
                <p className="text-[12px] text-[#737D75]">
                  Sem contas atrasadas nem vencimentos nos próximos 7 dias.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F3F1]">
                {attentionExpenses.slice(0, 6).map((expense) => {
                  const diff = getDaysDiffFromToday(expense.dueDate);
                  const overdue = diff < 0;
                  return (
                    <div
                      key={expense.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-semibold text-[#252B27] truncate">
                            {expense.description}
                          </span>
                          <Badge
                            variant={overdue ? "error" : "warning"}
                            size="sm"
                            dot
                          >
                            {overdue
                              ? `Atrasada (${Math.abs(diff)}d)`
                              : diff === 0
                              ? "Vence hoje"
                              : `Vence em ${diff}d`}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-[#737D75]">
                          {CATEGORY_LABELS[expense.category] || expense.category} •
                          Vencimento: {formatShortDate(expense.dueDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[14px] font-bold text-[#252B27]">
                          {formatMoney(expense.amount)}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onPayExpense(expense)}
                        >
                          Pagar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Carros prontos aguardando pagamento */}
        <Card padding="none" className="overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#E7EAE7] bg-[#F7F8F6] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#E9F3EC] text-[#247653] flex items-center justify-center shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#252B27]">
                  Carros Prontos Aguardando Pagamento
                </h3>
                <p className="text-[12px] text-[#737D75]">
                  Serviços finalizados no pátio prontos para receber
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onGoToReceivables}>
              Ver entradas
            </Button>
          </div>

          <div className="p-5 flex-1">
            {readyOrders.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-[#9CA49E] mx-auto" />
                <p className="text-[14px] font-semibold text-[#252B27]">
                  Nenhum carro aguardando pagamento
                </p>
                <p className="text-[12px] text-[#737D75]">
                  Quando uma OS for marcada como &ldquo;Pronto&rdquo; no pátio,
                  ela aparece aqui para você dar baixa.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F3F1]">
                {readyOrders.slice(0, 6).map((order) => {
                  const remaining =
                    order.remainingAmount ??
                    Math.max(0, order.totalAmount - (order.paidAmount ?? 0));
                  return (
                    <div
                      key={order.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="mercosul-plate text-[11px] font-bold">
                            {order.plate}
                          </span>
                          <span className="text-[13px] font-semibold text-[#252B27] truncate">
                            {order.customerName}
                          </span>
                          {(order.paidAmount ?? 0) > 0 && (
                            <Badge variant="warning" size="sm">
                              Parcial
                            </Badge>
                          )}
                        </div>
                        <p className="text-[12px] text-[#737D75] truncate">
                          OS #{order.orderNumber} • {order.model} •{" "}
                          {order.mainService}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[14px] font-bold text-[#247653]">
                          {formatMoney(remaining)}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onReceiveOrder(order)}
                          leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                        >
                          Receber
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 2 Blocos Visuais Simples (Barras Limpas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Por onde o dinheiro entrou</CardTitle>
              <CardDescription>
                Valor bruto recebido por forma de pagamento (inclui sinais){" "}
                <Link
                  href="/configuracoes#taxas-maquininha"
                  className="text-[#247653] hover:underline inline-flex items-center gap-1 ml-1 font-medium"
                >
                  <Settings className="w-3 h-3" /> Configurar taxas
                </Link>
              </CardDescription>
            </div>
            <Badge variant="brand" size="sm">
              {formatMoney(totalPaymentsReceived)}
            </Badge>
          </CardHeader>
          <CardContent>
            {totalPaymentsReceived <= 0 ? (
              <p className="text-[13px] text-[#737D75] py-4 text-center">
                Ainda não houve recebimentos registrados neste período.
              </p>
            ) : (
              <div className="space-y-3.5">
                {paymentChannels.map((ch) => {
                  const pct =
                    totalPaymentsReceived > 0
                      ? Math.round((ch.amount / totalPaymentsReceived) * 100)
                      : 0;
                  return (
                    <div key={ch.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[#252B27]">
                          {ch.label}
                        </span>
                        <span className="font-semibold text-[#252B27]">
                          {formatMoney(ch.amount)}{" "}
                          <span className="text-[#737D75] font-normal">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <ProgressBar
                        value={ch.amount}
                        max={totalPaymentsReceived}
                        tone={ch.tone}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Para onde o dinheiro foi</CardTitle>
              <CardDescription>
                Ranking das contas que já saíram do caixa por tipo de gasto
              </CardDescription>
            </div>
            <Badge variant="error" size="sm">
              {formatMoney(data.totalExpenses)}
            </Badge>
          </CardHeader>
          <CardContent>
            {expenseCategories.length === 0 ? (
              <p className="text-[13px] text-[#737D75] py-4 text-center">
                Nenhuma despesa paga registrada neste período.
              </p>
            ) : (
              <div className="space-y-3.5">
                {expenseCategories.map((cat) => {
                  const pct =
                    data.totalExpenses > 0
                      ? Math.round((cat.amount / data.totalExpenses) * 100)
                      : 0;
                  return (
                    <div key={cat.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-[#252B27]">
                          {cat.label}
                        </span>
                        <span className="font-semibold text-[#252B27]">
                          {formatMoney(cat.amount)}{" "}
                          <span className="text-[#737D75] font-normal">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <ProgressBar
                        value={cat.amount}
                        max={data.totalExpenses}
                        tone={
                          cat.key === "PRODUCTS" || cat.key === "COMMISSION"
                            ? "warning"
                            : "error"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
