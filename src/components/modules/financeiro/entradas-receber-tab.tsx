"use client";

import Link from "next/link";
import { Car, CheckCircle2, Clock, CreditCard, Receipt } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  DREOverviewData,
  PAYMENT_METHOD_LABELS,
  ReadyOrderItem,
  formatMoney,
} from "./types";

interface EntradasReceberTabProps {
  data: DREOverviewData;
  onReceiveOrder: (order: ReadyOrderItem) => void;
}

export function EntradasReceberTab({
  data,
  onReceiveOrder,
}: EntradasReceberTabProps) {
  const readyOrders = data.receivables?.readyOrders || [];
  const recentPayments = data.recentPayments || [];

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumo de Recebimentos e A Receber */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pronto para Receber (OS Concluídas)"
          value={
            <span className="text-[#247653]">
              {formatMoney(data.receivables?.readyTotal)}
            </span>
          }
          subtitle={`${data.receivables?.readyCount || 0} veículo(s) com saldo em aberto`}
          icon={<Car className="w-5 h-5" />}
          variant="brand"
        />

        <StatCard
          label="Em Produção no Pátio (Saldo)"
          value={formatMoney(data.receivables?.inProgressTotal)}
          subtitle={`${data.receivables?.inProgressCount || 0} OS em fila ou execução`}
          icon={<Clock className="w-5 h-5" />}
          variant="info"
        />

        <StatCard
          label="Já Recebido Líquido no Período"
          value={
            <span className="text-[#16A36A]">
              {formatMoney(data.netReceived ?? data.netRevenue)}
            </span>
          }
          subtitle={
            (data.cardFees ?? 0) > 0
              ? `Bruto ${formatMoney(data.grossReceived)} • Taxas -${formatMoney(
                  data.cardFees
                )}`
              : `${recentPayments.length} pagamento(s) confirmado(s)`
          }
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="success"
        />
      </div>

      {/* Bloco 1: OS Prontas Aguardando Recebimento */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[16px] font-semibold text-[#252B27]">
            Ordens de Serviço Prontas para Receber
          </h3>
          <p className="text-[13px] text-[#737D75]">
            Veículos finalizados no pátio com saldo pendente. Você pode receber o
            valor total ou lançar sinais parciais.
          </p>
        </div>

        {readyOrders.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-6 h-6" />}
            title="Nenhum pagamento pendente de OS pronta"
            description="Todas as ordens de serviço marcadas como Prontas já tiveram o pagamento confirmado."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>OS</TableHead>
                <TableHead>Placa / Veículo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço Principal</TableHead>
                <TableHead>Finalizado em</TableHead>
                <TableHead>Saldo a Receber</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readyOrders.map((order) => {
                const paid = order.paidAmount ?? 0;
                const remaining =
                  order.remainingAmount ??
                  Math.max(0, order.totalAmount - paid);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-bold">
                      <Link
                        href={`/os/${order.id}`}
                        className="text-[#247653] hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="mercosul-plate text-[11px] font-bold">
                          {order.plate}
                        </span>
                        <span className="text-[13px] text-[#343C36]">
                          {order.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#252B27]">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#737D75]">
                      {order.mainService}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#737D75]">
                      {formatDateTime(order.completedAt || order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-[#247653]">
                        {formatMoney(remaining)}
                      </div>
                      {paid > 0 && (
                        <div className="text-[11px] text-[#D97706] font-medium">
                          Já pago: {formatMoney(paid)} de{" "}
                          {formatMoney(order.totalAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onReceiveOrder(order)}
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                      >
                        Receber
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Bloco 2: Histórico de Pagamentos Reais */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[16px] font-semibold text-[#252B27]">
            Histórico de Pagamentos Recebidos no Período
          </h3>
          <p className="text-[13px] text-[#737D75]">
            Cada entrada confirmada (incluindo sinais parciais), método, parcelas
            e valor líquido após taxa da maquininha.
          </p>
        </div>

        {recentPayments.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            title="Nenhum pagamento registrado neste período"
            description="Quando você receber uma Ordem de Serviço ou sinal, o comprovante de entrada aparecerá aqui."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Data / Hora</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Veículo / Placa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Líquido Caixa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment) => {
                const feeAmount = payment.feeAmount ?? 0;
                const netAmount =
                  payment.netAmount && payment.netAmount > 0
                    ? payment.netAmount
                    : Math.max(0, payment.amount - feeAmount);
                const isPartial =
                  payment.orderStatus && payment.orderStatus !== "PAID";

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="text-[13px] text-[#737D75] whitespace-nowrap">
                      {formatDateTime(payment.paidAt)}
                    </TableCell>
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/os/${payment.serviceOrderId}`}
                          className="text-[#247653] hover:underline"
                        >
                          #{payment.orderNumber}
                        </Link>
                        {isPartial && (
                          <Badge variant="warning" size="sm">
                            Sinal
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="mercosul-plate text-[11px] font-bold">
                          {payment.plate}
                        </span>
                        <span className="text-[13px] text-[#343C36]">
                          {payment.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#252B27]">
                      {payment.customerName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="brand" size="sm">
                          {PAYMENT_METHOD_LABELS[payment.method] ||
                            payment.method}
                        </Badge>
                        {(payment.installments ?? 1) > 1 && (
                          <Badge variant="neutral" size="sm">
                            {payment.installments}x
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-[#252B27] whitespace-nowrap">
                      {formatMoney(payment.amount)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] text-[#DC4C4C] whitespace-nowrap">
                      {feeAmount > 0 ? `- ${formatMoney(feeAmount)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#16A36A] whitespace-nowrap">
                      {formatMoney(netAmount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
