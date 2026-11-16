"use client";

import { Download, HelpCircle, Info } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { DREOverviewData, formatMoney, formatShortDate } from "./types";

interface DreDetalhadoTabProps {
  data: DREOverviewData;
}

export function DreDetalhadoTab({ data }: DreDetalhadoTabProps) {
  const grossReceived = data.grossReceived ?? data.grossRevenue ?? 0;
  const cardFees = data.cardFees ?? 0;
  const netReceived = data.netReceived ?? data.netRevenue ?? 0;

  const handleExportCsv = () => {
    const rows = [
      ["Bloco / Conta", "Descricao Simples", "Valor (R$)"],
      [
        "(+) Receita Recebida (Bruto em Caixa)",
        "Soma de todos os pagamentos recebidos no periodo (incluindo sinais)",
        grossReceived.toFixed(2).replace(".", ","),
      ],
      [
        "(-) Taxas de Maquininha",
        "Taxas cobradas pelas operadoras de cartao nos recebimentos do periodo",
        (-cardFees).toFixed(2).replace(".", ","),
      ],
      [
        "(=) Receita Liquida em Caixa",
        "Dinheiro que entrou liquido apos taxas de cartao",
        netReceived.toFixed(2).replace(".", ","),
      ],
      [
        "(-) Insumos e Produtos Quimicos",
        "Compras de produtos pagas no periodo (Regime de Caixa)",
        (-data.variableCosts.products).toFixed(2).replace(".", ","),
      ],
      [
        "(-) Comissoes da Equipe",
        "Comissoes pagas aos colaboradores no periodo",
        (-data.variableCosts.commissions).toFixed(2).replace(".", ","),
      ],
      [
        "(=) Lucro Bruto da Operacao",
        "O que sobra apos produtos e comissoes",
        data.grossProfit.toFixed(2).replace(".", ","),
      ],
      [
        "(-) Aluguel e Ponto Comercial",
        "Despesa fixa paga no periodo",
        (-data.fixedCosts.rent).toFixed(2).replace(".", ","),
      ],
      [
        "(-) Energia, Agua e Internet",
        "Despesa fixa paga no periodo",
        (-data.fixedCosts.utilities).toFixed(2).replace(".", ","),
      ],
      [
        "(-) Salarios e Pro-labore",
        "Folha fixa paga no periodo",
        (-data.fixedCosts.salaries).toFixed(2).replace(".", ","),
      ],
      [
        "(-) Marketing e Anuncios",
        "Investimento em divulgacao pago no periodo",
        (-data.fixedCosts.marketing).toFixed(2).replace(".", ","),
      ],
      [
        "(-) Manutencao de Equipamentos",
        "Consertos e manutencoes pagos no periodo",
        (-data.fixedCosts.maintenance).toFixed(2).replace(".", ","),
      ],
      [
        "(-) Outras Despesas Gerais",
        "Demais contas pagas no periodo",
        (-data.fixedCosts.other).toFixed(2).replace(".", ","),
      ],
      [
        "(=) RESULTADO LIQUIDO DO PERIODO",
        "Bate com Sobrou no Bolso do Resumo Simples",
        data.netProfit.toFixed(2).replace(".", ","),
      ],
    ];

    const csvContent =
      "\uFEFF" +
      rows
        .map((cols) =>
          cols.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(";")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vulpto-dre-${data.period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <Alert
        variant="info"
        title="Entendendo este demonstrativo em Regime de Caixa"
        description="Todos os números abaixo consideram o dinheiro efetivamente recebido no período (inclusive sinais parciais), já descontando taxas de maquininha, e as contas efetivamente pagas pela data do pagamento (paidAt). Por isso, o Resultado Líquido final bate exatamente com o cartão 'Sobrou no Bolso' do Resumo Simples."
      />

      <div className="bg-white rounded-[12px] border border-[#E7EAE7] shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7EAE7] bg-[#F7F8F6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#247653]" />
              <h2 className="font-semibold text-[#252B27] text-[15px]">
                DRE Gerencial — Demonstrativo de Resultado (Regime de Caixa)
              </h2>
            </div>
            <p className="text-[12px] text-[#737D75] mt-0.5">
              Período: {formatShortDate(data.startDate)} até{" "}
              {formatShortDate(data.endDate)} • {data.ordersCount} OS quitada(s)
              • Ticket médio: {formatMoney(data.averageTicket)}
              {data.discounts > 0
                ? ` • Descontos comerciais concedidos: ${formatMoney(
                    data.discounts
                  )}`
                : ""}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar CSV
          </Button>
        </div>

        <div className="p-6 divide-y divide-[#F1F3F1] text-[14px]">
          {/* 1. Receita Recebida (Bruta em Caixa) */}
          <div className="py-3 flex justify-between items-start gap-4">
            <div>
              <span className="font-semibold text-[#252B27]">
                (+) Receita Recebida (Pagamentos no Caixa)
              </span>
              <p className="text-[12px] text-[#737D75] flex items-center gap-1 mt-0.5">
                <Info className="w-3.5 h-3.5 text-[#9CA49E]" />
                Soma de todos os pagamentos e sinais recebidos neste período.
              </p>
            </div>
            <span className="font-semibold text-[#16A36A] whitespace-nowrap">
              {formatMoney(grossReceived)}
            </span>
          </div>

          {/* 2. Taxas de Maquininha */}
          <div className="py-2.5 pl-4 flex justify-between items-center text-[13px] text-[#737D75]">
            <span>(-) Taxas de Maquininha (Cartão Crédito / Débito)</span>
            <span className="text-[#DC4C4C] whitespace-nowrap">
              - {formatMoney(cardFees)}
            </span>
          </div>

          {/* 3. Receita Líquida em Caixa */}
          <div className="py-3 px-3.5 bg-[#F7F8F6] rounded-[10px] flex justify-between items-center gap-4">
            <div>
              <span className="font-semibold text-[#252B27]">
                (=) Receita Líquida em Caixa (Entrou no Caixa)
              </span>
              <p className="text-[12px] text-[#737D75]">
                Valor real que caiu na conta após descontar taxas de cartão.
              </p>
            </div>
            <span className="font-bold text-[#252B27] whitespace-nowrap">
              {formatMoney(netReceived)}
            </span>
          </div>

          {/* 4. Custos Variáveis */}
          <div className="py-3 pl-4 space-y-2 text-[13px]">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[#343C36] font-medium">
                  (-) Insumos e Produtos Químicos
                </span>
                <p className="text-[12px] text-[#737D75]">
                  Compras de produtos pagas no período (Regime de Caixa)
                </p>
              </div>
              <span className="text-[#DC4C4C] whitespace-nowrap">
                - {formatMoney(data.variableCosts?.products)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-[#343C36] font-medium">
                  (-) Comissões Pagas à Equipe
                </span>
                <p className="text-[12px] text-[#737D75]">
                  Repasses de comissões pagos no período
                </p>
              </div>
              <span className="text-[#DC4C4C] whitespace-nowrap">
                - {formatMoney(data.variableCosts?.commissions)}
              </span>
            </div>
          </div>

          {/* 5. Lucro Bruto */}
          <div className="py-3 px-3.5 bg-[#EFF6FF]/70 rounded-[10px] flex justify-between items-center gap-4">
            <div>
              <span className="font-semibold text-[#1E40AF] flex items-center gap-1.5">
                (=) Lucro Bruto da Operação
                <span title="Lucro Bruto = o que sobra após produtos e comissões">
                  <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" />
                </span>
              </span>
              <p className="text-[12px] text-[#1E40AF]/80">
                O que sobra após pagar produtos e comissões dos serviços.
              </p>
            </div>
            <span className="font-bold text-[#1E40AF] whitespace-nowrap">
              {formatMoney(data.grossProfit)} (
              {(data.grossMarginPercentage ?? 0).toFixed(1)}%)
            </span>
          </div>

          {/* 6. Custos Fixos Detalhados */}
          <div className="py-3 pl-4 space-y-1.5 text-[13px] text-[#737D75]">
            <p className="font-medium text-[#343C36] mb-1">
              (-) Custos Fixos e Estrutura (contas pagas no período):
            </p>
            <div className="flex justify-between">
              <span>• Aluguel e Ponto Comercial</span>
              <span>{formatMoney(data.fixedCosts?.rent)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Energia, Água e Internet</span>
              <span>{formatMoney(data.fixedCosts?.utilities)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Folha de Pagamento e Salários Fixos</span>
              <span>{formatMoney(data.fixedCosts?.salaries)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Marketing e Anúncios</span>
              <span>{formatMoney(data.fixedCosts?.marketing)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Manutenção de Equipamentos</span>
              <span>{formatMoney(data.fixedCosts?.maintenance)}</span>
            </div>
            <div className="flex justify-between">
              <span>• Outras Despesas Gerais</span>
              <span>{formatMoney(data.fixedCosts?.other)}</span>
            </div>
          </div>

          {/* 7. Total Custos Fixos */}
          <div className="py-2.5 pl-4 flex justify-between items-center text-[13px] text-[#737D75]">
            <span>(-) Total de Custos Fixos Operacionais</span>
            <span className="text-[#DC4C4C] font-semibold whitespace-nowrap">
              - {formatMoney(data.fixedCosts?.total)}
            </span>
          </div>

          {/* 8. Lucro Líquido Final */}
          <div className="py-4 px-4 bg-[#E9F3EC] border border-[#247653]/25 rounded-[12px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-2">
            <div>
              <span className="font-bold text-[#142D26]">
                (=) RESULTADO LÍQUIDO DO PERÍODO
              </span>
              <p className="text-[12px] text-[#142D26]/80">
                Lucro final do negócio (Entrou Líquido - Saiu do Caixa).
              </p>
            </div>
            <span
              className={`text-[18px] font-bold whitespace-nowrap ${
                (data.netProfit ?? 0) >= 0 ? "text-[#16A36A]" : "text-[#DC4C4C]"
              }`}
            >
              {formatMoney(data.netProfit)} (
              {(data.netMarginPercentage ?? 0).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
