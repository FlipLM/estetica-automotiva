"use client";

import {
  BellRing,
  FileText,
  ShieldCheck,
  UserX,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CrmSegment, CrmSummary } from "./types";

interface CrmSummaryCardsProps {
  summary: CrmSummary;
  activeTab: CrmSegment;
  onSelectTab: (tab: CrmSegment) => void;
}

export function CrmSummaryCards({
  summary,
  activeTab,
  onSelectTab,
}: CrmSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
      <button
        type="button"
        onClick={() => onSelectTab("TODAY")}
        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === "TODAY"
            ? "bg-[#E9F3EC] border-[#247653] ring-1 ring-[#247653]"
            : "bg-white border-[#E7EAE7] hover:border-[#247653]/50"
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#142D26]">
          <span>Para Chamar Hoje</span>
          <BellRing className="w-4 h-4 text-[#247653]" />
        </div>
        <p className="text-2xl font-bold text-[#142D26] mt-1.5">
          {summary.todayCount}
        </p>
        <p className="text-[11px] text-[#5B655D] mt-0.5">
          Fila priorizada de oportunidades
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("BUDGET_RECOVERY")}
        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === "BUDGET_RECOVERY"
            ? "bg-[#FFFBEB] border-[#D9822B] ring-1 ring-[#D9822B]"
            : "bg-white border-[#E7EAE7] hover:border-[#D9822B]/50"
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#7C4A12]">
          <span>Orçamentos em Aberto</span>
          <FileText className="w-4 h-4 text-[#D9822B]" />
        </div>
        <p className="text-2xl font-bold text-[#252B27] mt-1.5">
          {summary.budgetRecoveryCount}
        </p>
        <p className="text-[11px] text-[#737D75] mt-0.5">
          Aguardando fechamento no pátio
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("COATING_WARRANTY")}
        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === "COATING_WARRANTY"
            ? "bg-[#F0F9FF] border-[#2D82D6] ring-1 ring-[#2D82D6]"
            : "bg-white border-[#E7EAE7] hover:border-[#2D82D6]/50"
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#1E4F80]">
          <span>Manutenção / Garantia</span>
          <ShieldCheck className="w-4 h-4 text-[#2D82D6]" />
        </div>
        <p className="text-2xl font-bold text-[#252B27] mt-1.5">
          {summary.coatingDueCount}
        </p>
        <p className="text-[11px] text-[#737D75] mt-0.5">
          Proteções no prazo de revisão
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("CHURN_RISK")}
        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
          activeTab === "CHURN_RISK"
            ? "bg-[#FEF2F2] border-[#DC4C4C] ring-1 ring-[#DC4C4C]"
            : "bg-white border-[#E7EAE7] hover:border-[#DC4C4C]/50"
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#991B1B]">
          <span>Sumidos (+{summary.churnDays ?? 45} dias)</span>
          <UserX className="w-4 h-4 text-[#DC4C4C]" />
        </div>
        <p className="text-2xl font-bold text-[#252B27] mt-1.5">
          {summary.churnRiskCount}
        </p>
        <p className="text-[11px] text-[#737D75] mt-0.5">
          Clientes que já pagaram e sumiram
        </p>
      </button>

      <div className="p-4 rounded-xl border border-[#C6E5D3] bg-[#F4FBF7]">
        <div className="flex items-center justify-between text-xs font-semibold text-[#142D26]">
          <span>Retorno Gerado ({summary.periodLabel || "30d"})</span>
          <TrendingUp className="w-4 h-4 text-[#247653]" />
        </div>
        <p className="text-2xl font-bold text-[#247653] mt-1.5">
          {formatCurrency(summary.roi30dRevenue)}
        </p>
        <p className="text-[11px] text-[#5B655D] mt-0.5">
          {summary.roi30dOrdersCount} serviço(s) pago(s) após {summary.contactedLast30Days} contato(s)
        </p>
      </div>
    </div>
  );
}
