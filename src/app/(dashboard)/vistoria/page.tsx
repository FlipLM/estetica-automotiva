"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  Car,
  Fuel,
  Gauge,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Share2,
  Eye,
  X,
  FileCheck,
  ClipboardList,
  Check,
  ArrowRight,
  User,
  Users,
  Layers,
  Sparkles,
} from "lucide-react";
import { VehicleSilhouette360, DamagePin } from "@/components/modules/vehicle-silhouette-360";
import CustomerVehicleSelector, {
  VehicleItem,
  CustomerItem,
} from "@/components/modules/customer-vehicle-selector";
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

  // Filtros & Visualização Individual por Cliente
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"ALL" | "BY_CUSTOMER">("ALL");
  const [historyModalCustomer, setHistoryModalCustomer] = useState<{
    id: string;
    name: string;
    phone?: string;
  } | null>(null);

  // Form State
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

  // Filtragem de Vistorias por termo de busca
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

  // Agrupamento de Vistorias por Cliente para Histórico Individual
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="led-pulse-lime"></span>
            <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
              // CHECKLIST & RECEPÇÃO
            </span>
          </div>
          <h1 className="text-xl font-black tracking-wide text-white uppercase flex items-center gap-2 font-mono">
            <Camera className="w-5 h-5 text-lime-400" />
            <span>Recepção & Vistoria Digital 360º</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Checklist de entrada, registro de avarias e integração direta com o Pátio da Oficina
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            refreshPendingOrders();
            setModalOpen(true);
          }}
          className="btn-engine-start px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Vistoria (Entrada)</span>
        </button>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Vistorias Realizadas</p>
            <p className="text-lg font-bold text-white leading-tight">{checklists.length}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Avarias Mapeadas</p>
            <p className="text-lg font-bold text-white leading-tight">
              {checklists.reduce((acc, c) => acc + c.damageRecords.length, 0)}
            </p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">OS Aguardando Vistoria</p>
            <p className="text-lg font-bold text-white leading-tight">{pendingOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Busca e Alternância de Abas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
        <div className="relative flex-1 max-w-md">
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
          <button
            onClick={() => setViewMode("ALL")}
            className={`px-3 py-1.5 rounded text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${viewMode === "ALL"
                ? "bg-lime-400 text-black shadow-sm font-extrabold"
                : "bg-carbon-900 text-slate-400 hover:bg-carbon-800 hover:text-white border border-carbon-700"
              }`}
          >
            TODAS AS VISTORIAS ({checklists.length})
          </button>

          <button
            onClick={() => setViewMode("BY_CUSTOMER")}
            className={`px-3 py-1.5 rounded text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${viewMode === "BY_CUSTOMER"
                ? "bg-lime-400 text-black shadow-sm font-extrabold"
                : "bg-carbon-900 text-slate-400 hover:bg-carbon-800 hover:text-white border border-carbon-700"
              }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>HISTÓRICO POR CLIENTE ({customerGroups.length})</span>
          </button>
        </div>
      </div>

      {/* Exibição Conforme Modo de Visualização */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 bg-carbon-900 border border-carbon-700 rounded-xl font-mono">
          <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
          <p className="text-xs uppercase tracking-wider">CARREGANDO VISTORIAS DO PÁTIO...</p>
        </div>
      ) : viewMode === "BY_CUSTOMER" ? (
        /* MODO 1: HISTÓRICO INDIVIDUAL DE VISTORIAS POR CLIENTE */
        customerGroups.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs carbon-card border-carbon-800 font-mono">
            Nenhum cliente com vistorias registradas para os filtros aplicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 font-mono">
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
                  className="p-4 rounded-xl carbon-card border-carbon-700 bg-carbon-900/60 hover:border-lime-500/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-lime-400 uppercase tracking-widest font-bold block mb-0.5">
                        // CLIENTE
                      </span>
                      <h3 className="text-sm font-bold text-white truncate">{cust.name}</h3>
                      {cust.phone && (
                        <p className="text-[11px] text-slate-400">{cust.phone}</p>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-carbon-950 text-slate-300 border border-carbon-700 text-[10px] font-bold shrink-0">
                      {group.checklists.length}{" "}
                      {group.checklists.length === 1 ? "vistoria" : "vistorias"}
                    </span>
                  </div>

                  {/* Veículos Vistoriados */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase">
                      Veículos Vistoriados:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {uniquePlates.map((plate) => (
                        <span
                          key={plate}
                          className="mercosul-plate text-[10px] font-bold px-1.5 py-0.5 inline-block"
                        >
                          {plate}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Métricas do Histórico do Cliente */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-carbon-800">
                    <div className="p-2 rounded bg-carbon-950 border border-carbon-800">
                      <span className="text-[10px] text-slate-500 block">Total Avarias</span>
                      <span className="font-bold text-rose-400">{totalDamages} pontos</span>
                    </div>
                    <div className="p-2 rounded bg-carbon-950 border border-carbon-800">
                      <span className="text-[10px] text-slate-500 block">Fotos Gravadas</span>
                      <span className="font-bold text-cyan-400">{totalPhotos} fotos</span>
                    </div>
                  </div>

                  {/* Botão para Abrir Dossiê Completo */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryModalCustomer({
                          id: cust.id,
                          name: cust.name,
                          phone: cust.whatsapp || cust.phone,
                        })
                      }
                      className="w-full py-2 rounded bg-carbon-800 hover:bg-lime-400 text-slate-200 hover:text-black border border-carbon-600 hover:border-lime-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Ver Histórico Individual</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* MODO 2: TODAS AS VISTORIAS */
        filteredChecklists.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs carbon-card border-carbon-800 font-mono">
            Nenhuma vistoria de entrada encontrada para o filtro informado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 font-mono">
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
                  className="p-4 rounded-xl carbon-card border-carbon-700 bg-carbon-900/60 hover:border-lime-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="mercosul-plate text-xs font-bold inline-block">
                        {vh.plate}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">
                        {vh.brand ? `${vh.brand} ` : ""}
                        {vh.model}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-carbon-950 px-2 py-0.5 rounded border border-carbon-800">
                      OS #{chk.serviceOrder.orderNumber}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
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
                          className="text-lime-400 hover:underline font-bold text-left"
                          title="Clique para ver o histórico individual deste cliente"
                        >
                          {cust.name}
                        </button>
                      ) : (
                        <strong className="text-slate-300">Não informado</strong>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Porte: {vh.category} {vh.color ? `• ${vh.color}` : ""}
                    </p>
                  </div>

                  {/* Resumo da Vistoria */}
                  <div className="pt-2 border-t border-carbon-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Fuel className="w-3.5 h-3.5 text-amber-400" />
                        <span>Combustível:</span>
                      </span>
                      <span className="font-semibold text-amber-400">{chk.fuelLevel}%</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Avarias Registradas:</span>
                      </span>
                      <strong
                        className={chk.damageRecords.length > 0 ? "text-rose-400" : "text-lime-400"}
                      >
                        {chk.damageRecords.length} ponto(s)
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Fotos Anexadas:</span>
                      </span>
                      <span className="font-bold text-cyan-400">{photoCount} foto(s)</span>
                    </div>

                    {chk.valuablesLeft && (
                      <div className="mt-1.5 p-2 rounded bg-carbon-950 border border-carbon-800 text-[10px] text-slate-300">
                        <span className="text-slate-500 font-bold uppercase">Pertences: </span>
                        {chk.valuablesLeft}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-carbon-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">{formatDateTime(chk.createdAt)}</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => sendWhatsAppChecklist(chk)}
                        title="Enviar comprovante via WhatsApp"
                        className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold uppercase"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <Link
                        href={`/vistoria/${chk.id}`}
                        className="p-1.5 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 hover:text-white border border-carbon-600 transition-all text-[11px] font-bold flex items-center gap-1 uppercase"
                      >
                        <Eye className="w-3.5 h-3.5 text-lime-400" />
                        <span>Ver</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* MODAL DE NOVA VISTORIA & CHECKLIST 360 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="carbon-card border border-[#2b354c] w-full max-w-4xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2230]">
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Camera className="w-4 h-4 text-lime-400" />
                <span>Recepção de Veículo & Checklist 360º</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateChecklist} className="space-y-4">
              {/* ETAPA 1: SELEÇÃO DO VEÍCULO - DUPLO MODO: PUXAR DE OS OU BUSCAR CLIENTE */}
              <div className="p-3.5 bg-[#0c0e14] border border-[#1c2230] rounded space-y-3 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#1c2230]">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    1. Identificação do Veículo para Entrada *
                  </label>

                  {/* Seletor de Modo */}
                  <div className="inline-flex p-1 rounded bg-[#07090e] border border-[#1c2230] text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectionMode("TODO_OS")}
                      className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer text-xs uppercase tracking-wider ${selectionMode === "TODO_OS"
                          ? "bg-lime-400 text-black font-black"
                          : "text-slate-400 hover:text-white"
                        }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Puxar de OS em &quot;A Fazer&quot; ({pendingOrders.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectionMode("SEARCH_CUSTOMER")}
                      className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition cursor-pointer text-xs uppercase tracking-wider ${selectionMode === "SEARCH_CUSTOMER"
                          ? "bg-lime-400 text-black font-black"
                          : "text-slate-400 hover:text-white"
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
                      <div className="p-3.5 rounded-xl bg-blue-600/15 border border-blue-500/40 flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-blue-500/30">
                            <span>OS</span>
                            <span>#{selectedOrderSummary.orderNumber}</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs">
                                {selectedOrderSummary.vehicle.plate}
                              </span>
                              <span className="font-semibold text-white">
                                {selectedOrderSummary.vehicle.brand
                                  ? `${selectedOrderSummary.vehicle.brand} `
                                  : ""}
                                {selectedOrderSummary.vehicle.model}
                              </span>
                              <span className="text-[11px] text-blue-400 font-medium">
                                ({selectedOrderSummary.vehicle.category})
                              </span>
                            </div>
                            <div className="text-slate-300 text-[11px] flex items-center gap-2">
                              <span>
                                Cliente:{" "}
                                <strong className="text-white">
                                  {selectedOrderSummary.vehicle.customer?.name || "Não informado"}
                                </strong>
                              </span>
                              {selectedOrderSummary.vehicle.customer?.phone && (
                                <span>• Tel: {selectedOrderSummary.vehicle.customer.phone}</span>
                              )}
                              {selectedOrderSummary.box && (
                                <span className="text-emerald-400">• Box: {selectedOrderSummary.box}</span>
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
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                        >
                          Trocar OS
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-400">
                          Selecione abaixo uma Ordem de Serviço que já foi criada e está aguardando vistoria no Pátio:
                        </p>
                        {loadingOrders ? (
                          <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span>Carregando ordens em aberto...</span>
                          </div>
                        ) : pendingOrders.length === 0 ? (
                          <div className="p-6 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-2">
                            <ClipboardList className="w-7 h-7 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-400">
                              Nenhuma OS com status &quot;A Fazer&quot; no pátio no momento.
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectionMode("SEARCH_CUSTOMER")}
                              className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline"
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
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-850/80 cursor-pointer transition text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-blue-400 flex items-center gap-1">
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    <span>OS #{os.orderNumber}</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-mono font-bold text-[11px] border border-blue-500/25">
                                    {os.vehicle.plate}
                                  </span>
                                </div>
                                <div className="font-semibold text-white truncate">
                                  {os.vehicle.brand ? `${os.vehicle.brand} ` : ""}
                                  {os.vehicle.model}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                                  <span className="truncate max-w-[140px]">
                                    {os.vehicle.customer?.name || "Cliente avulso"}
                                  </span>
                                  {os.box && (
                                    <span className="text-emerald-400 font-medium text-[10px]">
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

                {/* MODO B: BUSCA POR NOME, CPF OU TELEFONE + SELEÇÃO DOS VEÍCULOS */}
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
                  <label className="form-label-carbon flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-lime-400" />
                    <span>Quilometragem (KM)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 45200"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value ? Number(e.target.value) : "")}
                    className="form-input-carbon w-full font-mono"
                  />
                </div>

                <div>
                  <label className="form-label-carbon flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      <span>Combustível</span>
                    </span>
                    <span className="text-amber-400 font-bold">{fuelLevel}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-lime-400 mt-2"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Pertences / Objetos de Valor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Óculos Ray-Ban no porta-luvas"
                    value={valuablesLeft}
                    onChange={(e) => setValuablesLeft(e.target.value)}
                    className="form-input-carbon w-full"
                  />
                </div>
              </div>

              {/* ETAPA 3: SILHUETA VEICULAR 360 & AVARIAS */}
              <div className="pt-2">
                <VehicleSilhouette360 damages={damages} onChange={setDamages} />
              </div>

              {/* ETAPA 4: OBSERVAÇÕES & CONFIRMAÇÃO DO CLIENTE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1c2230]">
                <div>
                  <label className="form-label-carbon">
                    Observações Adicionais de Entrada
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Cliente autorizou não aspirar porta-malas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input-carbon w-full"
                  />
                </div>

                <div className="flex flex-col justify-center space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer font-mono">
                    <input
                      type="checkbox"
                      checked={customerConfirmed}
                      onChange={(e) => setCustomerConfirmed(e.target.checked)}
                      className="form-checkbox-carbon"
                    />
                    <span>Cliente presenciou e validou o checklist de avarias</span>
                  </label>
                  <p className="text-[11px] text-slate-400 font-mono">
                    O aceite registra o carimbo de data, horário e responsável pela vistoria no pátio.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1c2230] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-engine-start px-5 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Concluir Vistoria & Entrada</span>
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
