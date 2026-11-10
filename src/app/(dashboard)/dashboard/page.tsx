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
  Activity,
  Gauge,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
        <p className="text-xs font-mono tracking-wider text-slate-300 uppercase">
          CARREGANDO PAINEL OPERACIONAL DA OFICINA...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded carbon-card border-red-500/40 text-red-400 text-sm flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="font-mono text-xs">{error || "Não foi possível carregar os dados operacionais."}</span>
      </div>
    );
  }

  const { patio, financial, recentOrders } = data;

  return (
    <div className="space-y-6">
      {/* 1. BARRA SUPERIOR DO PAINEL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded carbon-card border-carbon-700 bg-carbon-900/80">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-carbon-800 border border-carbon-700 flex items-center justify-center text-lime-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-display font-extrabold tracking-wide text-white uppercase">
                Painel Geral // Visão Operacional
              </h1>
              <span className="led-pulse-lime" />
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              MONITORAMENTO EM TEMPO REAL DOS CARROS, BAIAS E RESULTADOS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <Link
            href="/patio"
            className="px-3 py-1.5 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 text-xs font-semibold border border-carbon-600 transition-all flex items-center gap-2 group"
          >
            <Car className="w-3.5 h-3.5 text-lime-400 group-hover:scale-110 transition-transform" />
            <span>PÁTIO EM TEMPO REAL</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/os/nova"
            className="btn-engine-start px-3 py-1.5 rounded text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ NOVA ENTRADA</span>
          </Link>
        </div>
      </div>

      {/* 2. BLOCOS DE STATUS DO PÁTIO */}
      <div>
        <div className="telemetry-header mb-3">
          <span className="text-lime-400 font-bold">SETOR // 01</span>
          <span>ESTADO DOS VEÍCULOS NO PÁTIO</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Para Fazer */}
          <div className="carbon-card p-4 group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span className="text-slate-500 font-bold tracking-wider">// 01 FILA DE ESPERA</span>
              <div className="w-2 h-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {String(patio.todo).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase">
                A INICIAR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Aguardando início</span>
            </p>
            {/* Visual Gauge Bar */}
            <div className="w-full h-1 bg-carbon-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.todo / Math.max(1, patio.totalActive)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Em Serviço */}
          <div className="carbon-card p-4 group hover:border-lime-500/40 transition-colors carbon-card-active">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span className="text-lime-400 font-bold tracking-wider">// 02 EM EXECUÇÃO</span>
              <div className="led-pulse-lime" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-extrabold text-lime-400 tracking-tight">
                {String(patio.inProgress).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-lime-400 font-semibold uppercase">
                NOS BOXES
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-lime-400" />
              <span>Na rampa / estética ativa</span>
            </p>
            {/* Visual Gauge Bar */}
            <div className="w-full h-1 bg-carbon-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-lime-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.inProgress / Math.max(1, patio.totalActive)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Concluídos */}
          <div className="carbon-card p-4 group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span className="text-slate-500 font-bold tracking-wider">// 03 PRONTOS / LIBERADOS</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {String(patio.done).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                PRONTOS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Aguardando retirada</span>
            </p>
            {/* Visual Gauge Bar */}
            <div className="w-full h-1 bg-carbon-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.done / Math.max(1, patio.totalActive)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Pagos / Encerrados */}
          <div className="carbon-card p-4 group hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span className="text-slate-500 font-bold tracking-wider">// 04 FATURADOS E ENTREGUES</span>
              <div className="w-2 h-2 rounded-full bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-extrabold text-white tracking-tight">
                {String(patio.paid).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase">
                QUITADOS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
              <Receipt className="w-3 h-3 text-blue-400" />
              <span>Pagos e entregues</span>
            </p>
            {/* Visual Gauge Bar */}
            <div className="w-full h-1 bg-carbon-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (patio.paid / Math.max(1, patio.totalActive + patio.paid)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. BLOCOS DE RESULTADOS FINANCEIROS */}
      {financial && (
        <div>
          <div className="telemetry-header mb-3">
            <span className="text-lime-400 font-bold">SETOR // 02</span>
            <span>DESEMPENHO FINANCEIRO DA OFICINA</span>
            <Link
              href="/financeiro"
              className="text-lime-400 hover:text-lime-300 font-mono text-[10px] flex items-center gap-1 font-bold ml-auto"
            >
              <span>ABRIR DRE COMPLETO</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card Faturamento Mensal */}
            <div className="carbon-card p-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>RECEITA LÍQUIDA MENSAL</span>
                <TrendingUp className="w-3.5 h-3.5 text-lime-400" />
              </div>
              <div className="font-mono text-2xl font-black text-lime-400 tracking-tight">
                {formatCurrency(financial.revenueMonth)}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-carbon-800">
                <span>ÚLTIMOS 7 DIAS:</span>
                <span className="text-slate-200 font-bold">{formatCurrency(financial.revenue7Days)}</span>
              </div>
            </div>

            {/* Card Ticket Médio */}
            <div className="carbon-card p-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>TICKET MÉDIO POR CARRO</span>
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="font-mono text-2xl font-black text-white tracking-tight">
                {formatCurrency(financial.averageTicket)}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-carbon-800">
                <span>CLIENTES ATIVOS:</span>
                <span className="text-slate-200 font-bold">{financial.totalCustomers} cadastrados</span>
              </div>
            </div>

            {/* Card Despesas Lançadas */}
            <div className="carbon-card p-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>CUSTOS & DESPESAS (MÊS)</span>
                <Receipt className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="font-mono text-2xl font-black text-red-400 tracking-tight">
                {formatCurrency(financial.totalExpensesMonth)}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-carbon-800">
                <span>INSUMOS E FIXOS:</span>
                <span className="text-slate-200 font-bold">Lançamentos reais</span>
              </div>
            </div>

            {/* Card Resultado Líquido */}
            <div className="carbon-card p-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>LUCRO LÍQUIDO REAL</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-carbon-800 border border-lime-400/40 text-lime-400">
                  {financial.profitMargin.toFixed(1)}% MARGEM
                </span>
              </div>
              <div
                className={`font-mono text-2xl font-black tracking-tight ${
                  financial.netProfitMonth >= 0 ? "text-lime-400" : "text-red-400"
                }`}
              >
                {formatCurrency(financial.netProfitMonth)}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-carbon-800">
                <span>EFICIÊNCIA OFICINA:</span>
                <span className="text-lime-400 font-bold">RESULTADO LÍQUIDO</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TELEMETRY LIVE FEED: VEÍCULOS NO PÁTIO */}
      <div className="carbon-card overflow-hidden">
        {/* Card Header */}
        <div className="p-3.5 sm:p-4 border-b border-carbon-700 bg-carbon-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="led-pulse-lime" />
            <div>
              <h2 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-white">
                Fluxo da Oficina // Ordens de Serviço no Pátio
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                MONITORAMENTO DE EXECUÇÃO DE SERVIÇOS POR POSTO DE TRABALHO
              </p>
            </div>
          </div>

          <Link
            href="/patio"
            className="text-xs font-mono font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1.5"
          >
            <span>VER PÁTIO COMPLETO</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            // NENHUM VEÍCULO EM ATENDIMENTO NO MOMENTO // PÁTIO DISPONÍVEL
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-carbon-950/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-carbon-800">
                <tr>
                  <th className="py-2.5 px-4 font-bold">OS #</th>
                  <th className="py-2.5 px-4 font-bold">PLACA DO VEÍCULO</th>
                  <th className="py-2.5 px-4 font-bold">MODELO / CATEGORIA</th>
                  <th className="py-2.5 px-4 font-bold">CLIENTE</th>
                  <th className="py-2.5 px-4 font-bold">SERVIÇO PRINCIPAL</th>
                  <th className="py-2.5 px-4 font-bold">BOX</th>
                  <th className="py-2.5 px-4 font-bold">STATUS</th>
                  <th className="py-2.5 px-4 font-bold">OPERADOR</th>
                  {financial && <th className="py-2.5 px-4 text-right font-bold">VALOR</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/80">
                {recentOrders.map((os) => (
                  <tr
                    key={os.id}
                    className="hover:bg-carbon-800/50 transition-colors group"
                  >
                    {/* OS Number */}
                    <td className="py-3 px-4 font-bold text-slate-300">
                      <span className="text-lime-400">#</span>
                      {String(os.orderNumber).padStart(4, "0")}
                    </td>

                    {/* Placa com Realismo Mercosul */}
                    <td className="py-3 px-4">
                      <span className="mercosul-plate text-xs">
                        {os.plate}
                      </span>
                    </td>

                    {/* Modelo */}
                    <td className="py-3 px-4">
                      <div className="text-white font-bold">{os.model}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{os.category}</div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-semibold">{os.customerName}</div>
                      {os.customerPhone && (
                        <div className="text-[10px] text-slate-500">{os.customerPhone}</div>
                      )}
                    </td>

                    {/* Serviço Principal */}
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      <span className="px-2 py-0.5 rounded bg-carbon-800 border border-carbon-700 text-slate-200">
                        {os.mainService}
                      </span>
                    </td>

                    {/* Box */}
                    <td className="py-3 px-4 text-slate-400">
                      <span className="font-bold text-slate-300">{os.box || "Pátio Geral"}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          os.status === "TODO"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/40"
                            : os.status === "IN_PROGRESS"
                            ? "bg-lime-500/10 text-lime-400 border-lime-500/40"
                            : os.status === "DONE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/40"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            os.status === "TODO"
                              ? "bg-amber-400"
                              : os.status === "IN_PROGRESS"
                              ? "bg-lime-400 animate-pulse"
                              : os.status === "DONE"
                              ? "bg-emerald-400"
                              : "bg-blue-400"
                          }`}
                        />
                        {os.status === "TODO"
                          ? "Fila"
                          : os.status === "IN_PROGRESS"
                          ? "Em Serviço"
                          : os.status === "DONE"
                          ? "Pronto"
                          : "Pago"}
                      </span>
                    </td>

                    {/* Operador */}
                    <td className="py-3 px-4 text-slate-400">{os.assignedTo}</td>

                    {/* Valor */}
                    {financial && (
                      <td className="py-3 px-4 text-right font-bold text-lime-400">
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
