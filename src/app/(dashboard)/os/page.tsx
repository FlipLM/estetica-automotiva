"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  Plus,
  Eye,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ManageOrderServicesModal } from "@/components/modules/manage-order-services-modal";
import { OrderStatusBadge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white border border-[#E7EAE7] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#252B27]">
              Ordens de Serviço
            </h1>
            <p className="text-xs text-[#737D75] mt-0.5">
              Acompanhe o fluxo de OS, histórico de clientes e adicione serviços a pedidos em andamento
            </p>
          </div>
        </div>

        <Link
          href="/os/nova"
          className="dp-btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ordem de Serviço</span>
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA49E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, cliente ou modelo..."
            className="dp-input pl-10"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "Todas" },
            { id: "TODO", label: "Para Fazer" },
            { id: "IN_PROGRESS", label: "Em Serviço" },
            { id: "DONE", label: "Concluídas" },
            { id: "PAID", label: "Pagas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#247653] text-white shadow-xs"
                  : "bg-white text-[#737D75] hover:bg-[#F7F8F6] hover:text-[#252B27] border border-[#E7EAE7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Ordens de Serviço */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#737D75]">
            <Loader2 className="w-7 h-7 animate-spin text-[#247653]" />
            <p className="text-xs font-medium">Carregando ordens de serviço...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-[#737D75] text-xs space-y-2">
            <ClipboardList className="w-8 h-8 text-[#9CA49E] mx-auto" />
            <p className="font-semibold text-[#252B27]">Nenhuma Ordem de Serviço encontrada</p>
            <p>Ajuste os filtros ou abra uma nova Ordem de Serviço acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F6] text-[#737D75] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E7EAE7]">
                <tr>
                  <th className="py-3 px-4">OS #</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Serviços Contratados</th>
                  <th className="py-3 px-4">Box / Vaga</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-right">Abertura</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAE7]">
                {orders.map((os) => (
                  <tr key={os.id} className="hover:bg-[#F7F8F6] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#247653]">
                      <Link href={`/os/${os.id}`} className="hover:underline">
                        #{os.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="mercosul-plate text-xs font-bold inline-block">
                        {os.vehicle.plate}
                      </div>
                      <div className="text-[11px] text-[#737D75] mt-0.5">
                        {os.vehicle.brand} {os.vehicle.model}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#252B27] font-semibold">
                        {os.vehicle.customer?.name || "Não informado"}
                      </div>
                      <div className="text-[11px] text-[#737D75]">
                        {os.vehicle.customer?.whatsapp || os.vehicle.customer?.phone || "-"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[#343C36] font-medium truncate max-w-xs">
                        {os.items.map((i) => i.serviceName).join(", ") || "Sem serviços"}
                      </div>
                      <div className="text-[11px] text-[#737D75] mt-0.5">
                        {os.items.length} item(s) incluído(s)
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#343C36] font-semibold">
                      {os.box || "Pátio"}
                    </td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={os.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#247653]">
                      {os.totalAmount !== null ? formatCurrency(os.totalAmount) : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#737D75] text-[11px]">
                      {formatDateTime(os.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {os.status !== "PAID" && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForServices(os)}
                            className="px-2.5 py-1 rounded-lg bg-[#E9F3EC] hover:bg-[#d5eadb] text-[#142D26] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Adicionar novos serviços solicitados pelo cliente"
                          >
                            <Plus className="w-3 h-3 text-[#247653]" />
                            <span>Serviço</span>
                          </button>
                        )}
                        <Link
                          href={`/os/${os.id}`}
                          className="p-1.5 rounded-lg text-[#737D75] hover:text-[#247653] hover:bg-[#E9F3EC]/50 transition"
                          title="Ver detalhes da OS"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
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
