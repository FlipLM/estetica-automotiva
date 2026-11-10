"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  Car,
  User,
  DollarSign,
  MessageCircle,
  Plus,
  AlertCircle,
  Gauge,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Receipt,
  FileDown,
  Printer,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ManageOrderServicesModal } from "@/components/modules/manage-order-services-modal";
import { OrderStatusBadge } from "@/components/ui/badge";
import { generateServiceOrderPdf } from "@/lib/pdf-generator";

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

  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-2 text-[#737D75]">
        <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
        <p className="text-xs font-medium">Carregando detalhes da Ordem de Serviço...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white border border-[#FECACA] rounded-xl text-center space-y-4 shadow-xs">
        <AlertCircle className="w-10 h-10 text-[#DC4C4C] mx-auto" />
        <h2 className="text-base font-bold text-[#252B27]">Ordem de Serviço Não Encontrada</h2>
        <p className="text-xs text-[#DC4C4C]">{error || "Registro indisponível."}</p>
        <Link
          href="/os"
          className="dp-btn-primary inline-flex items-center gap-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de OS</span>
        </Link>
      </div>
    );
  }

  const customerWhatsapp = order.vehicle.customer?.whatsapp || order.vehicle.customer?.phone;
  const whatsappUrl = customerWhatsapp
    ? `https://wa.me/55${customerWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá ${order.vehicle.customer?.name || ""}, referente ao seu veículo ${order.vehicle.model} (Placa ${order.vehicle.plate}) na OS #${order.orderNumber}...`
      )}`
    : null;

  const timelineSteps = [
    { key: "TODO", label: "Fila / Recepção", icon: Clock },
    { key: "IN_PROGRESS", label: "Em Execução no Box", icon: Wrench },
    { key: "DONE", label: "Pronto p/ Retirada", icon: CheckCircle2 },
    { key: "PAID", label: "Pago e Entregue", icon: Receipt },
  ];

  const statusOrder = ["TODO", "IN_PROGRESS", "DONE", "PAID"];
  const currentStepIdx = statusOrder.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Barra de Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/os"
          className="text-xs font-semibold text-[#737D75] hover:text-[#252B27] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#247653]" />
          <span>Voltar para Ordens de Serviço</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {order.status !== "PAID" && (
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="dp-btn-primary text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Serviço à OS</span>
            </button>
          )}

          <button
            onClick={() => {
              try {
                generateServiceOrderPdf(order, { download: true });
              } catch (e) {
                console.error("Erro ao gerar PDF da OS:", e);
                alert("Erro ao gerar PDF.");
              }
            }}
            className="px-3.5 py-2 rounded-lg bg-[#247653] hover:bg-[#1E6346] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Baixar Ordem de Serviço em PDF Oficial"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Baixar PDF</span>
          </button>

          <button
            onClick={() => {
              try {
                const { doc } = generateServiceOrderPdf(order, { download: false });
                const blobUrl = doc.output("bloburl");
                window.open(blobUrl, "_blank");
              } catch (e) {
                console.error("Erro ao visualizar PDF:", e);
                alert("Erro ao visualizar PDF.");
              }
            }}
            className="px-3 py-2 rounded-lg bg-white hover:bg-[#F1F3F1] border border-[#E7EAE7] text-[#252B27] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Visualizar OS em PDF"
          >
            <span>Visualizar</span>
          </button>

          <Link
            href="/patio"
            className="dp-btn-secondary text-xs"
          >
            <Car className="w-4 h-4 text-[#247653]" />
            <span>Ver no Pátio</span>
          </Link>
        </div>
      </div>

      {/* Top Header Card */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#E7EAE7]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#247653] block mb-1">
              Detalhamento Operacional
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#252B27] flex items-center gap-3">
              <span>Ordem de Serviço #{order.orderNumber}</span>
              <span className="mercosul-plate text-xs font-bold">
                {order.vehicle.plate}
              </span>
            </h1>
            <p className="text-xs text-[#737D75] mt-1">
              {order.vehicle.brand} {order.vehicle.model} • Porte:{" "}
              <strong className="text-[#247653]">{order.vehicle.category}</strong> • Abertura:{" "}
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <OrderStatusBadge status={order.status} />
            <span className="text-xs text-[#737D75] flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-[#247653]" />
              Local: <strong className="text-[#252B27]">{order.box || "Pátio Geral"}</strong>
            </span>
          </div>
        </div>

        {/* TIMELINE VISUAL DO ATENDIMENTO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {timelineSteps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                  isCurrent
                    ? "bg-[#E9F3EC] border-[#247653] text-[#142D26] font-bold"
                    : isCompleted
                    ? "bg-[#ECFDF5]/60 border-[#A7F3D0] text-[#16A36A] font-semibold"
                    : "bg-[#F7F8F6] border-[#E7EAE7] text-[#9CA49E]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? "bg-[#247653] text-white"
                      : isCompleted
                      ? "bg-[#16A36A] text-white"
                      : "bg-[#E7EAE7] text-[#737D75]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Informações Resumidas do Veículo e Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Card Cliente */}
          <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-1.5">
            <div className="flex items-center justify-between text-[#737D75] text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#247653]" />
                Dados do Cliente
              </span>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#16A36A] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </a>
              )}
            </div>
            <p className="text-[#252B27] font-bold text-sm">
              {order.vehicle.customer?.name || "Cliente não informado"}
            </p>
            <p className="text-[#737D75] text-xs">
              Telefone: {customerWhatsapp || "Não cadastrado"}
            </p>
          </div>

          {/* Card Veículo */}
          <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-1.5">
            <span className="text-[#737D75] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#247653]" />
              Veículo em Produção
            </span>
            <p className="text-[#252B27] font-bold text-sm">
              {order.vehicle.model} {order.vehicle.color ? `• ${order.vehicle.color}` : ""}
            </p>
            <p className="text-[#737D75] text-xs">
              KM Entrada: {order.mileage ? `${order.mileage.toLocaleString("pt-BR")} km` : "Não registrado"}
            </p>
          </div>

          {/* Card Financeiro */}
          <div className="p-4 rounded-xl bg-[#E9F3EC]/50 border border-[#C6E2D0] space-y-1.5">
            <span className="text-[#142D26] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#247653]" />
              Totalização da OS
            </span>
            <p className="text-[#142D26] font-extrabold text-lg">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-[#343C36] text-xs">
              Subtotal: {formatCurrency(order.subtotal)}{" "}
              {order.discount > 0 ? `| Desconto: -${formatCurrency(order.discount)}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: SERVIÇOS CONTRATADOS & ADICIONAIS */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E7EAE7]">
          <div>
            <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#247653]" />
              <span>Serviços e Pacotes de Estética ({order.items.length})</span>
            </h2>
            <p className="text-xs text-[#737D75] mt-0.5">
              Itens em execução no veículo. Se o cliente solicitou novos serviços, adicione abaixo.
            </p>
          </div>

          {order.status !== "PAID" && (
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="dp-btn-primary text-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adicionar Novos Serviços</span>
            </button>
          )}
        </div>

        <div className="border border-[#E7EAE7] rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#F7F8F6] text-[#737D75] text-[11px] font-semibold uppercase border-b border-[#E7EAE7]">
              <tr>
                <th className="py-2.5 px-3">Serviço Solicitado</th>
                <th className="py-2.5 px-3 text-center w-16">Qtd</th>
                <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAE7] bg-white">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F8F6] transition">
                  <td className="py-3 px-3 font-semibold text-[#252B27]">
                    {item.serviceName}
                  </td>
                  <td className="py-3 px-3 text-center text-[#343C36]">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right text-[#737D75]">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#247653]">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.status !== "PAID" && (
          <div className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] flex items-center justify-between text-xs text-[#343C36]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#247653]" />
              <span>O cliente entrou em contato para incluir novos serviços antes da entrega?</span>
            </div>
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="text-[#247653] hover:text-[#142D26] font-bold underline cursor-pointer"
            >
              Clique aqui para adicionar à OS
            </button>
          </div>
        )}
      </div>

      {/* Observações da OS */}
      {order.notes && (
        <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 text-xs space-y-1 shadow-xs">
          <span className="text-[11px] text-[#737D75] uppercase tracking-wider block font-bold">
            Observações Técnicas / Operacionais:
          </span>
          <p className="text-[#252B27] leading-relaxed">{order.notes}</p>
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
