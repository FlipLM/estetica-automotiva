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
  Eye,
  CreditCard,
  RotateCcw,
  Package,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { formatStockQuantity } from "@/lib/inventory";
import { ManageOrderServicesModal } from "@/components/modules/manage-order-services-modal";
import { OrderPaymentModal } from "@/components/modules/order-payment-modal";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { Alert, Button, ConfirmationDialog } from "@/components/ui";
import { generateServiceOrderPdf } from "@/lib/pdf-generator";

interface OrderDetail {
  id: string;
  orderNumber: number;
  status: string;
  box?: string;
  mileage?: number;
  notes?: string;
  subtotal: number | null;
  discount: number | null;
  totalAmount: number | null;
  paidAmount: number | null;
  createdAt: string;
  tenant?: {
    debitFeeRate?: number;
    credit1xFeeRate?: number;
    credit2to6FeeRate?: number;
    credit7to12FeeRate?: number;
  };
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
    unitPrice: number | null;
    quantity: number;
    totalPrice: number | null;
    commissionAmount?: number | null;
    completed: boolean;
    service?: {
      recipes?: Array<{
        id: string;
        productId: string;
        quantityPerService: number;
        notes?: string | null;
        product: {
          id: string;
          name: string;
          unit: string;
          currentStock: number;
          costPrice: number;
          defaultDilution?: string | null;
          active: boolean;
        };
      }>;
    };
  }>;
  stockMovements?: Array<{
    id: string;
    productId: string;
    type: string;
    quantity: number;
    totalCost?: number | null;
    reason?: string | null;
    createdAt: string;
    product: { id: string; name: string; unit: string };
    user?: { id: string; name: string } | null;
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
    installments?: number;
    feeRate?: number;
    feeAmount?: number;
    netAmount?: number;
    paidAt: string;
    notes?: string | null;
  }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [reversingPaymentId, setReversingPaymentId] = useState<string | null>(
    null
  );
  const [reversing, setReversing] = useState(false);
  const [recipeSelections, setRecipeSelections] = useState<
    Record<string, { selected: boolean; quantity: string; name: string; unit: string; currentStock: number; defaultDilution?: string | null }>
  >({});
  const [consumingStock, setConsumingStock] = useState(false);
  const [consumeFeedback, setConsumeFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

      // Consolida insumos sugeridos pela ficha técnica dos serviços desta OS
      const suggestedMap: Record<
        string,
        { selected: boolean; quantity: string; name: string; unit: string; currentStock: number; defaultDilution?: string | null }
      > = {};
      for (const item of data.order?.items || []) {
        const qtyMultiplier = item.quantity || 1;
        for (const rec of item.service?.recipes || []) {
          if (!rec.product?.active) continue;
          const prevQty = suggestedMap[rec.productId]
            ? parseFloat(suggestedMap[rec.productId].quantity) || 0
            : 0;
          const totalSuggested =
            Math.round((prevQty + rec.quantityPerService * qtyMultiplier) * 100) / 100;
          suggestedMap[rec.productId] = {
            selected: true,
            quantity: String(totalSuggested),
            name: rec.product.name,
            unit: rec.product.unit,
            currentStock: rec.product.currentStock,
            defaultDilution: rec.product.defaultDilution,
          };
        }
      }
      setRecipeSelections(suggestedMap);
    } catch (err: any) {
      setError(err.message || "Erro na conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmConsumeStock() {
    if (!order) return;
    const selectedItems = Object.entries(recipeSelections)
      .filter(([, cfg]) => cfg.selected && parseFloat(cfg.quantity) > 0)
      .map(([productId, cfg]) => ({
        productId,
        quantity: parseFloat(cfg.quantity),
      }));

    if (selectedItems.length === 0) {
      setConsumeFeedback({
        type: "error",
        text: "Selecione pelo menos um insumo com quantidade maior que zero.",
      });
      return;
    }

    setConsumingStock(true);
    setConsumeFeedback(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/consume-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      });
      const json = await res.json();
      if (!res.ok) {
        setConsumeFeedback({
          type: "error",
          text: json.error || "Não foi possível dar baixa nos insumos.",
        });
        return;
      }
      setConsumeFeedback({
        type: "success",
        text: `${selectedItems.length} insumo(s) baixado(s) do estoque para a OS #${order.orderNumber}.`,
      });
      await loadOrder();
    } catch {
      setConsumeFeedback({
        type: "error",
        text: "Falha de conexão ao registrar consumo no estoque.",
      });
    } finally {
      setConsumingStock(false);
    }
  }

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  async function handleConfirmReversePayment() {
    if (!order || !reversingPaymentId) return;
    setReversing(true);
    try {
      const res = await fetch(
        `/api/orders/${order.id}/payments/${reversingPaymentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível estornar o pagamento.");
        return;
      }
      setReversingPaymentId(null);
      await loadOrder();
    } catch {
      alert("Falha de conexão ao estornar pagamento.");
    } finally {
      setReversing(false);
    }
  }

  if (loading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-2 text-[#737D75]">
        <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
        <p className="text-xs font-medium">
          Carregando detalhes da Ordem de Serviço...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white border border-[#FECACA] rounded-xl text-center space-y-4 shadow-xs">
        <AlertCircle className="w-10 h-10 text-[#DC4C4C] mx-auto" />
        <h2 className="text-base font-bold text-[#252B27]">
          Ordem de Serviço Não Encontrada
        </h2>
        <p className="text-xs text-[#DC4C4C]">
          {error || "Registro indisponível."}
        </p>
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

  const isAdminFinancialView = typeof order.totalAmount === "number";
  const paidAmountVal = order.paidAmount ?? 0;
  const totalAmountVal = order.totalAmount ?? 0;
  const remainingAmount = Math.max(0, totalAmountVal - paidAmountVal);
  const isPartiallyPaid =
    isAdminFinancialView && paidAmountVal > 0 && order.status !== "PAID";

  const customerWhatsapp =
    order.vehicle.customer?.whatsapp || order.vehicle.customer?.phone;
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

  const reversingPayment = order.payments?.find(
    (p) => p.id === reversingPaymentId
  );

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
          {order.status !== "PAID" && order.status !== "CANCELLED" && (
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="dp-btn-primary text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Serviço à OS</span>
            </button>
          )}

          {isAdminFinancialView &&
            order.status !== "PAID" &&
            order.status !== "CANCELLED" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPaymentModalOpen(true)}
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              >
                {paidAmountVal > 0
                  ? "Receber Restante / Sinal"
                  : "Registrar Sinal / Pagamento"}
              </Button>
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
                const { doc } = generateServiceOrderPdf(order, {
                  download: false,
                });
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
            <Eye className="w-3.5 h-3.5 text-[#737D75]" />
            <span>Visualizar</span>
          </button>

          <Link href="/patio" className="dp-btn-secondary text-xs">
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#252B27] flex items-center gap-3 flex-wrap">
              <span>Ordem de Serviço #{order.orderNumber}</span>
              <span className="mercosul-plate text-xs font-bold">
                {order.vehicle.plate}
              </span>
            </h1>
            <p className="text-xs text-[#737D75] mt-1">
              {order.vehicle.brand} {order.vehicle.model} • Porte:{" "}
              <strong className="text-[#247653]">
                {order.vehicle.category}
              </strong>{" "}
              • Abertura: {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <OrderStatusBadge status={order.status} />
              {isPartiallyPaid && (
                <Badge variant="warning" dot>
                  Pago Parcial
                </Badge>
              )}
            </div>
            <span className="text-xs text-[#737D75] flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-[#247653]" />
              Local:{" "}
              <strong className="text-[#252B27]">
                {order.box || "Pátio Geral"}
              </strong>
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
              {order.vehicle.model}{" "}
              {order.vehicle.color ? `• ${order.vehicle.color}` : ""}
            </p>
            <p className="text-[#737D75] text-xs">
              KM Entrada:{" "}
              {order.mileage
                ? `${order.mileage.toLocaleString("pt-BR")} km`
                : "Não registrado"}
            </p>
          </div>

          {/* Card Financeiro */}
          <div className="p-4 rounded-xl bg-[#E9F3EC]/50 border border-[#C6E2D0] space-y-1.5">
            <span className="text-[#142D26] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#247653]" />
              Totalização da OS
            </span>
            {isAdminFinancialView ? (
              <>
                <p className="text-[#142D26] font-extrabold text-lg">
                  {formatCurrency(totalAmountVal)}
                </p>
                <p className="text-[#343C36] text-xs">
                  Subtotal: {formatCurrency(order.subtotal ?? 0)}{" "}
                  {(order.discount ?? 0) > 0
                    ? `| Desconto: -${formatCurrency(order.discount ?? 0)}`
                    : ""}
                </p>
                {paidAmountVal > 0 && order.status !== "PAID" && (
                  <p className="text-[11px] font-semibold text-[#D97706]">
                    Já pago: {formatCurrency(paidAmountVal)} • Falta:{" "}
                    {formatCurrency(remainingAmount)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[#737D75] text-xs pt-1">
                Valores visíveis apenas para administradores.
              </p>
            )}
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
              Itens em execução no veículo. Se o cliente solicitou novos
              serviços, adicione abaixo.
            </p>
          </div>

          {order.status !== "PAID" && order.status !== "CANCELLED" && (
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
                {isAdminFinancialView && (
                  <>
                    <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </>
                )}
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
                  {isAdminFinancialView && (
                    <>
                      <td className="py-3 px-3 text-right text-[#737D75]">
                        {formatCurrency(item.unitPrice ?? 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#247653]">
                        {formatCurrency(item.totalPrice ?? 0)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.status !== "PAID" && order.status !== "CANCELLED" && (
          <div className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] flex items-center justify-between text-xs text-[#343C36]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#247653]" />
              <span>
                O cliente entrou em contato para incluir novos serviços antes da
                entrega?
              </span>
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

      {/* Consumo de Insumos (Ficha Técnica da OS) */}
      {(Object.keys(recipeSelections).length > 0 ||
        (order.stockMovements && order.stockMovements.length > 0)) && (
        <div className="bg-white border border-[#E7EAE7] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E7EAE7]">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#247653]" />
              <h2 className="text-base font-bold text-[#252B27]">
                Consumo de Insumos da OS
              </h2>
            </div>
            <span className="text-xs text-[#737D75]">
              {order.stockMovements && order.stockMovements.length > 0
                ? `${order.stockMovements.length} baixa(s) já registrada(s) nesta OS`
                : "Sugestão baseada na ficha técnica dos serviços"}
            </span>
          </div>

          {consumeFeedback && (
            <Alert variant={consumeFeedback.type === "success" ? "success" : "error"}>
              {consumeFeedback.text}
            </Alert>
          )}

          {Object.keys(recipeSelections).length > 0 && order.status !== "CANCELLED" && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-[#343C36]">
                Confirmar ou ajustar quantidade real gasta:
              </p>
              <div className="space-y-2">
                {Object.entries(recipeSelections).map(([productId, cfg]) => (
                  <div
                    key={productId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] text-xs"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={cfg.selected}
                        onChange={(e) =>
                          setRecipeSelections((prev) => ({
                            ...prev,
                            [productId]: { ...prev[productId], selected: e.target.checked },
                          }))
                        }
                        className="w-4 h-4 accent-[#247653] rounded"
                      />
                      <div>
                        <span className="font-semibold text-[#252B27]">{cfg.name}</span>
                        <span className="block text-[11px] text-[#737D75]">
                          Disponível em estoque: {formatStockQuantity(cfg.currentStock, cfg.unit)}
                          {cfg.defaultDilution ? ` • Diluição padrão ${cfg.defaultDilution}` : ""}
                        </span>
                      </div>
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        disabled={!cfg.selected}
                        value={cfg.quantity}
                        onChange={(e) =>
                          setRecipeSelections((prev) => ({
                            ...prev,
                            [productId]: { ...prev[productId], quantity: e.target.value },
                          }))
                        }
                        className="dp-input w-24 text-right font-semibold py-1.5"
                      />
                      <span className="text-xs font-medium text-[#737D75] w-8">
                        {cfg.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmConsumeStock}
                  loading={consumingStock}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirmar Baixa no Estoque
                </Button>
              </div>
            </div>
          )}

          {order.stockMovements && order.stockMovements.length > 0 && (
            <div className="pt-2 border-t border-[#E7EAE7] space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#737D75]">
                Insumos já baixados nesta OS
              </p>
              <div className="divide-y divide-[#F1F3F1] text-xs">
                {order.stockMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-[#252B27]">
                        {mov.product.name}
                      </span>
                      <span className="text-[#737D75] ml-2">
                        {formatStockQuantity(mov.quantity, mov.product.unit)}
                      </span>
                      {mov.user?.name && (
                        <span className="text-[11px] text-[#737D75] block">
                          Registrado por {mov.user.name} em {formatDateTime(mov.createdAt)}
                        </span>
                      )}
                    </div>
                    {isAdminFinancialView && mov.totalCost != null && (
                      <span className="font-semibold text-[#343C36]">
                        {formatCurrency(mov.totalCost)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagamentos Registrados (Visível apenas quando retornado pela API para ADMIN) */}
      {isAdminFinancialView &&
        ((order.payments && order.payments.length > 0) ||
          order.status !== "CANCELLED") && (
          <div className="bg-white border border-[#E7EAE7] rounded-2xl p-6 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E7EAE7]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#247653]" />
                <h2 className="text-base font-bold text-[#252B27]">
                  Pagamentos Registrados ({order.payments?.length || 0})
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#16A36A]">
                  Pago: {formatCurrency(paidAmountVal)}
                  {remainingAmount > 0.01 &&
                    ` • Restante: ${formatCurrency(remainingAmount)}`}
                </span>
                {order.status !== "PAID" && order.status !== "CANCELLED" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPaymentModalOpen(true)}
                    leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                  >
                    Lançar Pagamento
                  </Button>
                )}
              </div>
            </div>

            {!order.payments || order.payments.length === 0 ? (
              <p className="text-xs text-[#737D75] py-3">
                Nenhum pagamento ou sinal registrado até o momento.
              </p>
            ) : (
              <div className="divide-y divide-[#F1F3F1] text-xs">
                {order.payments.map((payment) => {
                  const feeAmount = payment.feeAmount ?? 0;
                  const netAmount =
                    payment.netAmount && payment.netAmount > 0
                      ? payment.netAmount
                      : Math.max(0, payment.amount - feeAmount);
                  return (
                    <div
                      key={payment.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#252B27]">
                            {PAYMENT_METHOD_LABELS[payment.method] ||
                              payment.method}
                          </span>
                          {(payment.installments ?? 1) > 1 && (
                            <Badge variant="neutral" size="sm">
                              {payment.installments}x
                            </Badge>
                          )}
                          {feeAmount > 0 && (
                            <Badge variant="warning" size="sm">
                              Taxa {(payment.feeRate ?? 0).toFixed(2)}% (-
                              {formatCurrency(feeAmount)}) • Líq.{" "}
                              {formatCurrency(netAmount)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[#737D75]">
                          Recebido em {formatDateTime(payment.paidAt)}
                          {payment.notes ? ` • ${payment.notes}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-[#16A36A] text-sm">
                          {formatCurrency(payment.amount)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReversingPaymentId(payment.id)}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          title="Estornar este pagamento"
                        >
                          Estornar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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

      {/* Modal de Pagamento / Sinal Parcial */}
      {isAdminFinancialView && (
        <OrderPaymentModal
          order={
            isPaymentModalOpen
              ? {
                  id: order.id,
                  orderNumber: order.orderNumber,
                  plate: order.vehicle.plate,
                  model: order.vehicle.model,
                  customerName: order.vehicle.customer?.name,
                  totalAmount: totalAmountVal,
                  paidAmount: paidAmountVal,
                }
              : null
          }
          tenantRates={order.tenant}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaid={loadOrder}
        />
      )}

      {/* Confirmação de Estorno de Pagamento */}
      <ConfirmationDialog
        isOpen={!!reversingPaymentId}
        onClose={() => setReversingPaymentId(null)}
        onConfirm={handleConfirmReversePayment}
        title="Estornar este pagamento?"
        description={
          reversingPayment
            ? `Você está estornando ${formatCurrency(
                reversingPayment.amount
              )} (${
                PAYMENT_METHOD_LABELS[reversingPayment.method] ||
                reversingPayment.method
              }). Se a OS estava quitada, ela será reaberta e a comissão pendente removida.`
            : ""
        }
        confirmLabel="Confirmar Estorno"
        destructive
        loading={reversing}
      />
    </div>
  );
}
