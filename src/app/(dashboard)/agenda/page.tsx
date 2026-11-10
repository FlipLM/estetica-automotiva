"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Car,
  User,
  Wrench,
  MapPin,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  OrderStatusBadge,
  Tabs,
  Modal,
  Input,
  Select,
  Textarea,
  Alert,
  EmptyState,
  LoadingState,
} from "@/components/ui";
import CustomerVehicleSelector, {
  VehicleItem,
} from "@/components/modules/customer-vehicle-selector";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  id: string;
  orderNumber: number;
  status: string;
  box: string | null;
  scheduledFor: string | null;
  createdAt: string;
  totalAmount: number | null;
  notes: string | null;
  vehicle: {
    id: string;
    plate: string;
    brand?: string | null;
    model: string;
    category: string;
    customer?: {
      name: string;
      phone?: string | null;
      whatsapp?: string | null;
    } | null;
  };
  items: Array<{
    id: string;
    serviceName: string;
  }>;
  assignedUser?: {
    id: string;
    name: string;
  } | null;
}

export default function AgendaPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Modal de Novo Agendamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedVehicleObj, setSelectedVehicleObj] = useState<VehicleItem | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBox, setSelectedBox] = useState("");
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadAgendaData() {
    try {
      setLoading(true);
      const [resOrders, resServices, resBoxes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/services"),
        fetch("/api/boxes"),
      ]);
      const jsonOrders = await resOrders.json();
      const jsonServices = await resServices.json();
      const jsonBoxes = await resBoxes.json();

      setOrders(jsonOrders.orders || []);
      setServicesCatalog(jsonServices.services || []);
      const loadedBoxes = jsonBoxes.boxes || [];
      setBoxes(loadedBoxes);
      if (loadedBoxes.length > 0 && !selectedBox) {
        const firstFree = loadedBoxes.find((b: any) => !b.isFull) || loadedBoxes[0];
        setSelectedBox(firstFree.name);
      }
    } catch (err) {
      console.error("Erro ao carregar agenda:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgendaData();
  }, []);

  function navigateDate(delta: number) {
    const next = new Date(selectedDate);
    if (viewMode === "day") {
      next.setDate(next.getDate() + delta);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + delta * 7);
    } else {
      next.setMonth(next.getMonth() + delta);
    }
    setSelectedDate(next);
  }

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Filtra os agendamentos de acordo com a visualização (Dia, Semana, Mês)
  const filteredOrders = orders.filter((o) => {
    const refDateStr = o.scheduledFor || o.createdAt;
    if (!refDateStr) return false;
    const d = new Date(refDateStr);

    if (viewMode === "day") {
      return isSameDay(d, selectedDate);
    }
    if (viewMode === "week") {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return d >= startOfWeek && d <= endOfWeek;
    }
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth()
    );
  });

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedVehicleId) {
      setError("Selecione o cliente e o veículo para o agendamento.");
      return;
    }
    if (!selectedServiceId) {
      setError("Selecione o serviço principal que será executado.");
      return;
    }

    setSaving(true);
    try {
      const scheduledIso = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          status: "TODO",
          box: selectedBox || "Box 01 - Lavagem Técnica",
          scheduledFor: scheduledIso,
          notes,
          items: [{ serviceId: selectedServiceId, quantity: 1 }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível registrar o agendamento.");
        return;
      }

      setFeedback("Agendamento criado com sucesso!");
      setIsModalOpen(false);
      setSelectedVehicleId("");
      setSelectedVehicleObj(null);
      setSelectedServiceId("");
      setNotes("");
      await loadAgendaData();
    } catch {
      setError("Erro de conexão ao salvar agendamento.");
    } finally {
      setSaving(false);
    }
  }

  const formattedHeaderDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: viewMode === "day" ? "long" : undefined,
    day: viewMode !== "month" ? "2-digit" : undefined,
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  const timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Principal", href: "/dashboard" },
          { label: "Agenda de Serviços" },
        ]}
        title="Agenda de Atendimentos"
        description="Planejamento diário, semanal e mensal de serviços, boxes e entregas."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setError(null);
              setIsModalOpen(true);
            }}
          >
            Novo Agendamento
          </Button>
        }
      />

      {feedback && (
        <Alert
          variant="success"
          onDismiss={() => setFeedback(null)}
        >
          {feedback}
        </Alert>
      )}

      {/* Barra de Controle do Calendário */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate(-1)}
              aria-label="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate(1)}
              aria-label="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="ml-2 text-[15px] font-semibold text-[#252B27] capitalize">
              {formattedHeaderDate}
            </span>
          </div>

          <Tabs
            tabs={[
              { id: "day", label: "Dia" },
              { id: "week", label: "Semana" },
              { id: "month", label: "Mês", count: filteredOrders.length },
            ]}
            activeTab={viewMode}
            onChange={(id) => setViewMode(id as any)}
          />
        </div>
      </Card>

      {loading ? (
        <LoadingState message="Carregando compromissos da agenda..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="w-6 h-6" />}
          title="Nenhum agendamento para este período"
          description="Você pode agendar um novo atendimento clicando no botão abaixo ou alterar a visualização para Semana ou Mês."
          action={
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setViewMode("month")}
              >
                Ver Mês Inteiro
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Agendar Serviço
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista Principal de Compromissos */}
          <div className="lg:col-span-2 space-y-3">
            {filteredOrders.map((os) => {
              const refDate = new Date(os.scheduledFor || os.createdAt);
              const hourStr = refDate.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const dateStr = refDate.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              });

              return (
                <Card key={os.id} className="hover:border-[#D5DBD5]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Bloco de Horário */}
                      <div className="px-3 py-2 rounded-[10px] bg-[#E9F3EC] text-[#142D26] text-center min-w-[74px] shrink-0">
                        <span className="text-[15px] font-bold block leading-tight">
                          {hourStr}
                        </span>
                        <span className="text-[11px] font-medium text-[#247653]">
                          {dateStr}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="mercosul-plate text-xs">
                            {os.vehicle?.plate}
                          </span>
                          <span className="text-[15px] font-semibold text-[#252B27]">
                            {os.vehicle?.brand || ""} {os.vehicle?.model}
                          </span>
                          <OrderStatusBadge status={os.status} />
                        </div>

                        <p className="text-[13px] font-medium text-[#247653] flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>
                            {os.items?.map((i) => i.serviceName).join(", ") ||
                              "Serviço Agendado"}
                          </span>
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#737D75] pt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {os.vehicle?.customer?.name || "Cliente"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#247653]" />
                            {os.box || "Pátio Geral"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F1F3F1]">
                      {os.totalAmount !== null && (
                        <span className="text-[15px] font-bold text-[#252B27]">
                          {formatCurrency(os.totalAmount)}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Link href={`/os/${os.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                          >
                            Ver OS #{os.orderNumber}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Coluna Lateral: Grade de Horários e Disponibilidade de Boxes */}
          <div className="space-y-4">
            <Card>
              <h3 className="text-[15px] font-semibold text-[#252B27] mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#247653]" />
                <span>Horários de Funcionamento</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setScheduleTime(slot);
                      setIsModalOpen(true);
                    }}
                    className="py-2 px-3 rounded-[8px] border border-[#E7EAE7] bg-[#F7F8F6] hover:bg-[#E9F3EC] hover:border-[#247653] text-[13px] font-medium text-[#252B27] transition-all cursor-pointer text-center"
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-[#737D75] mt-3">
                Clique em um horário acima para agendar diretamente na faixa escolhida.
              </p>
            </Card>

            <Card>
              <h3 className="text-[15px] font-semibold text-[#252B27] mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#247653]" />
                <span>Disponibilidade dos Boxes</span>
              </h3>
              <div className="space-y-2.5">
                {boxes.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-[8px] border border-[#E7EAE7] bg-[#F7F8F6] flex items-center justify-between text-[13px]"
                  >
                    <span className="font-medium text-[#252B27] truncate">
                      {b.name}
                    </span>
                    <Badge
                      variant={b.isFull ? "error" : "success"}
                      size="sm"
                    >
                      {b.occupiedCount}/{b.capacity} vagas
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Criação de Agendamento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Agendamento de Serviço"
        description="Escolha o cliente, veículo, horário e box para reservar o atendimento."
        size="lg"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <CustomerVehicleSelector
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={(vId, vObj) => {
              setSelectedVehicleId(vId);
              setSelectedVehicleObj(vObj);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data do Agendamento"
              type="date"
              required
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
            <Input
              label="Horário Previsto"
              type="time"
              required
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Serviço Principal"
              required
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              <option value="">Selecione um serviço do catálogo...</option>
              {servicesCatalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </Select>

            <Select
              label="Box / Estação de Trabalho"
              required
              value={selectedBox}
              onChange={(e) => setSelectedBox(e.target.value)}
            >
              {boxes.map((b) => (
                <option key={b.id} value={b.name} disabled={b.isFull}>
                  {b.name} ({b.occupiedCount}/{b.capacity} vagas
                  {b.isFull ? " - Lotado" : ""})
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Observações do Agendamento (opcional)"
            placeholder="Ex: Cliente solicitou entrega até as 17h..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-4 border-t border-[#E7EAE7] flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={saving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
