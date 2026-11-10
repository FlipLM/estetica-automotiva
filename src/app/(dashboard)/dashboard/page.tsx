"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  Wrench,
  CheckCircle2,
  DollarSign,
  Car,
  Receipt,
  Users,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Plus,
  Calendar,
  FileText,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/badge";

interface DashboardData {
  role: "ADMIN" | "OPERATOR";
  patio: {
    todo: number;
    inProgress: number;
    done: number;
    paid: number;
    totalActive: number;
    myAssigned: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: number;
    plate: string;
    model: string;
    category: string;
    customerName: string;
    customerPhone?: string;
    status: string;
    box: string;
    totalAmount: number | null;
    mainService: string;
    assignedTo: string;
    createdAt: string;
  }>;
  financial: {
    revenueToday: number;
    revenue7Days: number;
    revenueMonth: number;
    averageTicket: number;
    totalExpensesMonth: number;
    netProfitMonth: number;
    profitMargin: number;
    totalCustomers: number;
    totalVehicles: number;
  } | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodView, setPeriodView] = useState<"TODAY" | "7DAYS" | "MONTH">("MONTH");

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) {
          throw new Error("Falha ao carregar indicadores do sistema.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Erro de conexão.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-[#737D75]">
        <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
        <p className="text-xs font-medium text-[#737D75]">
          Carregando indicadores operacionais da estética...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-sm flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="text-xs font-medium">{error || "Não foi possível carregar os dados operacionais."}</span>
      </div>
    );
  }

  const { patio, financial, recentOrders, role } = data;

  const todayFormatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const displayedRevenue = financial
    ? periodView === "TODAY"
      ? financial.revenueToday
      : periodView === "7DAYS"
      ? financial.revenue7Days
      : financial.revenueMonth
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO EXECUTIVO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-[#E7EAE7] rounded-xl p-5 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#E9F3EC] text-[#247653] flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[#252B27] leading-tight">
                Visão Geral da Estética
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] text-[11px] font-semibold">
                Ao vivo
              </span>
            </div>
            <p className="text-xs text-[#737D75] mt-0.5 capitalize">
              {todayFormatted} • Acompanhamento de pátio, ordens e resultados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {financial && (
            <div className="inline-flex p-1 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] text-xs">
              <button
                type="button"
                onClick={() => setPeriodView("TODAY")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  periodView === "TODAY"
                    ? "bg-white text-[#252B27] shadow-xs font-semibold"
                    : "text-[#737D75] hover:text-[#252B27]"
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setPeriodView("7DAYS")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  periodView === "7DAYS"
                    ? "bg-white text-[#252B27] shadow-xs font-semibold"
                    : "text-[#737D75] hover:text-[#252B27]"
                }`}
              >
                7 dias
              </button>
              <button
                type="button"
                onClick={() => setPeriodView("MONTH")}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  periodView === "MONTH"
                    ? "bg-white text-[#252B27] shadow-xs font-semibold"
                    : "text-[#737D75] hover:text-[#252B27]"
                }`}
              >
                Mês atual
              </button>
            </div>
          )}

          <Link href="/patio" className="dp-btn-secondary text-xs">
            <Car className="w-3.5 h-3.5 text-[#247653]" />
            <span>Ver Pátio</span>
          </Link>

          <Link href="/os/nova" className="dp-btn-primary text-xs">
            <Plus className="w-4 h-4" />
            <span>Nova Ordem de Serviço</span>
          </Link>
        </div>
      </div>

      {/* 2. ATALHOS RÁPIDOS DE OPERAÇÃO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/os/nova"
          className="p-3.5 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653] transition flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E9F3EC] text-[#247653] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#252B27]">Nova Ordem</p>
              <p className="text-[11px] text-[#737D75]">Entrada no pátio</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA49E] group-hover:text-[#247653] transition" />
        </Link>

        <Link
          href="/vistoria"
          className="p-3.5 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653] transition flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#252B27]">Nova Vistoria</p>
              <p className="text-[11px] text-[#737D75]">Checklist 360º</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA49E] group-hover:text-[#247653] transition" />
        </Link>

        <Link
          href="/orcamentos"
          className="p-3.5 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653] transition flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#252B27]">Novo Orçamento</p>
              <p className="text-[11px] text-[#737D75]">Proposta comercial</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA49E] group-hover:text-[#247653] transition" />
        </Link>

        <Link
          href={role === "ADMIN" ? "/financeiro" : "/clientes"}
          className="p-3.5 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653] transition flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#16A36A] flex items-center justify-center">
              {role === "ADMIN" ? <DollarSign className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-xs font-bold text-[#252B27]">
                {role === "ADMIN" ? "Financeiro & DRE" : "Novo Cliente"}
              </p>
              <p className="text-[11px] text-[#737D75]">
                {role === "ADMIN" ? "Receitas e despesas" : "Base cadastral"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA49E] group-hover:text-[#247653] transition" />
        </Link>
      </div>

      {/* 3. INDICADORES OPERACIONAIS DO PÁTIO */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-semibold text-[#252B27]">
            Ocupação e Status do Pátio ({patio.totalActive} veículos ativos)
          </h2>
          <Link
            href="/agenda"
            className="text-xs font-semibold text-[#247653] hover:text-[#142D26] flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ver Agenda de Horários</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Para Fazer */}
          <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#737D75] mb-2">
              <span className="font-semibold">Fila de Espera</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-[#252B27] tracking-tight">
                {patio.todo}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                A iniciar
              </span>
            </div>
            <p className="text-xs text-[#737D75] mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Aguardando início no pátio</span>
            </p>
            <div className="w-full h-1.5 bg-[#F1F3F1] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#D97706] transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.todo / Math.max(1, patio.totalActive)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Em Serviço */}
          <div className="bg-white border border-[#247653]/40 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#247653] mb-2">
              <span className="font-semibold">Em Execução</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#247653]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-[#247653] tracking-tight">
                {patio.inProgress}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E9F3EC] text-[#142D26]">
                Nos boxes
              </span>
            </div>
            <p className="text-xs text-[#737D75] mt-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#247653]" />
              <span>Em atendimento na estética</span>
            </p>
            <div className="w-full h-1.5 bg-[#F1F3F1] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#247653] transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.inProgress / Math.max(1, patio.totalActive)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Concluídos */}
          <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#737D75] mb-2">
              <span className="font-semibold">Prontos p/ Retirada</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-[#252B27] tracking-tight">
                {patio.done}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]">
                Concluídos
              </span>
            </div>
            <p className="text-xs text-[#737D75] mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
              <span>Aguardando entrega e baixa</span>
            </p>
            <div className="w-full h-1.5 bg-[#F1F3F1] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#16A36A] transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.done / Math.max(1, patio.totalActive)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Pagos / Encerrados */}
          <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#737D75] mb-2">
              <span className="font-semibold">Pagos & Entregues</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-[#252B27] tracking-tight">
                {patio.paid}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                Quitados
              </span>
            </div>
            <p className="text-xs text-[#737D75] mt-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Ordens finalizadas no caixa</span>
            </p>
            <div className="w-full h-1.5 bg-[#F1F3F1] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.paid / Math.max(1, patio.totalActive + patio.paid)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. DESEMPENHO FINANCEIRO (APENAS ADMIN) */}
      {financial && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold text-[#252B27]">
              Desempenho Financeiro
            </h2>
            <Link
              href="/financeiro"
              className="text-xs font-semibold text-[#247653] hover:text-[#142D26] flex items-center gap-1"
            >
              <span>Abrir DRE Completo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Receita do Período */}
            <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#737D75] mb-1">
                <span className="font-medium">
                  {periodView === "TODAY"
                    ? "Faturamento de Hoje"
                    : periodView === "7DAYS"
                    ? "Faturamento (7 dias)"
                    : "Faturamento Mensal"}
                </span>
                <TrendingUp className="w-4 h-4 text-[#247653]" />
              </div>
              <div className="text-2xl font-bold text-[#247653] tracking-tight">
                {formatCurrency(displayedRevenue)}
              </div>
              <div className="flex items-center justify-between text-xs text-[#737D75] mt-3 pt-2.5 border-t border-[#E7EAE7]">
                <span>Acumulado 7 dias:</span>
                <span className="text-[#252B27] font-semibold">{formatCurrency(financial.revenue7Days)}</span>
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#737D75] mb-1">
                <span className="font-medium">Ticket Médio por Ordem</span>
                <DollarSign className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="text-2xl font-bold text-[#252B27] tracking-tight">
                {formatCurrency(financial.averageTicket)}
              </div>
              <div className="flex items-center justify-between text-xs text-[#737D75] mt-3 pt-2.5 border-t border-[#E7EAE7]">
                <span>Base ativa:</span>
                <span className="text-[#252B27] font-semibold">
                  {financial.totalCustomers} clientes • {financial.totalVehicles} carros
                </span>
              </div>
            </div>

            {/* Despesas Lançadas */}
            <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#737D75] mb-1">
                <span className="font-medium">Despesas do Mês</span>
                <Receipt className="w-4 h-4 text-[#DC4C4C]" />
              </div>
              <div className="text-2xl font-bold text-[#DC4C4C] tracking-tight">
                {formatCurrency(financial.totalExpensesMonth)}
              </div>
              <div className="flex items-center justify-between text-xs text-[#737D75] mt-3 pt-2.5 border-t border-[#E7EAE7]">
                <span>Custos operacionais:</span>
                <span className="text-[#252B27] font-semibold">Contas e insumos</span>
              </div>
            </div>

            {/* Lucro Líquido Real */}
            <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#737D75] mb-1">
                <span className="font-medium">Lucro Líquido (Mês)</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E9F3EC] text-[#142D26]">
                  {financial.profitMargin.toFixed(1)}% margem
                </span>
              </div>
              <div
                className={`text-2xl font-bold tracking-tight ${
                  financial.netProfitMonth >= 0 ? "text-[#16A36A]" : "text-[#DC4C4C]"
                }`}
              >
                {formatCurrency(financial.netProfitMonth)}
              </div>
              <div className="flex items-center justify-between text-xs text-[#737D75] mt-3 pt-2.5 border-t border-[#E7EAE7]">
                <span>Resultado contábil:</span>
                <span className="text-[#247653] font-semibold">Receitas - Custos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TABELA DE VEÍCULOS E ORDENS RECENTES NO PÁTIO */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[#E7EAE7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#252B27]">
              Ordens de Serviço Recentes no Pátio
            </h2>
            <p className="text-xs text-[#737D75]">
              Acompanhamento em tempo real dos veículos em atendimento por box e responsável
            </p>
          </div>

          <Link
            href="/patio"
            className="text-xs font-semibold text-[#247653] hover:text-[#142D26] flex items-center gap-1"
          >
            <span>Abrir Quadro Kanban do Pátio</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-[#737D75] text-xs space-y-2">
            <Car className="w-8 h-8 text-[#9CA49E] mx-auto" />
            <p className="font-semibold text-[#252B27]">Nenhum veículo em atendimento no momento</p>
            <p>Clique em &ldquo;Nova Ordem de Serviço&rdquo; para registrar uma entrada no pátio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F6] text-[#737D75] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E7EAE7]">
                <tr>
                  <th className="py-3 px-4">OS #</th>
                  <th className="py-3 px-4">Placa</th>
                  <th className="py-3 px-4">Veículo / Porte</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Serviço Principal</th>
                  <th className="py-3 px-4">Box / Vaga</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Operador</th>
                  {financial && <th className="py-3 px-4 text-right">Valor</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAE7]">
                {recentOrders.map((os) => (
                  <tr
                    key={os.id}
                    className="hover:bg-[#F7F8F6] transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-[#252B27]">
                      <Link href={`/os/${os.id}`} className="hover:text-[#247653] underline-offset-2 hover:underline">
                        #{String(os.orderNumber).padStart(4, "0")}
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <span className="mercosul-plate text-xs">
                        {os.plate}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[#252B27] font-semibold">{os.model}</div>
                      <div className="text-[11px] text-[#737D75]">{os.category}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[#252B27] font-medium">{os.customerName}</div>
                      {os.customerPhone && (
                        <div className="text-[11px] text-[#737D75]">{os.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-[#F7F8F6] border border-[#E7EAE7] text-[#343C36] font-medium">
                        {os.mainService}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#343C36]">{os.box || "Pátio Geral"}</span>
                    </td>

                    <td className="py-3 px-4">
                      <OrderStatusBadge status={os.status} />
                    </td>

                    <td className="py-3 px-4 text-[#737D75]">{os.assignedTo}</td>

                    {financial && (
                      <td className="py-3 px-4 text-right font-bold text-[#247653]">
                        {os.totalAmount !== null ? formatCurrency(os.totalAmount) : "-"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
