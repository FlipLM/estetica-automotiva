"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Calendar,
  Download,
  Landmark,
  Printer,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { formatDateInputValue } from "@/lib/date-utils";
import {
  CATEGORY_LABELS,
  DailyCashData,
  PAYMENT_METHOD_LABELS,
  formatMoney,
} from "./types";

interface CaixaDoDiaTabProps {
  refreshKey?: number;
}

export function CaixaDoDiaTab({ refreshKey = 0 }: CaixaDoDiaTabProps) {
  const [date, setDate] = useState<string>(formatDateInputValue(new Date()));
  const [data, setData] = useState<DailyCashData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyCash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financial/daily-cash?date=${date}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao carregar caixa do dia:", err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDailyCash();
  }, [fetchDailyCash, refreshKey]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows: string[][] = [
      ["Tipo", "Hora", "Descricao / OS", "Metodo", "Bruto (R$)", "Taxa (R$)", "Liquido (R$)"],
    ];

    for (const p of data.payments) {
      rows.push([
        "ENTRADA",
        new Date(p.paidAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        `OS #${p.orderNumber} - ${p.plate} (${p.customerName})`,
        PAYMENT_METHOD_LABELS[p.method] || p.method,
        p.amount.toFixed(2).replace(".", ","),
        (p.feeAmount ?? 0).toFixed(2).replace(".", ","),
        (p.netAmount ?? p.amount).toFixed(2).replace(".", ","),
      ]);
    }

    for (const e of data.expenses) {
      rows.push([
        "SAIDA",
        e.paidAt
          ? new Date(e.paidAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        e.description,
        PAYMENT_METHOD_LABELS[e.paymentMethod || "OTHER"] ||
          e.paymentMethod ||
          "Outro",
        (-e.amount).toFixed(2).replace(".", ","),
        "0,00",
        (-e.amount).toFixed(2).replace(".", ","),
      ]);
    }

    rows.push([]);
    rows.push([
      "RESUMO",
      "",
      "Dinheiro na Gaveta (Especie)",
      "CASH",
      "",
      "",
      data.summary.cashDrawerBalance.toFixed(2).replace(".", ","),
    ]);
    rows.push([
      "RESUMO",
      "",
      "Total Digital / Banco",
      "PIX/CARTAO/TRANSF",
      "",
      "",
      data.summary.digitalBalance.toFixed(2).replace(".", ","),
    ]);
    rows.push([
      "RESUMO",
      "",
      "Saldo Liquido do Dia",
      "GERAL",
      "",
      "",
      data.summary.dayNetBalance.toFixed(2).replace(".", ","),
    ]);

    const csv =
      "\uFEFF" +
      rows
        .map((cols) =>
          cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vulpto-caixa-${data.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Barra de Data e Ações */}
      <div className="bg-white border border-[#E7EAE7] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-card print:border-0 print:shadow-none">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#252B27]">
            <Calendar className="w-4 h-4 text-[#247653]" />
            <span>Conferência do Dia:</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Selecionar data do caixa do dia"
            className="h-9 bg-white border border-[#E7EAE7] rounded-[8px] px-3 text-[13px] font-medium text-[#252B27] focus:outline-none focus:border-[#247653]"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDate(formatDateInputValue(new Date()))}
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!data}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir Conferência
          </Button>
        </div>
      </div>

      {loading || !data ? (
        <LoadingState message="Carregando fechamento do dia..." />
      ) : (
        <>
          {/* 3 Cards em Destaque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Dinheiro na Gaveta (Espécie)"
              value={
                <span
                  className={
                    data.summary.cashDrawerBalance >= 0
                      ? "text-[#247653]"
                      : "text-[#DC4C4C]"
                  }
                >
                  {formatMoney(data.summary.cashDrawerBalance)}
                </span>
              }
              subtitle={`Entrou ${formatMoney(
                data.summary.cashIn
              )} • Saiu ${formatMoney(data.summary.cashOut)}`}
              icon={<Banknote className="w-5 h-5" />}
              variant="brand"
            />

            <StatCard
              label="Total Digital / Banco (Líquido)"
              value={
                <span
                  className={
                    data.summary.digitalBalance >= 0
                      ? "text-[#2563EB]"
                      : "text-[#DC4C4C]"
                  }
                >
                  {formatMoney(data.summary.digitalBalance)}
                </span>
              }
              subtitle={`PIX + Cartões + Transf. (${formatMoney(
                data.summary.digitalIn
              )}) - Saídas (${formatMoney(data.summary.digitalOut)})`}
              icon={<Landmark className="w-5 h-5" />}
              variant="info"
            />

            <StatCard
              label="Saldo Líquido do Dia"
              value={
                <span
                  className={
                    data.summary.dayNetBalance >= 0
                      ? "text-[#16A36A]"
                      : "text-[#DC4C4C]"
                  }
                >
                  {formatMoney(data.summary.dayNetBalance)}
                </span>
              }
              subtitle={`Entrou líq. ${formatMoney(
                data.summary.totalNetIn
              )} • Saiu ${formatMoney(data.summary.totalOut)}`}
              icon={<Wallet className="w-5 h-5" />}
              variant={data.summary.dayNetBalance >= 0 ? "success" : "error"}
            />
          </div>

          {/* Resumo por Forma de Recebimento */}
          <div className="space-y-2.5">
            <h3 className="text-[15px] font-semibold text-[#252B27]">
              Entradas do Dia por Forma de Pagamento
            </h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Taxas Maquininha</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.incomeByMethod.map((row) => (
                  <TableRow key={row.method}>
                    <TableCell className="font-medium text-[#252B27]">
                      {PAYMENT_METHOD_LABELS[row.method] || row.method}
                    </TableCell>
                    <TableCell className="text-center text-[#737D75]">
                      {row.count}
                    </TableCell>
                    <TableCell className="text-right text-[#252B27]">
                      {formatMoney(row.grossAmount)}
                    </TableCell>
                    <TableCell className="text-right text-[#DC4C4C]">
                      {row.feeAmount > 0
                        ? `- ${formatMoney(row.feeAmount)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#16A36A]">
                      {formatMoney(row.netAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Movimentações do Dia (Entradas + Saídas) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Lista de Entradas */}
            <div className="space-y-2.5">
              <h3 className="text-[15px] font-semibold text-[#252B27]">
                Recebimentos do Dia ({data.payments.length})
              </h3>
              {data.payments.length === 0 ? (
                <EmptyState
                  title="Nenhuma entrada nesta data"
                  description="Não houve recebimentos registrados neste dia."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>OS / Cliente</TableHead>
                      <TableHead>Meio</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={`/os/${p.serviceOrderId}`}
                            className="font-bold text-[#247653] hover:underline"
                          >
                            OS #{p.orderNumber}
                          </Link>
                          <div className="text-[12px] text-[#737D75]">
                            {p.plate} • {p.customerName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="brand" size="sm">
                            {PAYMENT_METHOD_LABELS[p.method] || p.method}
                            {(p.installments ?? 1) > 1
                              ? ` ${p.installments}x`
                              : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-[#16A36A]">
                            {formatMoney(p.netAmount ?? p.amount)}
                          </span>
                          {(p.feeAmount ?? 0) > 0 && (
                            <span className="block text-[11px] text-[#737D75]">
                              Bruto {formatMoney(p.amount)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Lista de Saídas */}
            <div className="space-y-2.5">
              <h3 className="text-[15px] font-semibold text-[#252B27]">
                Saídas / Contas Pagas no Dia ({data.expenses.length})
              </h3>
              {data.expenses.length === 0 ? (
                <EmptyState
                  title="Nenhuma saída nesta data"
                  description="Não houve pagamentos de despesas registrados neste dia."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Descrição</TableHead>
                      <TableHead>Meio</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>
                          <div className="font-medium text-[#252B27]">
                            {exp.description}
                          </div>
                          <div className="text-[12px] text-[#737D75]">
                            {CATEGORY_LABELS[exp.category] || exp.category}
                            {exp.supplier ? ` • ${exp.supplier}` : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" size="sm">
                            {PAYMENT_METHOD_LABELS[
                              exp.paymentMethod || "OTHER"
                            ] ||
                              exp.paymentMethod ||
                              "Outro"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#DC4C4C]">
                          - {formatMoney(exp.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
