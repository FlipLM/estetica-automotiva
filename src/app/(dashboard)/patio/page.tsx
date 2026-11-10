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
  Loader2,
  ArrowRight,
  DollarSign,
  X,
  CreditCard,
  Gauge,
  AlertTriangle,
  Kanban,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Droplets,
  HelpCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ManageOrderServicesModal } from "@/components/modules/manage-order-services-modal";
import { TransferOrderBoxModal } from "@/components/modules/transfer-order-box-modal";

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
    color: string;
    badgeColor: string;
  }> = [
    {
      id: "TODO",
      title: "1. Para Fazer",
      description: "Aguardando início",
      icon: Clock,
      color: "text-amber-400",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "IN_PROGRESS",
      title: "2. Em Serviço",
      description: "Lavagem / Detailing",
      icon: Wrench,
      color: "text-blue-400",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "DONE",
      title: "3. Concluídos",
      description: "Aguardando retirada",
      icon: CheckCircle2,
      color: "text-emerald-400",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "PAID",
      title: "4. Pagos / Baixados",
      description: "Atendimento encerrado",
      icon: Receipt,
      color: "text-purple-400",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded carbon-card border-carbon-700 bg-carbon-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-carbon-800 border border-carbon-700 flex items-center justify-center text-lime-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-display font-extrabold tracking-wide text-white uppercase flex items-center gap-2">
              <span>Pátio Operacional // Telemetria em Tempo Real</span>
              <span className="led-pulse-lime" />
            </h1>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              GESTÃO DE ESTAÇÕES FÍSICAS, VAGAS DE BOXES E FLUXO KANBAN
            </p>
          </div>
        </div>

        {/* Alternador de Modo de Visão e Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <div className="flex items-center bg-carbon-950 p-1 rounded-lg border border-carbon-700 text-xs">
            <button
              onClick={() => setViewMode("STATUS")}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all font-bold cursor-pointer ${
                viewMode === "STATUS"
                  ? "bg-lime-400 text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>VISÃO POR STATUS</span>
            </button>
            <button
              onClick={() => setViewMode("BOXES")}
              className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-all font-bold cursor-pointer ${
                viewMode === "BOXES"
                  ? "bg-lime-400 text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>VISÃO POR BOX & VAGAS</span>
              {boxes.some((b) => b.isFull) && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
              )}
            </button>
          </div>

          <Link
            href="/os/nova"
            className="btn-engine-start px-3.5 py-2 rounded text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>NOVA OS</span>
          </Link>

          <button
            onClick={loadPatio}
            disabled={loading}
            className="p-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 border border-carbon-600 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Atualizar dados do pátio"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-lime-400 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline font-bold">ATUALIZAR</span>
          </button>
        </div>
      </div>

      {/* PAINEL DE TELEMETRIA DE BOXES & VAGAS EM TEMPO REAL */}
      {boxes.length > 0 && (
        <div className="p-3.5 rounded carbon-card border-carbon-700 bg-carbon-900/60 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5 pb-2 border-b border-carbon-800">
            <div className="flex items-center gap-2 text-xs">
              <Gauge className="w-4 h-4 text-lime-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Ocupação dos Boxes & Baias da Oficina
              </span>
              <span className="text-[10px] text-slate-500">
                ({boxes.filter((b) => b.isFull).length}/{boxes.length} lotados —{" "}
                {boxes.reduce((acc, b) => acc + (b.occupiedCount || 0), 0)}/
                {boxes.reduce((acc, b) => acc + b.capacity, 0)} vagas preenchidas)
              </span>
            </div>
            <Link
              href="/boxes"
              className="text-[11px] text-slate-400 hover:text-lime-400 transition-colors flex items-center gap-1"
            >
              <span>Gerenciar Configuração de Boxes</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {boxes.map((b) => (
              <div
                key={b.id}
                onClick={() => setViewMode("BOXES")}
                className={`p-2 rounded border transition-all cursor-pointer ${
                  b.isFull
                    ? "bg-rose-950/20 border-rose-500/40 text-rose-300 hover:border-rose-400"
                    : b.occupiedCount > 0
                    ? "bg-carbon-950 border-amber-500/30 text-amber-300 hover:border-amber-400"
                    : "bg-carbon-950 border-carbon-700/60 text-slate-400 hover:border-lime-400/50"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-[11px] truncate uppercase">{b.name}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      b.isFull
                        ? "bg-rose-400 animate-pulse"
                        : b.occupiedCount > 0
                        ? "bg-amber-400"
                        : "bg-lime-400"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span>Vagas:</span>
                  <span className="font-bold font-mono">
                    {b.occupiedCount}/{b.capacity}
                  </span>
                </div>

                {/* Barra de Ocupação */}
                <div className="w-full bg-carbon-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      b.isFull
                        ? "bg-rose-500"
                        : b.occupiedCount > 0
                        ? "bg-amber-400"
                        : "bg-lime-400"
                    }`}
                    style={{
                      width: `${Math.min(100, (b.occupiedCount / Math.max(1, b.capacity)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-1 text-[9px] text-right font-bold">
                  {b.isFull ? (
                    <span className="text-rose-400">LOTADO</span>
                  ) : (
                    <span className="text-slate-500">{b.availableSlots} livre(s)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-80 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
          <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
          <p className="text-xs uppercase tracking-wider">SINCRONIZANDO TELEMETRIA DO PÁTIO...</p>
        </div>
      ) : viewMode === "STATUS" ? (
        /* ========================================================================= */
        /* MODO 1: KANBAN CLÁSSICO POR STATUS                                       */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropStatus(e, col.id)}
                className="bg-carbon-900/60 border border-carbon-700/80 rounded-lg p-3 flex flex-col min-h-[520px] transition-colors"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-carbon-800">
                  <div className="flex items-center gap-2">
                    <col.icon className={`w-4 h-4 ${col.color}`} />
                    <div>
                      <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wide leading-tight">
                        {col.title}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono">{col.description}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${col.badgeColor}`}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {/* Lista de Cards Arrastáveis */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border border-dashed border-slate-800/80 rounded-lg text-slate-500 text-[11px] font-mono">
                      Solte um carro aqui
                    </div>
                  ) : (
                    colOrders.map((os) => (
                      <div
                        key={os.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, os.id)}
                        className="p-3.5 rounded carbon-card hover:border-lime-400/50 shadow-lg transition-all text-xs space-y-2.5 cursor-grab active:cursor-grabbing group bg-carbon-855"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[9px] text-slate-500 block leading-tight font-bold">
                              OS <span className="text-lime-400">#{os.orderNumber}</span>
                            </span>
                            <div className="mt-1">
                              <span className="mercosul-plate text-xs font-mono font-bold">
                                {os.plate}
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-carbon-900 text-slate-300 border border-carbon-700 uppercase">
                            {os.category}
                          </span>
                        </div>

                        <div>
                          <p className="text-white font-bold text-xs">{os.model}</p>
                          <p className="text-[11px] text-lime-400 font-medium font-mono">
                            {os.mainService}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-carbon-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[90px]">{os.customerName}</span>
                          </div>

                          {/* Tag de Box com Ação Rápida de Transferência */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransferringOrder(os);
                            }}
                            className="flex items-center gap-1 font-bold text-slate-300 hover:text-lime-400 px-1.5 py-0.5 rounded bg-carbon-900 hover:bg-carbon-800 border border-carbon-700 transition cursor-pointer"
                            title="Clique para transferir para outro box"
                          >
                            <MapPin className="w-3 h-3 text-lime-400" />
                            <span>{os.box || "Pátio"}</span>
                            <ArrowRightLeft className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                          </button>
                        </div>

                        {role === "ADMIN" && os.totalAmount !== null && (
                          <div className="flex items-center justify-between text-[11px] pt-1 font-mono">
                            <span className="text-slate-500">Total:</span>
                            <span className="font-bold text-lime-400">
                              {formatCurrency(os.totalAmount)}
                            </span>
                          </div>
                        )}

                        {/* Botões Rápidos de Ação de 1 Toque */}
                        <div className="pt-2 border-t border-carbon-700/80 space-y-1.5 text-[11px] font-mono">
                          {os.status !== "PAID" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderForServices(os);
                              }}
                              className="w-full py-1.5 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 hover:text-white border border-carbon-600 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
                              title="Adicionar novos serviços solicitados pelo cliente"
                            >
                              <Plus className="w-3 h-3 text-lime-400 stroke-[3]" />
                              <span>+ Adicionar Serviço</span>
                            </button>
                          )}

                          {os.status === "TODO" && (
                            <button
                              onClick={() => updateOrderStatus(os.id, "IN_PROGRESS")}
                              className="w-full py-1.5 rounded bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-black border border-lime-400/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer uppercase"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Iniciar Serviço</span>
                            </button>
                          )}

                          {os.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => updateOrderStatus(os.id, "DONE")}
                              className="w-full py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer uppercase"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Finalizar Serviço</span>
                            </button>
                          )}

                          {os.status === "DONE" && (
                            <button
                              onClick={() => {
                                if (role === "ADMIN") {
                                  setPaymentModalOrder(os);
                                } else {
                                  alert(
                                    "Apenas administradores podem registrar a baixa de pagamento da OS."
                                  );
                                }
                              }}
                              className="w-full py-1.5 rounded bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-black border border-blue-500/40 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer uppercase"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Registrar Pagamento</span>
                            </button>
                          )}

                          {os.status === "PAID" && (
                            <div className="w-full py-1 rounded bg-carbon-900 border border-carbon-700 text-slate-500 text-[10px] text-center font-bold">
                              BAIXADO // CONCLUÍDO
                            </div>
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
        /* ========================================================================= */
        /* MODO 2: VISÃO POR ESTAÇÃO FÍSICA // BOXES E VAGAS DA OFICINA              */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="p-3 bg-carbon-900/40 border border-carbon-800 rounded-lg flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-lime-400" />
              <span>
                <strong>Mapa de Estações:</strong> Arraste qualquer veículo entre os boxes para
                transferir de estação de trabalho. Vagas demarcadas respeitam os limites físicos de cada box.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {boxes.map((b) => {
              const Icon = BOX_ICONS[b.type || "GERAL"] || Layers;
              // Veículos ativos atribuídos a este box
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
                  className={`rounded-lg p-3.5 border transition-all flex flex-col min-h-[460px] ${
                    b.isFull
                      ? "bg-carbon-900/90 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                      : "bg-carbon-900/60 border-carbon-700/80 hover:border-carbon-600"
                  }`}
                >
                  {/* Header do Box */}
                  <div className="pb-3 mb-3 border-b border-carbon-800">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: b.color || "#a3e635" }}
                        />
                        <Icon className="w-4 h-4 text-slate-300 shrink-0" />
                        <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wide truncate">
                          {b.name}
                        </h2>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                          b.isFull
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                            : boxOrders.length > 0
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-lime-500/10 text-lime-400 border-lime-500/30"
                        }`}
                      >
                        {boxOrders.length}/{b.capacity} {b.capacity === 1 ? "VAGA" : "VAGAS"}
                      </span>
                    </div>

                    {b.description && (
                      <p className="text-[10px] text-slate-500 font-mono mt-1 line-clamp-1">
                        {b.description}
                      </p>
                    )}

                    {/* Barra de Lotação Visual */}
                    <div className="w-full bg-carbon-950 h-1.5 rounded-full mt-2.5 overflow-hidden border border-carbon-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          b.isFull
                            ? "bg-rose-500"
                            : boxOrders.length > 0
                            ? "bg-amber-400"
                            : "bg-lime-400"
                        }`}
                        style={{
                          width: `${Math.min(100, (boxOrders.length / Math.max(1, b.capacity)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Vagas e Veículos Dentro do Box */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {/* 1. Veículos Ocupando Vagas */}
                    {boxOrders.map((os) => {
                      const statusCol = columns.find((c) => c.id === os.status);
                      return (
                        <div
                          key={os.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, os.id)}
                          className="p-3 rounded-lg carbon-card border-carbon-700 hover:border-lime-400/50 shadow-md transition-all text-xs space-y-2.5 cursor-grab active:cursor-grabbing bg-carbon-850"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] text-slate-500 font-bold">
                                  OS #{os.orderNumber}
                                </span>
                                {statusCol && (
                                  <span
                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusCol.badgeColor}`}
                                  >
                                    {statusCol.title.replace(/^[0-9]\.\s*/, "")}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1">
                                <span className="mercosul-plate text-xs font-mono font-bold">
                                  {os.plate}
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-carbon-900 text-slate-300 border border-carbon-700 uppercase">
                              {os.category}
                            </span>
                          </div>

                          <div>
                            <p className="text-white font-bold text-xs">{os.model}</p>
                            <p className="text-[11px] text-lime-400 font-medium font-mono">
                              {os.mainService}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-carbon-700/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <div className="flex items-center gap-1 min-w-0">
                              <User className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[100px]">{os.customerName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransferringOrder(os);
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-lime-400 flex items-center gap-1 bg-carbon-900 px-1.5 py-0.5 rounded border border-carbon-700 transition cursor-pointer"
                              title="Transferir para outro box"
                            >
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              <span>Mover</span>
                            </button>
                          </div>

                          {/* Ações Rápidas no Box */}
                          <div className="pt-2 border-t border-carbon-700/80 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                            {os.status === "TODO" && (
                              <button
                                onClick={() => updateOrderStatus(os.id, "IN_PROGRESS")}
                                className="py-1 rounded bg-lime-400/10 hover:bg-lime-400 text-lime-400 hover:text-black border border-lime-400/30 font-bold flex items-center justify-center gap-1 transition-all cursor-pointer uppercase col-span-2"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>Iniciar</span>
                              </button>
                            )}

                            {os.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => updateOrderStatus(os.id, "DONE")}
                                className="py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 font-bold flex items-center justify-center gap-1 transition-all cursor-pointer uppercase col-span-2"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Concluir</span>
                              </button>
                            )}

                            {os.status === "DONE" && (
                              <button
                                onClick={() => {
                                  if (role === "ADMIN") {
                                    setPaymentModalOrder(os);
                                  } else {
                                    alert("Apenas administradores podem registrar a baixa da OS.");
                                  }
                                }}
                                className="py-1 rounded bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-black border border-blue-500/40 font-bold flex items-center justify-center gap-1 transition-all cursor-pointer uppercase col-span-2"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Baixar / Entregar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* 2. Vagas Livres Demarcadas (Slots Vazios) */}
                    {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => (
                      <div
                        key={`empty-slot-${b.id}-${slotIdx}`}
                        className="border border-dashed border-carbon-700/80 rounded-lg p-4 text-center flex flex-col items-center justify-center min-h-[100px] bg-carbon-950/30 text-slate-500 font-mono transition-colors hover:border-lime-400/40"
                      >
                        <Car className="w-5 h-5 text-slate-600 mb-1" />
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                          Vaga {boxOrders.length + slotIdx + 1} de {b.capacity} Livre
                        </span>
                        <span className="text-[9px] text-slate-600 mt-0.5">
                          Arraste um veículo para ocupar esta vaga
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rodapé do Box com Status */}
                  <div className="pt-2.5 mt-2.5 border-t border-carbon-800 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">{b.type || "GERAL"}</span>
                    {b.isFull ? (
                      <span className="text-rose-400 font-bold">CAPACIDADE MÁXIMA</span>
                    ) : (
                      <span className="text-lime-400 font-bold">{emptySlotsCount} vaga(s) livre(s)</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Coluna Especial: Pátio Geral & Espera (para veículos sem box definido) */}
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
                  className="rounded-lg p-3.5 border border-dashed border-carbon-700/80 bg-carbon-950/40 flex flex-col min-h-[460px]"
                >
                  <div className="pb-3 mb-3 border-b border-carbon-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <h2 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wide">
                          Pátio Externo & Espera
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-carbon-900 text-slate-400 border border-carbon-800">
                        {unassignedOrders.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Veículos aguardando alocação em um box específico
                    </p>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {unassignedOrders.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center border border-dashed border-carbon-800 rounded-lg text-slate-600 font-mono text-[11px] text-center p-4">
                        <CheckCircle2 className="w-6 h-6 text-slate-700 mb-1" />
                        <span>Nenhum veículo sem box.</span>
                        <span className="text-[9px] text-slate-700 mt-0.5">
                          Todos os carros do pátio estão devidamente alocados em boxes.
                        </span>
                      </div>
                    ) : (
                      unassignedOrders.map((os) => (
                        <div
                          key={os.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, os.id)}
                          className="p-3 rounded-lg carbon-card border-carbon-700 hover:border-lime-400/50 shadow-md text-xs space-y-2 cursor-grab active:cursor-grabbing bg-carbon-850"
                        >
                          <div className="flex items-start justify-between">
                            <span className="mercosul-plate text-xs font-mono font-bold">
                              {os.plate}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-carbon-900 text-slate-300 border border-carbon-700 uppercase">
                              {os.category}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs">{os.model}</p>
                            <p className="text-[11px] text-lime-400 font-mono">{os.mainService}</p>
                          </div>
                          <div className="pt-2 border-t border-carbon-700/80 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Local: {os.box || "Geral"}</span>
                            <button
                              type="button"
                              onClick={() => setTransferringOrder(os)}
                              className="text-[10px] font-bold text-lime-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-2.5 h-2.5" />
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
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="carbon-card w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 bg-carbon-900 border-carbon-700">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <h2 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                <Receipt className="w-4 h-4 text-lime-400" />
                <span>Confirmar Pagamento // OS #{paymentModalOrder.orderNumber}</span>
              </h2>
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-carbon-950 rounded border border-carbon-800 space-y-1 font-mono text-xs">
              <p className="text-slate-300">
                Veículo: <strong className="text-white">{paymentModalOrder.plate} — {paymentModalOrder.model}</strong>
              </p>
              <p className="text-slate-300">
                Cliente: <strong className="text-white">{paymentModalOrder.customerName}</strong>
              </p>
              <div className="pt-2 flex items-center justify-between text-sm border-t border-carbon-800">
                <span className="text-slate-400">Total a Quitar:</span>
                <span className="text-base font-bold text-lime-400">
                  {paymentModalOrder.totalAmount !== null ? formatCurrency(paymentModalOrder.totalAmount) : "-"}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4 font-mono">
              <div>
                <label className="form-label-carbon">
                  Forma de Pagamento Recebida *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
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
                      className={`p-2.5 rounded border text-left font-bold transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? "bg-lime-400/20 text-lime-400 border-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.15)]"
                          : "bg-carbon-950 text-slate-400 border-carbon-700 hover:border-carbon-600"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-carbon-700 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="btn-engine-start px-5 py-2 rounded flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submittingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar & Baixar OS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
