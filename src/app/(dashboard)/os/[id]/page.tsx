"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Wrench,
  Car,
  User,
  Calendar,
  DollarSign,
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Gauge,
  Receipt,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ManageOrderServicesModal } from "@/components/modules/manage-order-services-modal";

interface OrderDetail {
  id: string;
  orderNumber: number;
  status: string;
  box?: string;
  mileage?: number;
  notes?: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  vehicle: {
    id: string;
    plate: string;
    model: string;
    brand?: string;
    category: string;
    color?: string;
    customer?: {
      name: string;
      phone?: string;
      whatsapp?: string;
      email?: string;
    };
  };
  items: Array<{
    id: string;
    serviceId: string;
    serviceName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    commissionAmount?: number;
    completed: boolean;
  }>;
  assignedUser?: { id: string; name: string };
  checklist?: {
    id: string;
    fuelLevel?: string;
    cleanlinessLevel?: string;
    damageRecords?: Array<{
      id: string;
      area: string;
      damageType: string;
      description?: string;
    }>;
  };
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);

  async function loadOrder() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar detalhes da OS.");
      }

      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || "Erro na conexão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const statusMap: Record<string, { label: string; badge: string }> = {
    TODO: { label: "Para Fazer (Aguardando Box)", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    IN_PROGRESS: { label: "Em Execução / Na Baia", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    DONE: { label: "Concluído (Pronto para Entrega)", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    PAID: { label: "Baixado & Pago", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    CANCELLED: { label: "Cancelado", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  };

  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
        <p className="text-xs uppercase tracking-wider">CARREGANDO DETALHES TÉCNICOS DA OS...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-6 carbon-card border-rose-500/40 text-center space-y-4 font-mono">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white uppercase">Ordem de Serviço Não Encontrada</h2>
        <p className="text-xs text-rose-300">{error || "Registro indisponível."}</p>
        <Link
          href="/os"
          className="btn-engine-start inline-flex items-center gap-2 px-4 py-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de OS</span>
        </Link>
      </div>
    );
  }

  const currentStatus = statusMap[order.status] || {
    label: order.status,
    badge: "bg-carbon-800 text-slate-300 border-carbon-700",
  };

  const customerWhatsapp = order.vehicle.customer?.whatsapp || order.vehicle.customer?.phone;
  const whatsappUrl = customerWhatsapp
    ? `https://wa.me/55${customerWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá ${order.vehicle.customer?.name || ""}, referente ao seu veículo ${order.vehicle.model} (Placa ${order.vehicle.plate}) na OS #${order.orderNumber}...`
      )}`
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12 font-sans">
      {/* Barra de Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/os"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 text-lime-400" />
          <span>Voltar para Ordens de Serviço</span>
        </Link>

        <div className="flex items-center gap-2">
          {order.status !== "PAID" && (
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="btn-engine-start px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Adicionar Serviço (Cliente Pediu)</span>
            </button>
          )}

          <Link
            href="/patio"
            className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 hover:text-white border border-carbon-600 text-xs flex items-center gap-1.5 font-mono"
          >
            <Car className="w-4 h-4 text-lime-400" />
            <span>Ver no Pátio</span>
          </Link>
        </div>
      </div>

      {/* Top Header Card */}
      <div className="carbon-card p-6 border-carbon-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-carbon-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="led-pulse-lime" />
              <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
                // DETALHAMENTO OPERACIONAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3">
              <span>ORDEM DE SERVIÇO #{order.orderNumber}</span>
              <span className="mercosul-plate text-sm font-mono font-bold">
                {order.vehicle.plate}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {order.vehicle.brand} {order.vehicle.model} • Categoria Porte:{" "}
              <strong className="text-lime-400">{order.vehicle.category}</strong> • Abertura:{" "}
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 font-mono">
            <span className={`px-3 py-1 rounded text-xs font-bold border ${currentStatus.badge}`}>
              {currentStatus.label}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-lime-400" />
              Local: <strong className="text-slate-200">{order.box || "Pátio Geral"}</strong>
            </span>
          </div>
        </div>

        {/* Informações Resumidas do Veículo e Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Card Cliente */}
          <div className="p-3.5 rounded bg-carbon-950 border border-carbon-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-lime-400" />
                Dados do Cliente
              </span>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] lowercase transition"
                >
                  <MessageCircle className="w-3 h-3" />
                  whatsapp
                </a>
              )}
            </div>
            <p className="text-white font-bold text-sm">
              {order.vehicle.customer?.name || "Cliente não informado"}
            </p>
            <p className="text-slate-400 text-[11px]">
              Telefone: {customerWhatsapp || "Não cadastrado"}
            </p>
          </div>

          {/* Card Veículo */}
          <div className="p-3.5 rounded bg-carbon-950 border border-carbon-800 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-lime-400" />
              Veículo em Produção
            </span>
            <p className="text-white font-bold text-sm">
              {order.vehicle.model} {order.vehicle.color ? `• ${order.vehicle.color}` : ""}
            </p>
            <p className="text-slate-400 text-[11px]">
              KM Entrada: {order.mileage ? `${order.mileage.toLocaleString("pt-BR")} km` : "Não registrado"}
            </p>
          </div>

          {/* Card Financeiro */}
          <div className="p-3.5 rounded bg-carbon-950 border border-carbon-800 space-y-2">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-lime-400" />
              Totalização da OS
            </span>
            <p className="text-lime-400 font-bold text-lg">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-slate-400 text-[11px]">
              Subtotal: {formatCurrency(order.subtotal)}{" "}
              {order.discount > 0 ? `| Desconto: -${formatCurrency(order.discount)}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: SERVIÇOS CONTRATADOS & ADICIONAIS */}
      <div className="carbon-card p-6 border-carbon-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-carbon-800">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2 font-mono">
              <Wrench className="w-4 h-4 text-lime-400" />
              <span>Serviços & Pacotes de Estética ({order.items.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Itens em execução no veículo. Se o cliente solicitou novos serviços, adicione abaixo.
            </p>
          </div>

          {order.status !== "PAID" && (
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="btn-engine-start px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adicionar Novos Serviços</span>
            </button>
          )}
        </div>

        <div className="border border-carbon-700 rounded-lg overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-carbon-950 text-slate-400 text-[10px] uppercase border-b border-carbon-700">
              <tr>
                <th className="py-2.5 px-3">Serviço Solicitado</th>
                <th className="py-2.5 px-3 text-center w-16">Qtd</th>
                <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-800 bg-carbon-900/50">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-carbon-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-white">
                    {item.serviceName}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-lime-400">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Banner Explicativo */}
        {order.status !== "PAID" && (
          <div className="p-3.5 rounded-lg bg-carbon-950 border border-carbon-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span>O cliente entrou em contato para incluir novos serviços antes da entrega?</span>
            </div>
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="text-lime-400 hover:text-lime-300 font-bold underline cursor-pointer"
            >
              Clique aqui para adicionar à OS
            </button>
          </div>
        )}
      </div>

      {/* Observações da OS */}
      {order.notes && (
        <div className="carbon-card p-4 border-carbon-700 text-xs font-mono space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
            Observações Técnicas / Operacionais:
          </span>
          <p className="text-slate-300 leading-relaxed">{order.notes}</p>
        </div>
      )}

      {/* Modal Reutilizável de Gestão de Serviços */}
      {isServicesModalOpen && (
        <ManageOrderServicesModal
          isOpen={isServicesModalOpen}
          orderId={order.id}
          orderNumber={order.orderNumber}
          plate={order.vehicle.plate}
          model={order.vehicle.model}
          customerName={order.vehicle.customer?.name}
          onClose={() => setIsServicesModalOpen(false)}
          onOrderUpdated={loadOrder}
        />
      )}
    </div>
  );
}

