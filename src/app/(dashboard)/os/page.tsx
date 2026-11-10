"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Plus,
  Car,
  Clock,
  Wrench,
  CheckCircle2,
  Receipt,
  User,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ManageOrderServicesModal } from "@/components/modules/manage-order-services-modal";

interface OrderItem {
  id: string;
  orderNumber: number;
  status: string;
  box?: string;
  totalAmount: number | null;
  createdAt: string;
  vehicle: {
    plate: string;
    model: string;
    brand?: string;
    category: string;
    customer: {
      name: string;
      phone?: string;
      whatsapp?: string;
    };
  };
  items: Array<{ serviceName: string; quantity: number; unitPrice: number | null }>;
  assignedUser?: { name: string };
}

export default function ServiceOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrderForServices, setSelectedOrderForServices] = useState<OrderItem | null>(null);

  async function loadOrders(query: string = "", status: string = "ALL") {
    try {
      setLoading(true);
      let url = "/api/orders?";
      if (status !== "ALL") url += `status=${status}&`;
      if (query) url += `q=${encodeURIComponent(query)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(search, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const statusBadges: Record<string, { label: string; style: string }> = {
    TODO: { label: "Para Fazer", style: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    IN_PROGRESS: { label: "Em Serviço", style: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    DONE: { label: "Concluído", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    PAID: { label: "Pago", style: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded carbon-card border-carbon-700 bg-carbon-900/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="led-pulse-lime" />
            <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
              // HISTÓRICO & GESTÃO DE PRODUÇÃO
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-lime-400" />
            <span>Ordens de Serviço</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Acompanhe o fluxo de OS, histórico de clientes e adicione serviços a pedidos em andamento
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <Link
            href="/os/nova"
            className="btn-engine-start px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NOVA OS / ENTRADA DIRETA</span>
          </Link>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BUSCAR POR PLACA, CLIENTE OU MODELO..."
            className="w-full pl-10 pr-4 py-2 rounded bg-carbon-950 border border-carbon-700 text-white placeholder:text-slate-600 text-xs focus:outline-none focus:border-lime-400/80 uppercase transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "TODAS" },
            { id: "TODO", label: "PARA FAZER" },
            { id: "IN_PROGRESS", label: "EM SERVIÇO" },
            { id: "DONE", label: "CONCLUÍDAS" },
            { id: "PAID", label: "PAGAS" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-lime-400 text-black shadow-sm font-extrabold"
                  : "bg-carbon-900 text-slate-400 hover:bg-carbon-800 hover:text-white border border-carbon-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Ordens de Serviço */}
      <div className="carbon-card border-carbon-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
            <Loader2 className="w-7 h-7 animate-spin text-lime-400" />
            <p className="text-xs uppercase tracking-wider">CARREGANDO ORDENS DE SERVIÇO...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            NENHUMA ORDEM DE SERVIÇO ENCONTRADA PARA OS FILTROS SELECIONADOS.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-carbon-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-carbon-700">
                <tr>
                  <th className="py-3 px-4">OS #</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Serviços Contratados</th>
                  <th className="py-3 px-4">Box</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-right">Abertura</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800 bg-carbon-900/40">
                {orders.map((os) => {
                  const badge = statusBadges[os.status] || {
                    label: os.status,
                    style: "bg-carbon-800 text-slate-300",
                  };
                  return (
                    <tr key={os.id} className="hover:bg-carbon-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-lime-400">
                        <Link href={`/os/${os.id}`} className="hover:underline">
                          #{os.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="mercosul-plate text-xs font-bold inline-block">
                          {os.vehicle.plate}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {os.vehicle.brand} {os.vehicle.model}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{os.vehicle.customer?.name || "Não informado"}</div>
                        <div className="text-[10px] text-slate-500">
                          {os.vehicle.customer?.whatsapp || os.vehicle.customer?.phone || "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-medium truncate max-w-xs">
                          {os.items.map((i) => i.serviceName).join(", ") || "Sem serviços"}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {os.items.length} item(s) incluído(s)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-bold">{os.box || "Pátio"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-lime-400">
                        {os.totalAmount !== null ? formatCurrency(os.totalAmount) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 text-[10px]">
                        {formatDateTime(os.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {os.status !== "PAID" && (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForServices(os)}
                              className="px-2 py-1 rounded bg-carbon-800 hover:bg-carbon-700 text-lime-400 hover:text-white border border-carbon-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Adicionar novos serviços solicitados pelo cliente"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                              <span>+ Serviço</span>
                            </button>
                          )}
                          <Link
                            href={`/os/${os.id}`}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-carbon-800 transition"
                            title="Ver detalhes da OS"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Gestão/Adição de Serviços para OS Existente */}
      {selectedOrderForServices && (
        <ManageOrderServicesModal
          isOpen={!!selectedOrderForServices}
          orderId={selectedOrderForServices.id}
          orderNumber={selectedOrderForServices.orderNumber}
          plate={selectedOrderForServices.vehicle.plate}
          model={selectedOrderForServices.vehicle.model}
          customerName={selectedOrderForServices.vehicle.customer?.name}
          onClose={() => setSelectedOrderForServices(null)}
          onOrderUpdated={() => loadOrders(search, statusFilter)}
        />
      )}
    </div>
  );
}
