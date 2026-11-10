"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  Fuel,
  Gauge,
  Plus,
  Search,
  AlertTriangle,
  Loader2,
  Share2,
  Eye,
  X,
  FileCheck,
  ClipboardList,
  User,
} from "lucide-react";
import { VehicleSilhouette360, DamagePin } from "@/components/modules/vehicle-silhouette-360";
import CustomerVehicleSelector from "@/components/modules/customer-vehicle-selector";
import { CustomerChecklistHistoryModal } from "@/components/modules/customer-checklist-history-modal";
import { formatDateTime } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  fuelLevel: number;
  valuablesLeft?: string;
  photosUrls?: string;
  customerConfirmed: boolean;
  confirmedAt?: string;
  notes?: string;
  createdAt: string;
  serviceOrder: {
    id: string;
    orderNumber: number;
    mileage?: number;
    status: string;
    vehicle: {
      id: string;
      plate: string;
      model: string;
      brand?: string;
      color?: string;
      category: string;
      customer?: {
        id?: string;
        name: string;
        phone?: string;
        whatsapp?: string;
      };
    };
    assignedUser?: {
      name: string;
    };
  };
  damageRecords: Array<{
    id: string;
    area: string;
    damageType: string;
    description?: string;
    photoUrl?: string;
    photos?: string[];
  }>;
}

interface PendingOrder {
  id: string;
  orderNumber: number;
  status: string;
  box?: string | null;
  mileage?: number | null;
  notes?: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    plate: string;
    brand?: string | null;
    model: string;
    category: string;
    color?: string | null;
    customer?: {
      name: string;
      whatsapp?: string | null;
      phone?: string | null;
    };
  };
  items: Array<{
    serviceName: string;
  }>;
}

export default function VistoriaPage() {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"ALL" | "BY_CUSTOMER">("ALL");
  const [historyModalCustomer, setHistoryModalCustomer] = useState<{
    id: string;
    name: string;
    phone?: string;
  } | null>(null);

  const [selectionMode, setSelectionMode] = useState<"TODO_OS" | "SEARCH_CUSTOMER">("TODO_OS");
  const [selectedServiceOrderId, setSelectedServiceOrderId] = useState<string | null>(null);
  const [selectedOrderSummary, setSelectedOrderSummary] = useState<PendingOrder | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [mileage, setMileage] = useState<number | "">("");
  const [fuelLevel, setFuelLevel] = useState(50);
  const [valuablesLeft, setValuablesLeft] = useState("");
  const [notes, setNotes] = useState("");
  const [customerConfirmed, setCustomerConfirmed] = useState(true);
  const [damages, setDamages] = useState<DamagePin[]>([]);

  async function loadData() {
    try {
      setLoading(true);
      const [resChecklists, resOrders] = await Promise.all([
        fetch("/api/checklists"),
        fetch("/api/orders?status=TODO"),
      ]);

      const jsonChecklists = await resChecklists.json();
      const jsonOrders = await resOrders.json();

      setChecklists(jsonChecklists.checklists || []);
      setPendingOrders(jsonOrders.orders || []);
    } catch (err) {
      console.error("Erro ao carregar vistorias:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function refreshPendingOrders() {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/orders?status=TODO");
      const json = await res.json();
      setPendingOrders(json.orders || []);
    } catch (err) {
      console.error("Erro ao atualizar ordens pendentes:", err);
    } finally {
      setLoadingOrders(false);
    }
  }

  function handleSelectPendingOrder(os: PendingOrder) {
    setSelectedServiceOrderId(os.id);
    setSelectedOrderSummary(os);
    setSelectedVehicleId(os.vehicle.id);
    if (os.mileage) {
      setMileage(os.mileage);
    }
    setError(null);
  }

  async function handleCreateChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicleId) {
      setError("Selecione o veículo para realizar a vistoria.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceOrderId: selectedServiceOrderId || null,
          vehicleId: selectedVehicleId,
          mileage: mileage ? Number(mileage) : null,
          fuelLevel,
          valuablesLeft: valuablesLeft || null,
          customerConfirmed,
          notes: notes || null,
          damages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar vistoria.");
      }

      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message || "Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSelectedServiceOrderId(null);
    setSelectedOrderSummary(null);
    setSelectedVehicleId("");
    setMileage("");
    setFuelLevel(50);
    setValuablesLeft("");
    setNotes("");
    setCustomerConfirmed(true);
    setDamages([]);
    setError(null);
    setSelectionMode("TODO_OS");
  }

  function sendWhatsAppChecklist(item: ChecklistItem) {
    const customer = item.serviceOrder.vehicle.customer;
    if (!customer) {
      alert("Veículo sem cliente cadastrado.");
      return;
    }
    const phone = customer.whatsapp || customer.phone;
    if (!phone) {
      alert("Cliente sem número de WhatsApp cadastrado.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const text = `Olá, *${customer.name}*!%0A%0ASeu veículo *${item.serviceOrder.vehicle.brand || ""} ${item.serviceOrder.vehicle.model}* (Placa: *${item.serviceOrder.vehicle.plate}*) deu entrada na nossa estética com sucesso!%0A%0A📋 *Comprovante de Vistoria de Entrada (Checklist)*:%0A- Quilometragem: ${item.serviceOrder.mileage ? item.serviceOrder.mileage + " km" : "Registrada"}%0A- Nível de Combustível: ${item.fuelLevel}%%0A- Avarias Mapeadas na Entrada: ${item.damageRecords.length} registro(s)%0A%0AQualquer dúvida estamos à disposição!`;

    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  }

  const filteredChecklists = useMemo(() => {
    if (!search.trim()) return checklists;
    const term = search.trim().toLowerCase();
    const cleanPlate = term.replace(/[^a-z0-9]/gi, "");
    return checklists.filter((chk) => {
      const vh = chk.serviceOrder.vehicle;
      const cust = vh.customer;
      return (
        (vh.plate && vh.plate.toLowerCase().includes(cleanPlate)) ||
        (vh.model && vh.model.toLowerCase().includes(term)) ||
        (cust?.name && cust.name.toLowerCase().includes(term)) ||
        (cust?.phone && cust.phone.includes(term)) ||
        (chk.serviceOrder.orderNumber && String(chk.serviceOrder.orderNumber).includes(term))
      );
    });
  }, [checklists, search]);

  const customerGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        customer: { id: string; name: string; phone?: string; whatsapp?: string };
        checklists: ChecklistItem[];
      }
    >();

    checklists.forEach((chk) => {
      const cust = chk.serviceOrder.vehicle.customer;
      const custId = cust?.id || cust?.name || "sem_cliente";
      if (!map.has(custId)) {
        map.set(custId, {
          customer: {
            id: custId,
            name: cust?.name || "Cliente Não Informado",
            phone: cust?.phone,
            whatsapp: cust?.whatsapp,
          },
          checklists: [],
        });
      }
      map.get(custId)!.checklists.push(chk);
    });

    const list = Array.from(map.values());
    if (!search.trim()) return list;

    const term = search.trim().toLowerCase();
    return list.filter((g) => {
      return (
        g.customer.name.toLowerCase().includes(term) ||
        (g.customer.phone && g.customer.phone.includes(term)) ||
        g.checklists.some(
          (c) =>
            c.serviceOrder.vehicle.plate.toLowerCase().includes(term.replace(/[^a-z0-9]/gi, "")) ||
            c.serviceOrder.vehicle.model.toLowerCase().includes(term)
        )
      );
    });
  }, [checklists, search]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white border border-[#E7EAE7] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#252B27]">
              Recepção e Vistoria Digital 360º
            </h1>
            <p className="text-xs text-[#737D75] mt-0.5">
              Checklist de entrada, registro de avarias e integração direta com o Pátio da Oficina
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            refreshPendingOrders();
            setModalOpen(true);
          }}
          className="dp-btn-primary text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Vistoria (Entrada)</span>
        </button>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-[#E7EAE7] flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#737D75] font-medium">Vistorias Realizadas</p>
            <p className="text-xl font-bold text-[#252B27] leading-tight">{checklists.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7EAE7] flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#737D75] font-medium">Avarias Mapeadas</p>
            <p className="text-xl font-bold text-[#252B27] leading-tight">
              {checklists.reduce((acc, c) => acc + c.damageRecords.length, 0)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7EAE7] flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#16A36A] flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-[#737D75] font-medium">OS Aguardando Vistoria</p>
            <p className="text-xl font-bold text-[#252B27] leading-tight">{pendingOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Busca e Alternância de Abas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
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
          <button
            onClick={() => setViewMode("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              viewMode === "ALL"
                ? "bg-[#247653] text-white shadow-xs"
                : "bg-white text-[#737D75] hover:bg-[#F7F8F6] hover:text-[#252B27] border border-[#E7EAE7]"
            }`}
          >
            Todas as Vistorias ({checklists.length})
          </button>

          <button
            onClick={() => setViewMode("BY_CUSTOMER")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "BY_CUSTOMER"
                ? "bg-[#247653] text-white shadow-xs"
                : "bg-white text-[#737D75] hover:bg-[#F7F8F6] hover:text-[#252B27] border border-[#E7EAE7]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Histórico por Cliente ({customerGroups.length})</span>
          </button>
        </div>
      </div>

      {/* Exibição Conforme Modo de Visualização */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#737D75] bg-white border border-[#E7EAE7] rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
          <p className="text-xs font-medium">Carregando vistorias do pátio...</p>
        </div>
      ) : viewMode === "BY_CUSTOMER" ? (
        customerGroups.length === 0 ? (
          <div className="p-12 text-center text-[#737D75] text-xs bg-white border border-[#E7EAE7] rounded-xl">
            Nenhum cliente com vistorias registradas para os filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerGroups.map((group, idx) => {
              const cust = group.customer;
              const totalDamages = group.checklists.reduce(
                (acc, c) => acc + c.damageRecords.length,
                0
              );
              const totalPhotos = group.checklists.reduce((acc, c) => {
                return (
                  acc +
                  c.damageRecords.reduce(
                    (dAcc, d) => dAcc + (d.photos?.length || (d.photoUrl ? 1 : 0)),
                    0
                  )
                );
              }, 0);
              const uniquePlates = Array.from(
                new Set(group.checklists.map((c) => c.serviceOrder.vehicle.plate))
              );

              return (
                <div
                  key={cust.id || idx}
                  className="p-4 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653]/50 transition-all space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-[#247653] uppercase tracking-wider font-bold block mb-0.5">
                        Cliente
                      </span>
                      <h3 className="text-sm font-bold text-[#252B27] truncate">{cust.name}</h3>
                      {cust.phone && (
                        <p className="text-xs text-[#737D75]">{cust.phone}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E9F3EC] text-[#142D26] text-[11px] font-bold shrink-0">
                      {group.checklists.length}{" "}
                      {group.checklists.length === 1 ? "vistoria" : "vistorias"}
                    </span>
                  </div>

                  {/* Veículos Vistoriados */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] text-[#737D75] font-medium">
                      Veículos Vistoriados:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {uniquePlates.map((plate) => (
                        <span
                          key={plate}
                          className="mercosul-plate text-xs font-bold inline-block"
                        >
                          {plate}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Métricas do Histórico do Cliente */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E7EAE7]">
                    <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7]">
                      <span className="text-[10px] text-[#737D75] block">Total Avarias</span>
                      <span className="font-bold text-[#DC4C4C]">{totalDamages} pontos</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7]">
                      <span className="text-[10px] text-[#737D75] block">Fotos Gravadas</span>
                      <span className="font-bold text-[#2563EB]">{totalPhotos} fotos</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryModalCustomer({
                          id: cust.id,
                          name: cust.name,
                          phone: cust.whatsapp || cust.phone,
                        })
                      }
                      className="dp-btn-secondary w-full text-xs cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-[#247653]" />
                      <span>Ver Histórico Individual</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredChecklists.length === 0 ? (
        <div className="p-12 text-center text-[#737D75] text-xs bg-white border border-[#E7EAE7] rounded-xl">
          Nenhuma vistoria de entrada encontrada para o filtro informado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChecklists.map((chk) => {
            const vh = chk.serviceOrder.vehicle;
            const cust = vh.customer;
            const photoCount = chk.damageRecords.reduce(
              (acc, d) => acc + (d.photos?.length || (d.photoUrl ? 1 : 0)),
              0
            );

            return (
              <div
                key={chk.id}
                className="p-4 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653]/50 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="mercosul-plate text-xs font-bold inline-block">
                      {vh.plate}
                    </span>
                    <span className="text-xs font-bold text-[#252B27] truncate max-w-[150px]">
                      {vh.brand ? `${vh.brand} ` : ""}
                      {vh.model}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#142D26] bg-[#E9F3EC] px-2.5 py-0.5 rounded-full">
                    OS #{chk.serviceOrder.orderNumber}
                  </span>
                </div>

                <div className="text-xs text-[#737D75] space-y-1">
                  <p>
                    Cliente:{" "}
                    {cust ? (
                      <button
                        type="button"
                        onClick={() =>
                          setHistoryModalCustomer({
                            id: cust.id || cust.name,
                            name: cust.name,
                            phone: cust.whatsapp || cust.phone,
                          })
                        }
                        className="text-[#247653] hover:underline font-bold text-left"
                        title="Clique para ver o histórico individual deste cliente"
                      >
                        {cust.name}
                      </button>
                    ) : (
                      <strong className="text-[#343C36]">Não informado</strong>
                    )}
                  </p>
                  <p className="text-[11px] text-[#737D75]">
                    Porte: {vh.category} {vh.color ? `• ${vh.color}` : ""}
                  </p>
                </div>

                {/* Resumo da Vistoria */}
                <div className="pt-2.5 border-t border-[#E7EAE7] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#343C36]">
                    <span className="flex items-center gap-1 text-xs text-[#737D75]">
                      <Fuel className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Combustível:</span>
                    </span>
                    <span className="font-bold text-[#252B27]">{chk.fuelLevel}%</span>
                  </div>

                  <div className="flex items-center justify-between text-[#343C36]">
                    <span className="flex items-center gap-1 text-xs text-[#737D75]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#DC4C4C]" />
                      <span>Avarias Registradas:</span>
                    </span>
                    <strong
                      className={chk.damageRecords.length > 0 ? "text-[#DC4C4C]" : "text-[#16A36A]"}
                    >
                      {chk.damageRecords.length} ponto(s)
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-[#343C36]">
                    <span className="flex items-center gap-1 text-xs text-[#737D75]">
                      <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Fotos Anexadas:</span>
                    </span>
                    <span className="font-bold text-[#2563EB]">{photoCount} foto(s)</span>
                  </div>

                  {chk.valuablesLeft && (
                    <div className="mt-1.5 p-2 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] text-[11px] text-[#343C36]">
                      <span className="text-[#737D75] font-semibold">Pertences: </span>
                      {chk.valuablesLeft}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E7EAE7] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#737D75]">{formatDateTime(chk.createdAt)}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => sendWhatsAppChecklist(chk)}
                      title="Enviar comprovante via WhatsApp"
                      className="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#16A36A] border border-[#A7F3D0] transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <Link
                      href={`/vistoria/${chk.id}`}
                      className="dp-btn-secondary py-1.5 px-2.5 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#247653]" />
                      <span>Ver</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE NOVA VISTORIA & CHECKLIST 360 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E7EAE7] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#247653]" />
                <span>Recepção de Veículo e Checklist 360º</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#737D75] hover:text-[#252B27] p-1 rounded-lg hover:bg-[#F7F8F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateChecklist} className="space-y-4">
              {/* ETAPA 1: SELEÇÃO DO VEÍCULO */}
              <div className="p-4 bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#E7EAE7]">
                  <label className="text-xs font-bold text-[#252B27]">
                    1. Identificação do Veículo para Entrada <span className="text-[#DC4C4C]">*</span>
                  </label>

                  <div className="inline-flex p-1 rounded-lg bg-white border border-[#E7EAE7] text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectionMode("TODO_OS")}
                      className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer text-xs font-semibold ${
                        selectionMode === "TODO_OS"
                          ? "bg-[#247653] text-white"
                          : "text-[#737D75] hover:text-[#252B27]"
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Puxar de OS em &ldquo;A Fazer&rdquo; ({pendingOrders.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectionMode("SEARCH_CUSTOMER")}
                      className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer text-xs font-semibold ${
                        selectionMode === "SEARCH_CUSTOMER"
                          ? "bg-[#247653] text-white"
                          : "text-[#737D75] hover:text-[#252B27]"
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Buscar Cliente / Veículo</span>
                    </button>
                  </div>
                </div>

                {/* MODO A: PUXAR DE OS EM A FAZER */}
                {selectionMode === "TODO_OS" && (
                  <div className="space-y-2">
                    {selectedOrderSummary ? (
                      <div className="p-3.5 rounded-xl bg-[#E9F3EC] border border-[#247653] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#247653] text-white flex flex-col items-center justify-center font-bold text-xs shrink-0">
                            <span>OS</span>
                            <span>#{selectedOrderSummary.orderNumber}</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="mercosul-plate text-xs font-bold">
                                {selectedOrderSummary.vehicle.plate}
                              </span>
                              <span className="font-bold text-[#252B27]">
                                {selectedOrderSummary.vehicle.brand
                                  ? `${selectedOrderSummary.vehicle.brand} `
                                  : ""}
                                {selectedOrderSummary.vehicle.model}
                              </span>
                              <span className="text-[11px] text-[#247653] font-semibold">
                                ({selectedOrderSummary.vehicle.category})
                              </span>
                            </div>
                            <div className="text-[#343C36] text-xs flex items-center gap-2">
                              <span>
                                Cliente:{" "}
                                <strong className="text-[#252B27]">
                                  {selectedOrderSummary.vehicle.customer?.name || "Não informado"}
                                </strong>
                              </span>
                              {selectedOrderSummary.vehicle.customer?.phone && (
                                <span>• Tel: {selectedOrderSummary.vehicle.customer.phone}</span>
                              )}
                              {selectedOrderSummary.box && (
                                <span className="text-[#16A36A] font-semibold">
                                  • Box: {selectedOrderSummary.box}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedServiceOrderId(null);
                            setSelectedOrderSummary(null);
                            setSelectedVehicleId("");
                          }}
                          className="dp-btn-secondary text-xs py-1.5 px-2.5 cursor-pointer shrink-0"
                        >
                          Trocar OS
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-[#737D75]">
                          Selecione abaixo uma Ordem de Serviço que já foi criada e está aguardando vistoria no Pátio:
                        </p>
                        {loadingOrders ? (
                          <div className="p-6 text-center text-[#737D75] text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#247653]" />
                            <span>Carregando ordens em aberto...</span>
                          </div>
                        ) : pendingOrders.length === 0 ? (
                          <div className="p-6 rounded-xl bg-white border border-dashed border-[#E7EAE7] text-center space-y-2">
                            <ClipboardList className="w-7 h-7 text-[#9CA49E] mx-auto" />
                            <p className="text-xs text-[#737D75]">
                              Nenhuma OS com status &ldquo;A Fazer&rdquo; no pátio no momento.
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectionMode("SEARCH_CUSTOMER")}
                              className="text-xs text-[#247653] hover:text-[#142D26] font-semibold cursor-pointer underline"
                            >
                              Buscar cliente existente ou cadastrar novo veículo &rarr;
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                            {pendingOrders.map((os) => (
                              <div
                                key={os.id}
                                onClick={() => handleSelectPendingOrder(os)}
                                className="p-3 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653] cursor-pointer transition text-xs space-y-1.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#247653] flex items-center gap-1">
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    <span>OS #{os.orderNumber}</span>
                                  </span>
                                  <span className="mercosul-plate text-xs font-bold">
                                    {os.vehicle.plate}
                                  </span>
                                </div>
                                <div className="font-semibold text-[#252B27] truncate">
                                  {os.vehicle.brand ? `${os.vehicle.brand} ` : ""}
                                  {os.vehicle.model}
                                </div>
                                <div className="text-[11px] text-[#737D75] flex items-center justify-between pt-1 border-t border-[#E7EAE7]">
                                  <span className="truncate max-w-[140px]">
                                    {os.vehicle.customer?.name || "Cliente avulso"}
                                  </span>
                                  {os.box && (
                                    <span className="text-[#16A36A] font-semibold text-[11px]">
                                      {os.box}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MODO B: BUSCA POR NOME, CPF OU TELEFONE */}
                {selectionMode === "SEARCH_CUSTOMER" && (
                  <div className="space-y-2">
                    <CustomerVehicleSelector
                      selectedVehicleId={selectedVehicleId}
                      onSelectVehicle={(vehId) => {
                        setSelectedVehicleId(vehId);
                        setSelectedServiceOrderId(null);
                        setSelectedOrderSummary(null);
                        setError(null);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ETAPA 2: PARÂMETROS DE ENTRADA (KM, COMBUSTÍVEL, PERTENCES) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Quilometragem (KM)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 45200"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value ? Number(e.target.value) : "")}
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Combustível</span>
                    </span>
                    <span className="text-[#D97706] font-bold">{fuelLevel}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(Number(e.target.value))}
                    className="w-full h-2 bg-[#E7EAE7] rounded-lg appearance-none cursor-pointer accent-[#247653] mt-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Pertences / Objetos de Valor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Óculos no porta-luvas"
                    value={valuablesLeft}
                    onChange={(e) => setValuablesLeft(e.target.value)}
                    className="dp-input"
                  />
                </div>
              </div>

              {/* ETAPA 3: SILHUETA VEICULAR 360 & AVARIAS */}
              <div className="pt-2">
                <VehicleSilhouette360 damages={damages} onChange={setDamages} />
              </div>

              {/* ETAPA 4: OBSERVAÇÕES & CONFIRMAÇÃO DO CLIENTE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E7EAE7]">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Observações Adicionais de Entrada
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Cliente solicitou não aspirar o porta-malas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="dp-input"
                  />
                </div>

                <div className="flex flex-col justify-center space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#252B27] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerConfirmed}
                      onChange={(e) => setCustomerConfirmed(e.target.checked)}
                      className="rounded accent-[#247653] w-4 h-4"
                    />
                    <span>Cliente presenciou e validou o checklist de avarias</span>
                  </label>
                  <p className="text-xs text-[#737D75]">
                    O aceite registra o carimbo de data, horário e responsável pela vistoria no pátio.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7EAE7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="dp-btn-secondary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="dp-btn-primary text-xs cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Concluir Vistoria e Entrada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO INDIVIDUAL DE VISTORIAS DO CLIENTE */}
      {historyModalCustomer && (
        <CustomerChecklistHistoryModal
          isOpen={!!historyModalCustomer}
          customerId={historyModalCustomer.id}
          customerName={historyModalCustomer.name}
          customerPhone={historyModalCustomer.phone}
          onClose={() => setHistoryModalCustomer(null)}
        />
      )}
    </div>
  );
}
