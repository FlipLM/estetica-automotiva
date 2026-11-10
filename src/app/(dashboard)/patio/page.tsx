"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Wrench,
  CheckCircle2,
  Receipt,
  Car,
  User,
  MapPin,
  Plus,
  RefreshCw,
  ArrowRight,
  Kanban,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Droplets,
  Eye,
  MessageCircle,
  Phone,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ManageOrderServicesModal } from "@/components/modules/manage-order-services-modal";
import { TransferOrderBoxModal } from "@/components/modules/transfer-order-box-modal";
import {
  Button,
  Badge,
  StatusBadge,
  PageHeader,
  Modal,
  LoadingState,
} from "@/components/ui";

interface WorkBay {
  id: string;
  name: string;
  type?: string;
  description?: string | null;
  color?: string | null;
  capacity: number;
  occupiedCount: number;
  availableSlots: number;
  isFull: boolean;
  status?: string;
}

interface Order {
  id: string;
  orderNumber: number;
  plate: string;
  model: string;
  category: string;
  customerName: string;
  customerPhone?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "PAID";
  box: string;
  totalAmount: number | null;
  mainService: string;
  assignedTo: string;
  createdAt: string;
}

const BOX_ICONS: Record<string, any> = {
  LAVAGEM: Droplets,
  POLIMENTO: Sparkles,
  HIGIENIZACAO: Wrench,
  RAMPA: Car,
  GERAL: Layers,
};

export default function PatioKanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [boxes, setBoxes] = useState<WorkBay[]>([]);
  const [role, setRole] = useState<"ADMIN" | "OPERATOR">("OPERATOR");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"STATUS" | "BOXES">("STATUS");
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  // Modais
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "TRANSFER"
  >("PIX");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Modal de Gestão/Adição de Serviços para OS existente
  const [selectedOrderForServices, setSelectedOrderForServices] = useState<Order | null>(null);

  // Modal de Transferência Rápida de Box
  const [transferringOrder, setTransferringOrder] = useState<Order | null>(null);

  // Modal de Alteração Rápida de Status (para facilitar em telas mobile)
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);

  async function loadPatio() {
    try {
      setLoading(true);
      const [resStats, resBoxes, resOrders] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/boxes"),
        fetch("/api/orders"),
      ]);

      const jsonStats = await resStats.json();
      const jsonBoxes = await resBoxes.json();
      const jsonOrders = await resOrders.json();

      setRole(jsonStats.role || "OPERATOR");
      setBoxes(jsonBoxes.boxes || []);

      if (jsonOrders && Array.isArray(jsonOrders.orders)) {
        const mappedOrders: Order[] = jsonOrders.orders.map((os: any) => {
          const cust = os.vehicle?.customer || os.vehicle?.customerVehicles?.[0]?.customer;
          return {
            id: os.id,
            orderNumber: os.orderNumber,
            plate: os.vehicle?.plate || "SEM PLACA",
            model: `${os.vehicle?.brand || ""} ${os.vehicle?.model || ""}`.trim() || "Veículo",
            category: os.vehicle?.category || "GERAL",
            customerName: cust?.name || "Não informado",
            customerPhone: cust?.whatsapp || cust?.phone || "",
            status: os.status,
            box: os.box || "Pátio Geral",
            totalAmount: jsonStats.role === "ADMIN" ? os.totalAmount : null,
            mainService: os.items?.[0]?.serviceName || "Serviço Geral",
            assignedTo: os.assignedUser?.name || "Não atribuído",
            createdAt: os.createdAt,
          };
        });
        setOrders(mappedOrders);
      } else {
        setOrders(jsonStats.recentOrders || []);
      }
    } catch (err) {
      console.error("Erro ao carregar pátio:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatio();
  }, []);

  async function updateOrderStatus(
    orderId: string,
    newStatus: "TODO" | "IN_PROGRESS" | "DONE" | "PAID",
    method?: string
  ) {
    if (newStatus === "PAID" && !method) {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setPaymentModalOrder(order);
        return;
      }
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          paymentMethod: method || "PIX",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível atualizar o status.");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      console.error(e);
      alert("Erro na conexão ao alterar status.");
    }
  }

  async function handleTransferOrderBox(orderId: string, targetBoxName: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box: targetBoxName }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível transferir o veículo para este box.");
        return false;
      }

      await loadPatio();
      return true;
    } catch (err) {
      console.error(err);
      alert("Erro na conexão ao transferir veículo.");
      return false;
    }
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentModalOrder) return;

    setSubmittingPayment(true);
    try {
      await updateOrderStatus(paymentModalOrder.id, "PAID", paymentMethod);
      setPaymentModalOrder(null);
      loadPatio();
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Drag and Drop por Status
  function handleDragStart(e: React.DragEvent, orderId: string) {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData("text/plain", orderId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDropStatus(e: React.DragEvent, targetStatus: Order["status"]) {
    e.preventDefault();
    const orderId = draggedOrderId || e.dataTransfer.getData("text/plain");
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === targetStatus) return;

    updateOrderStatus(orderId, targetStatus);
    setDraggedOrderId(null);
  }

  // Drag and Drop por Box
  function handleDropBox(e: React.DragEvent, targetBoxName: string) {
    e.preventDefault();
    const orderId = draggedOrderId || e.dataTransfer.getData("text/plain");
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order || order.box === targetBoxName) return;

    const targetBay = boxes.find(
      (b) => b.name.toLowerCase() === targetBoxName.toLowerCase()
    );

    if (targetBay && targetBay.isFull && targetBay.name !== order.box) {
      alert(
        `Bloqueado: O ${targetBay.name} está LOTADO (${targetBay.occupiedCount}/${targetBay.capacity} vagas ocupadas). Selecione outro box disponível.`
      );
      return;
    }

    handleTransferOrderBox(orderId, targetBoxName);
    setDraggedOrderId(null);
  }

  const columns: Array<{
    id: Order["status"];
    title: string;
    description: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    badgeVariant: "warning" | "info" | "success" | "brand";
  }> = [
    {
      id: "TODO",
      title: "1. Para Fazer",
      description: "Aguardando início",
      icon: Clock,
      iconBg: "bg-[#FFFBEB]",
      iconColor: "text-[#D97706]",
      badgeVariant: "warning",
    },
    {
      id: "IN_PROGRESS",
      title: "2. Em Serviço",
      description: "Lavagem / Detailing",
      icon: Wrench,
      iconBg: "bg-[#EFF6FF]",
      iconColor: "text-[#2563EB]",
      badgeVariant: "info",
    },
    {
      id: "DONE",
      title: "3. Concluídos",
      description: "Pronto para entrega",
      icon: CheckCircle2,
      iconBg: "bg-[#ECFDF5]",
      iconColor: "text-[#16A36A]",
      badgeVariant: "success",
    },
    {
      id: "PAID",
      title: "4. Pagos / Entregues",
      description: "Atendimento encerrado",
      icon: Receipt,
      iconBg: "bg-[#E9F3EC]",
      iconColor: "text-[#247653]",
      badgeVariant: "brand",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban do Pátio"
        description="Acompanhe os veículos em atendimento por etapa do serviço ou por box físico de trabalho."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Alternador de Visão */}
            <div className="inline-flex items-center p-1 rounded-lg bg-[#F1F3F1] border border-[#E7EAE7]">
              <button
                type="button"
                onClick={() => setViewMode("STATUS")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "STATUS"
                    ? "bg-white text-[#252B27] shadow-xs font-semibold"
                    : "text-[#737D75] hover:text-[#252B27]"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Por Status</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("BOXES")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "BOXES"
                    ? "bg-white text-[#252B27] shadow-xs font-semibold"
                    : "text-[#737D75] hover:text-[#252B27]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Por Box e Vagas</span>
                {boxes.some((b) => b.isFull) && (
                  <span className="w-2 h-2 rounded-full bg-[#DC4C4C]" />
                )}
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={loadPatio}
              disabled={loading}
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              Atualizar
            </Button>

            <Link href="/os/nova">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Nova Ordem
              </Button>
            </Link>
          </div>
        }
      />

      {/* Resumo de Ocupação dos Boxes */}
      {boxes.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E7EAE7] p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 pb-2.5 border-b border-[#F1F3F1]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#247653]" />
              <span className="text-xs font-semibold text-[#252B27]">
                Ocupação dos Boxes e Baias
              </span>
              <span className="text-xs text-[#737D75]">
                ({boxes.reduce((acc, b) => acc + (b.occupiedCount || 0), 0)} de{" "}
                {boxes.reduce((acc, b) => acc + b.capacity, 0)} vagas ocupadas)
              </span>
            </div>
            <Link
              href="/boxes"
              className="text-xs font-medium text-[#247653] hover:text-[#142D26] inline-flex items-center gap-1 transition-colors"
            >
              <span>Configurar boxes e vagas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {boxes.map((b) => (
              <div
                key={b.id}
                onClick={() => setViewMode("BOXES")}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  b.isFull
                    ? "bg-[#FEF2F2]/60 border-[#DC4C4C]/30 hover:border-[#DC4C4C]"
                    : b.occupiedCount > 0
                    ? "bg-[#FFFBEB]/50 border-[#D97706]/30 hover:border-[#D97706]"
                    : "bg-[#F7F8F6] border-[#E7EAE7] hover:border-[#247653]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs text-[#252B27] truncate">{b.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      b.isFull
                        ? "bg-[#DC4C4C]"
                        : b.occupiedCount > 0
                        ? "bg-[#D97706]"
                        : "bg-[#16A36A]"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#737D75]">
                  <span>Vagas:</span>
                  <span className="font-semibold text-[#252B27]">
                    {b.occupiedCount}/{b.capacity}
                  </span>
                </div>

                <div className="w-full bg-[#E7EAE7] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      b.isFull
                        ? "bg-[#DC4C4C]"
                        : b.occupiedCount > 0
                        ? "bg-[#D97706]"
                        : "bg-[#16A36A]"
                    }`}
                    style={{
                      width: `${Math.min(100, (b.occupiedCount / Math.max(1, b.capacity)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState message="Sincronizando veículos no pátio..." />
      ) : viewMode === "STATUS" ? (
        /* MODO 1: KANBAN POR STATUS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropStatus(e, col.id)}
                className="bg-[#F1F3F1]/70 border border-[#E7EAE7] rounded-xl p-3 flex flex-col min-h-[540px]"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E7EAE7]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${col.iconBg} ${col.iconColor} flex items-center justify-center`}>
                      <col.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#252B27] leading-tight">
                        {col.title}
                      </h2>
                      <p className="text-xs text-[#737D75]">{col.description}</p>
                    </div>
                  </div>
                  <Badge variant={col.badgeVariant} size="sm">
                    {colOrders.length}
                  </Badge>
                </div>

                {/* Lista de Cards Arrastáveis */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border border-dashed border-[#D4D9D4] rounded-xl text-[#737D75] text-xs bg-white/50">
                      Arraste um veículo para cá
                    </div>
                  ) : (
                    colOrders.map((os) => (
                      <div
                        key={os.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, os.id)}
                        className="p-3.5 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653]/50 shadow-xs transition-all text-xs space-y-3 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/os/${os.id}`}
                                className="text-xs font-semibold text-[#247653] hover:underline"
                              >
                                OS #{os.orderNumber}
                              </Link>
                            </div>
                            <div className="mt-1">
                              <span className="mercosul-plate">{os.plate}</span>
                            </div>
                          </div>
                          <Badge variant="neutral" size="sm">
                            {os.category}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-[#252B27] font-semibold text-sm">{os.model}</p>
                          <p className="text-xs text-[#247653] font-medium mt-0.5">
                            {os.mainService}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-[#F1F3F1] flex items-center justify-between text-xs text-[#737D75]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <User className="w-3.5 h-3.5 text-[#9CA49E] shrink-0" />
                            <span className="truncate max-w-[105px]">{os.customerName}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransferringOrder(os);
                            }}
                            className="inline-flex items-center gap-1 font-medium text-[#252B27] hover:text-[#247653] px-2 py-1 rounded-md bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] transition cursor-pointer"
                            title="Transferir para outro box"
                          >
                            <MapPin className="w-3 h-3 text-[#247653]" />
                            <span className="truncate max-w-[85px]">{os.box || "Pátio"}</span>
                            <ArrowRightLeft className="w-3 h-3 text-[#737D75]" />
                          </button>
                        </div>

                        {role === "ADMIN" && os.totalAmount !== null && (
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-[#737D75]">Valor da OS:</span>
                            <span className="font-semibold text-[#252B27]">
                              {formatCurrency(os.totalAmount)}
                            </span>
                          </div>
                        )}

                        {/* Botões de Ação Rápidos (Ideais para Mobile & 1-Clique) */}
                        <div className="pt-2.5 border-t border-[#F1F3F1] space-y-2">
                          {/* Ações de Gestão Rápida: Mudar Status & Mudar Box */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusModalOrder(os);
                              }}
                              className="w-full py-1.5 px-2 rounded-lg bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] hover:border-[#247653]/30 text-[11px] font-semibold text-[#252B27] flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title="Alterar status da OS sem arrastar"
                            >
                              <RefreshCw className="w-3 h-3 text-[#247653]" />
                              <span>Mudar Status</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransferringOrder(os);
                              }}
                              className="w-full py-1.5 px-2 rounded-lg bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] hover:border-[#247653]/30 text-[11px] font-semibold text-[#252B27] flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title="Transferir de box ou vaga sem arrastar"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-[#247653]" />
                              <span>Mudar Box</span>
                            </button>
                          </div>

                          {os.status !== "PAID" && (
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderForServices(os);
                              }}
                              leftIcon={<Plus className="w-3.5 h-3.5 text-[#247653]" />}
                            >
                              Adicionar Serviço
                            </Button>
                          )}

                          {os.status === "TODO" && (
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() => updateOrderStatus(os.id, "IN_PROGRESS")}
                              leftIcon={<Wrench className="w-3.5 h-3.5" />}
                            >
                              Iniciar Serviço
                            </Button>
                          )}

                          {os.status === "IN_PROGRESS" && (
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() => updateOrderStatus(os.id, "DONE")}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Finalizar Serviço
                            </Button>
                          )}

                          {os.status === "DONE" && (
                            <div className="space-y-1.5">
                              {/* Botões de Contato Rápido com o Cliente: WhatsApp ou Ligar */}
                              <div className="p-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg space-y-1.5">
                                <span className="text-[10px] font-bold text-[#065F46] uppercase tracking-wider block">
                                  Veículo Pronto para Retirada:
                                </span>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {os.customerPhone ? (
                                    <>
                                      <a
                                        href={`https://wa.me/55${os.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                          `Olá, ${os.customerName}! Seu veículo (${os.model} - ${os.plate}) já está com os serviços concluídos na DetailPro e pronto para retirada! 🚗✨`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-1.5 px-2 rounded-md bg-[#16A36A] hover:bg-[#15803D] text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
                                        title="Avisar cliente no WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                      </a>

                                      <a
                                        href={`tel:${os.customerPhone.replace(/\D/g, "")}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-1.5 px-2 rounded-md bg-white hover:bg-[#F1F3F1] border border-[#A7F3D0] text-[#065F46] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                                        title="Ligar para o cliente"
                                      >
                                        <Phone className="w-3.5 h-3.5 text-[#16A36A]" />
                                        <span>Ligar</span>
                                      </a>
                                    </>
                                  ) : (
                                    <div className="col-span-2 text-[10px] text-[#737D75] italic text-center py-1">
                                      Telefone não cadastrado
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                onClick={() => {
                                  if (role === "ADMIN") {
                                    setPaymentModalOrder(os);
                                  } else {
                                    alert(
                                      "Apenas administradores podem registrar a baixa de pagamento da OS."
                                    );
                                  }
                                }}
                                leftIcon={<Receipt className="w-3.5 h-3.5" />}
                              >
                                Registrar Pagamento
                              </Button>
                            </div>
                          )}

                          {os.status === "PAID" && (
                            <Link href={`/os/${os.id}`} className="block">
                              <Button
                                variant="ghost"
                                size="sm"
                                fullWidth
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                              >
                                Ver Comprovante
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODO 2: VISÃO POR BOX E VAGAS */
        <div className="space-y-4">
          <div className="p-3.5 bg-[#E9F3EC]/60 border border-[#247653]/20 rounded-xl flex items-center justify-between text-xs text-[#142D26]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#247653] shrink-0" />
              <span>
                <strong>Mapa de Estações Físicas:</strong> Arraste qualquer veículo entre os boxes para transferir de posto de trabalho. As vagas respeitam a capacidade de cada box.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {boxes.map((b) => {
              const Icon = BOX_ICONS[b.type || "GERAL"] || Layers;
              const boxOrders = orders.filter(
                (o) =>
                  o.status !== "PAID" &&
                  (o.box === b.name ||
                    o.box === b.id ||
                    (b.name && o.box && o.box.trim().toLowerCase() === b.name.trim().toLowerCase()))
              );

              const emptySlotsCount = Math.max(0, b.capacity - boxOrders.length);

              return (
                <div
                  key={b.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropBox(e, b.name)}
                  className={`rounded-xl p-4 border transition-all flex flex-col min-h-[460px] ${
                    b.isFull
                      ? "bg-[#FEF2F2]/30 border-[#DC4C4C]/40"
                      : "bg-[#F1F3F1]/70 border-[#E7EAE7]"
                  }`}
                >
                  {/* Header do Box */}
                  <div className="pb-3 mb-3 border-b border-[#E7EAE7]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: b.color || "#247653" }}
                        />
                        <Icon className="w-4 h-4 text-[#737D75] shrink-0" />
                        <h2 className="text-sm font-semibold text-[#252B27] truncate">
                          {b.name}
                        </h2>
                      </div>

                      <Badge
                        variant={
                          b.isFull ? "error" : boxOrders.length > 0 ? "warning" : "success"
                        }
                        size="sm"
                      >
                        {boxOrders.length}/{b.capacity} {b.capacity === 1 ? "vaga" : "vagas"}
                      </Badge>
                    </div>

                    {b.description && (
                      <p className="text-xs text-[#737D75] mt-1 line-clamp-1">
                        {b.description}
                      </p>
                    )}

                    <div className="w-full bg-[#E7EAE7] h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          b.isFull
                            ? "bg-[#DC4C4C]"
                            : boxOrders.length > 0
                            ? "bg-[#D97706]"
                            : "bg-[#16A36A]"
                        }`}
                        style={{
                          width: `${Math.min(100, (boxOrders.length / Math.max(1, b.capacity)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Vagas e Veículos Dentro do Box */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {boxOrders.map((os) => (
                      <div
                        key={os.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, os.id)}
                        className="p-3.5 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653]/50 shadow-xs transition-all text-xs space-y-2.5 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#247653]">
                                OS #{os.orderNumber}
                              </span>
                              <StatusBadge status={os.status} size="sm" />
                            </div>
                            <div className="mt-1.5">
                              <span className="mercosul-plate">{os.plate}</span>
                            </div>
                          </div>
                          <Badge variant="neutral" size="sm">
                            {os.category}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-[#252B27] font-semibold text-sm">{os.model}</p>
                          <p className="text-xs text-[#247653] font-medium">
                            {os.mainService}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#F1F3F1] flex items-center justify-between text-xs text-[#737D75]">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="w-3.5 h-3.5 text-[#9CA49E] shrink-0" />
                            <span className="truncate max-w-[110px]">{os.customerName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransferringOrder(os);
                            }}
                            className="text-xs font-medium text-[#247653] hover:text-[#142D26] flex items-center gap-1 bg-[#F7F8F6] px-2 py-1 rounded-md border border-[#E7EAE7] transition cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Trocar Box</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-[#F1F3F1] space-y-2">
                          {/* Ações de Gestão Rápida: Mudar Status & Mudar Box */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatusModalOrder(os);
                              }}
                              className="w-full py-1.5 px-2 rounded-lg bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] hover:border-[#247653]/30 text-[11px] font-semibold text-[#252B27] flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title="Alterar status da OS sem arrastar"
                            >
                              <RefreshCw className="w-3 h-3 text-[#247653]" />
                              <span>Mudar Status</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransferringOrder(os);
                              }}
                              className="w-full py-1.5 px-2 rounded-lg bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] hover:border-[#247653]/30 text-[11px] font-semibold text-[#252B27] flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title="Transferir de box ou vaga sem arrastar"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-[#247653]" />
                              <span>Mudar Box</span>
                            </button>
                          </div>

                          {os.status === "TODO" && (
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() => updateOrderStatus(os.id, "IN_PROGRESS")}
                              leftIcon={<Wrench className="w-3.5 h-3.5" />}
                            >
                              Iniciar Serviço
                            </Button>
                          )}

                          {os.status === "IN_PROGRESS" && (
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() => updateOrderStatus(os.id, "DONE")}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Concluir Serviço
                            </Button>
                          )}

                          {os.status === "DONE" && (
                            <div className="space-y-1.5">
                              {/* Botões de Contato Rápido com o Cliente: WhatsApp ou Ligar */}
                              <div className="p-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg space-y-1.5">
                                <span className="text-[10px] font-bold text-[#065F46] uppercase tracking-wider block">
                                  Veículo Pronto para Retirada:
                                </span>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {os.customerPhone ? (
                                    <>
                                      <a
                                        href={`https://wa.me/55${os.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                          `Olá, ${os.customerName}! Seu veículo (${os.model} - ${os.plate}) já está com os serviços concluídos na DetailPro e pronto para retirada! 🚗✨`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-1.5 px-2 rounded-md bg-[#16A36A] hover:bg-[#15803D] text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
                                        title="Avisar cliente no WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                      </a>

                                      <a
                                        href={`tel:${os.customerPhone.replace(/\D/g, "")}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-1.5 px-2 rounded-md bg-white hover:bg-[#F1F3F1] border border-[#A7F3D0] text-[#065F46] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                                        title="Ligar para o cliente"
                                      >
                                        <Phone className="w-3.5 h-3.5 text-[#16A36A]" />
                                        <span>Ligar</span>
                                      </a>
                                    </>
                                  ) : (
                                    <div className="col-span-2 text-[10px] text-[#737D75] italic text-center py-1">
                                      Telefone não cadastrado
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                onClick={() => {
                                  if (role === "ADMIN") {
                                    setPaymentModalOrder(os);
                                  } else {
                                    alert("Apenas administradores podem registrar a baixa da OS.");
                                  }
                                }}
                                leftIcon={<Receipt className="w-3.5 h-3.5" />}
                              >
                                Registrar Pagamento
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Vagas Livres Demarcadas */}
                    {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
                      <div
                        key={`empty-slot-${b.id}-${slotIdx}`}
                        className="border border-dashed border-[#D4D9D4] rounded-xl p-4 text-center flex flex-col items-center justify-center min-h-[100px] bg-white/60 text-[#737D75] transition-colors hover:border-[#247653]/50"
                      >
                        <Car className="w-5 h-5 text-[#9CA49E] mb-1" />
                        <span className="text-xs text-[#252B27] font-semibold">
                          Vaga {boxOrders.length + slotIdx + 1} de {b.capacity} Livre
                        </span>
                        <span className="text-[11px] text-[#737D75] mt-0.5">
                          Arraste um veículo para cá
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Pátio Geral / Sem Box */}
            {(() => {
              const unassignedOrders = orders.filter(
                (o) =>
                  o.status !== "PAID" &&
                  !boxes.some(
                    (b) =>
                      o.box === b.name ||
                      o.box === b.id ||
                      (b.name && o.box && o.box.trim().toLowerCase() === b.name.trim().toLowerCase())
                  )
              );

              return (
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropBox(e, "Pátio Geral")}
                  className="rounded-xl p-4 border border-dashed border-[#D4D9D4] bg-[#F7F8F6] flex flex-col min-h-[460px]"
                >
                  <div className="pb-3 mb-3 border-b border-[#E7EAE7]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#737D75]" />
                        <h2 className="text-sm font-semibold text-[#252B27]">
                          Pátio de Espera
                        </h2>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {unassignedOrders.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#737D75] mt-1">
                      Veículos aguardando alocação em um box
                    </p>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {unassignedOrders.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center border border-dashed border-[#E7EAE7] rounded-xl text-[#737D75] text-xs text-center p-4 bg-white/50">
                        <CheckCircle2 className="w-5 h-5 text-[#16A36A] mb-1.5" />
                        <span className="font-medium text-[#252B27]">Pátio organizado!</span>
                        <span className="text-[11px] text-[#737D75] mt-0.5">
                          Todos os veículos estão alocados em boxes.
                        </span>
                      </div>
                    ) : (
                      unassignedOrders.map((os) => (
                        <div
                          key={os.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, os.id)}
                          className="p-3.5 rounded-xl bg-white border border-[#E7EAE7] shadow-xs text-xs space-y-2.5 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between">
                            <span className="mercosul-plate">{os.plate}</span>
                            <Badge variant="neutral" size="sm">
                              {os.category}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-[#252B27] font-semibold text-sm">{os.model}</p>
                            <p className="text-xs text-[#247653]">{os.mainService}</p>
                          </div>
                          <div className="pt-2 border-t border-[#F1F3F1] flex items-center justify-between">
                            <span className="text-[#737D75]">Local: {os.box || "Geral"}</span>
                            <button
                              type="button"
                              onClick={() => setTransferringOrder(os)}
                              className="text-xs font-semibold text-[#247653] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Alocar em Box</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL DE ALTERAÇÃO RÁPIDA DE STATUS (SEM ARRASTAR) */}
      <Modal
        isOpen={!!statusModalOrder}
        onClose={() => setStatusModalOrder(null)}
        title={statusModalOrder ? `Mudar Status — OS #${statusModalOrder.orderNumber}` : "Mudar Status"}
        description="Selecione o novo status da ordem de serviço para avançar na linha de produção."
        size="md"
      >
        {statusModalOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F7F8F6] rounded-xl border border-[#E7EAE7] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#737D75]">Veículo:</span>{" "}
                <strong className="text-[#252B27]">{statusModalOrder.plate} — {statusModalOrder.model}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#737D75]">Atual:</span>
                <StatusBadge status={statusModalOrder.status} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: "TODO",
                  title: "Aguardando Início",
                  desc: "Veículo na fila aguardando operador",
                  icon: Clock,
                  bg: "hover:bg-[#F1F3F1]",
                  border: "border-[#E7EAE7]",
                  active: statusModalOrder.status === "TODO",
                },
                {
                  id: "IN_PROGRESS",
                  title: "Em Execução",
                  desc: "Serviço em andamento no box",
                  icon: Wrench,
                  bg: "hover:bg-[#EFF6FF]",
                  border: "border-[#BFDBFE]",
                  active: statusModalOrder.status === "IN_PROGRESS",
                },
                {
                  id: "DONE",
                  title: "Finalizado",
                  desc: "Pronto para entrega e vistoria final",
                  icon: CheckCircle2,
                  bg: "hover:bg-[#ECFDF5]",
                  border: "border-[#A7F3D0]",
                  active: statusModalOrder.status === "DONE",
                },
                {
                  id: "PAID",
                  title: "Pago & Entregue",
                  desc: "Baixa financeira e saída do pátio",
                  icon: Receipt,
                  bg: "hover:bg-[#FAF5FF]",
                  border: "border-[#E9D5FF]",
                  active: statusModalOrder.status === "PAID",
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    const targetOrder = statusModalOrder;
                    setStatusModalOrder(null);
                    if (st.id === "PAID") {
                      if (role === "ADMIN") {
                        setPaymentModalOrder(targetOrder);
                      } else {
                        alert("Apenas administradores podem registrar o pagamento e dar baixa na OS.");
                      }
                    } else {
                      updateOrderStatus(targetOrder.id, st.id as any);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    st.active
                      ? "bg-[#E9F3EC] border-[#247653] ring-2 ring-[#247653]/15 shadow-xs"
                      : `bg-white ${st.border} ${st.bg}`
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      st.active
                        ? "bg-[#247653] text-white"
                        : "bg-[#F1F3F1] text-[#737D75]"
                    }`}
                  >
                    <st.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`text-xs block font-bold leading-tight ${
                        st.active ? "text-[#142D26]" : "text-[#252B27]"
                      }`}
                    >
                      {st.title} {st.active && "(Atual)"}
                    </span>
                    <span className="text-[11px] text-[#737D75] mt-0.5 block leading-tight">
                      {st.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E7EAE7]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStatusModalOrder(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DE TRANSFERÊNCIA DE BOX */}
      {transferringOrder && (
        <TransferOrderBoxModal
          isOpen={!!transferringOrder}
          orderId={transferringOrder.id}
          orderNumber={transferringOrder.orderNumber}
          plate={transferringOrder.plate}
          model={transferringOrder.model}
          currentBox={transferringOrder.box}
          boxes={boxes}
          onClose={() => setTransferringOrder(null)}
          onTransferred={loadPatio}
        />
      )}

      {/* MODAL DE BAIXA DE PAGAMENTO */}
      <Modal
        isOpen={!!paymentModalOrder}
        onClose={() => setPaymentModalOrder(null)}
        title={paymentModalOrder ? `Registrar Pagamento — OS #${paymentModalOrder.orderNumber}` : "Registrar Pagamento"}
        description="Confirme a forma de pagamento recebida para encerrar e dar baixa na Ordem de Serviço."
        size="md"
      >
        {paymentModalOrder && (
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-3.5 bg-[#F7F8F6] rounded-xl border border-[#E7EAE7] space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#737D75]">Veículo:</span>
                <strong className="text-[#252B27]">
                  {paymentModalOrder.plate} — {paymentModalOrder.model}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737D75]">Cliente:</span>
                <strong className="text-[#252B27]">{paymentModalOrder.customerName}</strong>
              </div>
              <div className="pt-2.5 mt-2 border-t border-[#E7EAE7] flex items-center justify-between">
                <span className="text-[#737D75] font-medium">Total a Receber:</span>
                <span className="text-lg font-bold text-[#247653]">
                  {paymentModalOrder.totalAmount !== null
                    ? formatCurrency(paymentModalOrder.totalAmount)
                    : "-"}
                </span>
              </div>
            </div>

            <div>
              <label className="form-label">Forma de Pagamento Recebida *</label>
              <div className="grid grid-cols-2 gap-2.5 text-sm">
                {[
                  { id: "PIX", label: "PIX" },
                  { id: "CREDIT_CARD", label: "Cartão de Crédito" },
                  { id: "DEBIT_CARD", label: "Cartão de Débito" },
                  { id: "CASH", label: "Dinheiro em Espécie" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? "bg-[#E9F3EC] text-[#142D26] border-[#247653] font-semibold"
                        : "bg-white text-[#737D75] border-[#E7EAE7] hover:border-[#247653]/40"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7EAE7] flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPaymentModalOrder(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={submittingPayment}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirmar e Baixar OS
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Gestão/Adição de Serviços da OS */}
      {selectedOrderForServices && (
        <ManageOrderServicesModal
          isOpen={!!selectedOrderForServices}
          orderId={selectedOrderForServices.id}
          orderNumber={selectedOrderForServices.orderNumber}
          plate={selectedOrderForServices.plate}
          model={selectedOrderForServices.model}
          customerName={selectedOrderForServices.customerName}
          onClose={() => setSelectedOrderForServices(null)}
          onOrderUpdated={loadPatio}
        />
      )}
    </div>
  );
}
