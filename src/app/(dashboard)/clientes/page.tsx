"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Car,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  FileText,
  FileCheck,
  Pencil,
  Check,
  MapPin,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CustomerChecklistHistoryModal } from "@/components/modules/customer-checklist-history-modal";

interface Vehicle {
  id: string;
  plate: string;
  brand?: string;
  model: string;
  color?: string;
  year?: number;
  category: "HATCH" | "SEDAN" | "SUV_PICKUP" | "MOTORCYCLE" | "SPECIAL_UTILITY";
}

interface Customer {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  visitsCount: number;
  lastVisitAt?: string;
  vehicles: Vehicle[];
}

interface VehicleDraft {
  plate: string;
  brand: string;
  model: string;
  category: Vehicle["category"];
  color: string;
  year: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

  // Form State - Novo Cliente com múltiplos veículos
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    notes: "",
    addVehicle: true,
    vehicles: [
      {
        plate: "",
        brand: "",
        model: "",
        category: "SEDAN" as Vehicle["category"],
        color: "",
        year: "",
      },
    ] as VehicleDraft[],
  });

  // Modal State - Editar Cliente
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    document: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    notes: "",
  });

  // Modal State - Adicionar Veículo para Cliente Existente
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [targetCustomerForVehicle, setTargetCustomerForVehicle] = useState<Customer | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState<VehicleDraft>({
    plate: "",
    brand: "",
    model: "",
    category: "SEDAN",
    color: "",
    year: "",
  });

  async function loadCustomers(query: string = "") {
    try {
      setLoading(true);
      const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : "/api/customers";
      const res = await fetch(url);
      const json = await res.json();
      setCustomers(json.customers || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Funções de manipulação de múltiplos veículos no Novo Cliente
  function handleAddVehicleDraft() {
    setFormData((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          plate: "",
          brand: "",
          model: "",
          category: "SEDAN",
          color: "",
          year: "",
        },
      ],
    }));
  }

  function handleRemoveVehicleDraft(index: number) {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index),
    }));
  }

  function handleUpdateVehicleDraft(index: number, field: keyof VehicleDraft, value: string) {
    setFormData((prev) => {
      const updated = [...prev.vehicles];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, vehicles: updated };
    });
  }

  // 1. Cadastrar Novo Cliente
  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const resCustomer = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          document: formData.document || null,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          notes: formData.notes || null,
        }),
      });

      const customerData = await resCustomer.json();
      if (!resCustomer.ok) {
        throw new Error(customerData.error || "Erro ao salvar cliente.");
      }

      // Cadastra os veículos informados
      if (formData.addVehicle && formData.vehicles.length > 0) {
        for (const vDraft of formData.vehicles) {
          if (!vDraft.plate.trim() || !vDraft.model.trim()) continue;

          try {
            await fetch("/api/vehicles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: customerData.customer.id,
                plate: vDraft.plate.trim().toUpperCase().replace("-", ""),
                brand: vDraft.brand.trim() || null,
                model: vDraft.model.trim(),
                category: vDraft.category,
                color: vDraft.color.trim() || null,
                year: vDraft.year ? parseInt(vDraft.year, 10) : null,
              }),
            });
          } catch (e) {
            console.error("Erro ao salvar veículo do cliente:", e);
          }
        }
      }

      setModalOpen(false);
      setFormData({
        name: "",
        document: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        notes: "",
        addVehicle: true,
        vehicles: [
          {
            plate: "",
            brand: "",
            model: "",
            category: "SEDAN",
            color: "",
            year: "",
          },
        ],
      });
      loadCustomers(search);
    } catch (err: any) {
      setError(err.message || "Erro ao processar cadastro.");
    } finally {
      setSaving(false);
    }
  }

  // 2. Abrir Modal de Edição de Cliente
  function handleOpenEditCustomer(c: Customer) {
    setEditingCustomer(c);
    setEditFormData({
      name: c.name || "",
      document: c.document || "",
      phone: c.phone || "",
      whatsapp: c.whatsapp || c.phone || "",
      email: c.email || "",
      address: c.address || "",
      notes: c.notes || "",
    });
    setError(null);
    setIsEditModalOpen(true);
  }

  // Salvar Edição do Cliente
  async function handleUpdateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          document: editFormData.document.trim() || null,
          phone: editFormData.phone.trim() || null,
          whatsapp: editFormData.whatsapp.trim() || editFormData.phone.trim() || null,
          email: editFormData.email.trim() || null,
          address: editFormData.address.trim() || null,
          notes: editFormData.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar dados do cliente.");
      }

      setIsEditModalOpen(false);
      setEditingCustomer(null);
      loadCustomers(search);
    } catch (err: any) {
      setError(err.message || "Falha ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  // 3. Abrir Modal de Adicionar Veículo para Cliente
  function handleOpenAddVehicle(c: Customer) {
    setTargetCustomerForVehicle(c);
    setVehicleFormData({
      plate: "",
      brand: "",
      model: "",
      category: "SEDAN",
      color: "",
      year: "",
    });
    setError(null);
    setIsAddVehicleModalOpen(true);
  }

  // Salvar Novo Veículo no Cliente
  async function handleSaveVehicleToCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!targetCustomerForVehicle) return;

    if (!vehicleFormData.plate.trim() || !vehicleFormData.model.trim()) {
      setError("Placa e modelo do veículo são obrigatórios.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: targetCustomerForVehicle.id,
          plate: vehicleFormData.plate.trim().toUpperCase().replace("-", ""),
          brand: vehicleFormData.brand.trim() || null,
          model: vehicleFormData.model.trim(),
          category: vehicleFormData.category,
          color: vehicleFormData.color.trim() || null,
          year: vehicleFormData.year ? parseInt(vehicleFormData.year, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao adicionar veículo.");
      }

      setIsAddVehicleModalOpen(false);
      setTargetCustomerForVehicle(null);
      loadCustomers(search);
    } catch (err: any) {
      setError(err.message || "Falha ao adicionar veículo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja remover o cliente ${name}?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao excluir.");
        return;
      }
      loadCustomers(search);
    } catch (e) {
      console.error(e);
      alert("Falha ao remover cliente.");
    }
  }

  const categoryLabels: Record<string, string> = {
    HATCH: "Hatch",
    SEDAN: "Sedan",
    SUV_PICKUP: "SUV / Picape",
    MOTORCYCLE: "Moto",
    SPECIAL_UTILITY: "Especial",
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded carbon-card border-carbon-700 bg-carbon-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-carbon-800 border border-carbon-700 flex items-center justify-center text-lime-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-display font-extrabold tracking-wide text-white uppercase flex items-center gap-2">
              <span>Gestão de Clientes & Veículos</span>
              <span className="led-pulse-lime" />
            </h1>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              BASE CADASTRAL INTEGRADA // RELACIONAMENTO MULTI-VEÍCULO E HISTÓRICO
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="btn-engine-start px-3.5 py-2 rounded text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ NOVO CLIENTE / CARRO</span>
        </button>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="flex items-center gap-3 font-mono">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SCAN CLIENTE POR NOME, PLACA DO CARRO, TELEFONE OU CPF..."
            className="w-full pl-10 pr-4 py-2 rounded bg-carbon-900 border border-carbon-700 hover:border-carbon-600 text-white placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-lime-400/50 focus:border-lime-400 transition-all uppercase"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="carbon-card overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
            <Loader2 className="w-7 h-7 animate-spin text-lime-400" />
            <p className="text-xs uppercase tracking-wider">CARREGANDO BASE DE CLIENTES...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            // NENHUM CLIENTE ENCONTRADO COM OS CRITÉRIOS DE BUSCA
          </div>
        ) : (
          <div className="overflow-x-auto font-mono">
            <table className="w-full text-left text-xs">
              <thead className="bg-carbon-950/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-carbon-800 font-bold">
                <tr>
                  <th className="py-3 px-4">CLIENTE</th>
                  <th className="py-3 px-4">CONTATO</th>
                  <th className="py-3 px-4">VEÍCULOS VINCULADOS</th>
                  <th className="py-3 px-4 text-center">PASSAGENS</th>
                  <th className="py-3 px-4 text-right">TOTAL GASTO</th>
                  <th className="py-3 px-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/70">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-carbon-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{c.name}</div>
                      {c.document && <div className="text-[10px] text-slate-400">{c.document}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{c.whatsapp || c.phone || "Não informado"}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[150px]">{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {c.vehicles.length === 0 ? (
                          <span className="text-slate-500 text-[11px] italic">// Sem veículos</span>
                        ) : (
                          c.vehicles.map((v) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-carbon-900 border border-carbon-700 text-[11px]"
                            >
                              <span className="mercosul-plate text-xs font-bold">
                                {v.plate}
                              </span>
                              <span className="text-slate-300 font-bold">
                                {v.model}
                              </span>
                              <span className="text-slate-500 text-[9px] uppercase">
                                ({categoryLabels[v.category] || v.category})
                              </span>
                            </span>
                          ))
                        )}

                        {/* Botão para Adicionar Outro Carro diretamente ao Cliente */}
                        <button
                          onClick={() => handleOpenAddVehicle(c)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 border border-lime-400/30 text-[10px] font-bold transition cursor-pointer uppercase"
                          title="Adicionar mais um veículo para este cliente"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Carro</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-carbon-900 text-slate-300 border border-carbon-700">
                        {c.visitsCount} {c.visitsCount === 1 ? "visita" : "visitas"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-lime-400">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão HISTÓRICO DE VISTORIAS */}
                        <button
                          onClick={() => setSelectedCustomerForHistory(c)}
                          title="Ver histórico de vistorias deste cliente"
                          className="px-2 py-1 rounded bg-carbon-800 hover:bg-carbon-700 text-lime-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-carbon-600 uppercase"
                        >
                          <FileCheck className="w-3 h-3 text-lime-400" />
                          <span>Vistorias</span>
                        </button>

                        {/* Botão EDITAR CLIENTE */}
                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          title="Editar dados cadastrais do cliente"
                          className="px-2 py-1 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-carbon-600 uppercase"
                        >
                          <Pencil className="w-3 h-3 text-lime-400" />
                          <span>Editar</span>
                        </button>

                        {/* Botão EXCLUIR */}
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Remover cliente"
                          className="p-1.5 rounded hover:bg-carbon-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-carbon-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CADASTRAR NOVO CLIENTE (COM MÚLTIPLOS VEÍCULOS) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="carbon-card w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto bg-carbon-900 border-carbon-700">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <h2 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-lime-400" />
                <span>Cadastrar Novo Cliente</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="form-label-carbon">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input-carbon w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })
                    }
                    className="form-input-carbon w-full font-mono"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="form-input-carbon w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Endereço / Bairro (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Águas Claras, DF"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>
              </div>

              {/* SEÇÃO VEÍCULOS (SUPORTA MÚLTIPLOS VEÍCULOS) */}
              <div className="pt-3 border-t border-carbon-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                    <Car className="w-3.5 h-3.5 text-lime-400" />
                    <span>Veículos do Cliente</span>
                  </span>
                  <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.addVehicle}
                      onChange={(e) => setFormData({ ...formData, addVehicle: e.target.checked })}
                      className="form-checkbox-carbon"
                    />
                    <span>Cadastrar carro(s) agora</span>
                  </label>
                </div>

                {formData.addVehicle && (
                  <div className="space-y-3">
                    {formData.vehicles.map((vDraft, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-carbon-950 border border-carbon-800 rounded space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-carbon-800 text-xs font-mono">
                          <span className="font-bold text-lime-400 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5" />
                            <span>Veículo #{idx + 1} {idx === 0 ? "(Principal)" : ""}</span>
                          </span>
                          {formData.vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVehicleDraft(idx)}
                              className="text-slate-500 hover:text-red-400 text-[11px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Remover</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="form-label-carbon">
                              Placa do Carro *
                            </label>
                            <input
                              type="text"
                              required={formData.addVehicle}
                              placeholder="ABC1D23"
                              value={vDraft.plate}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(
                                  idx,
                                  "plate",
                                  e.target.value.toUpperCase().replace("-", "")
                                )
                              }
                              className="form-input-carbon w-full font-mono font-bold uppercase tracking-wider"
                            />
                          </div>

                          <div>
                            <label className="form-label-carbon">
                              Categoria de Porte *
                            </label>
                            <select
                              value={vDraft.category}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "category", e.target.value as any)
                              }
                              className="form-select-carbon w-full font-mono text-xs"
                            >
                              <option value="HATCH">Pequeno / Hatch (Onix, Gol, Polo)</option>
                              <option value="SEDAN">Médio / Sedan (Corolla, Civic, Cruze)</option>
                              <option value="SUV_PICKUP">Grande / SUV & Picape (Compass, Hilux)</option>
                              <option value="MOTORCYCLE">Moto</option>
                              <option value="SPECIAL_UTILITY">Utilitário Especial / Van</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="form-label-carbon">Marca</label>
                            <input
                              type="text"
                              placeholder="Ex: Honda"
                              value={vDraft.brand}
                              onChange={(e) => handleUpdateVehicleDraft(idx, "brand", e.target.value)}
                              className="form-input-carbon w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="form-label-carbon">Modelo *</label>
                            <input
                              type="text"
                              required={formData.addVehicle}
                              placeholder="Ex: Civic"
                              value={vDraft.model}
                              onChange={(e) => handleUpdateVehicleDraft(idx, "model", e.target.value)}
                              className="form-input-carbon w-full text-xs"
                            />
                          </div>
                          <div>
                            <label className="form-label-carbon">Cor</label>
                            <input
                              type="text"
                              placeholder="Ex: Preto"
                              value={vDraft.color}
                              onChange={(e) => handleUpdateVehicleDraft(idx, "color", e.target.value)}
                              className="form-input-carbon w-full text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddVehicleDraft}
                      className="w-full py-2 px-3 rounded border border-dashed border-carbon-700 hover:border-lime-400 text-slate-300 hover:text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition cursor-pointer bg-carbon-950 hover:bg-carbon-900 uppercase"
                    >
                      <Plus className="w-3.5 h-3.5 text-lime-400" />
                      <span>+ Adicionar outro veículo para este cliente</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-carbon-700 flex items-center justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-engine-start px-4 py-2 rounded flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar Cadastro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CLIENTE */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="carbon-card w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto bg-carbon-900 border-carbon-700">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <h2 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                <Pencil className="w-4 h-4 text-lime-400" />
                <span>Editar Dados do Cliente</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCustomer} className="space-y-4 font-mono">
              <div>
                <label className="form-label-carbon">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="form-input-carbon w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.whatsapp}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        whatsapp: e.target.value,
                        phone: e.target.value,
                      })
                    }
                    className="form-input-carbon w-full"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={editFormData.document}
                    onChange={(e) => setEditFormData({ ...editFormData, document: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Endereço / Bairro
                  </label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>
              </div>

              <div>
                <label className="form-label-carbon">
                  Notas / Preferências do Cliente
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ex: Prefere aroma cítrico, cliente detalhista..."
                  className="form-input-carbon w-full resize-none"
                />
              </div>

              {/* VEÍCULOS VINCULADOS AO CLIENTE */}
              <div className="pt-3 border-t border-carbon-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                    <Car className="w-3.5 h-3.5 text-lime-400" />
                    <span>Veículos Deste Cliente ({editingCustomer.vehicles?.length || 0})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      handleOpenAddVehicle(editingCustomer);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-lime-400 hover:text-lime-300 font-bold uppercase cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Adicionar outro veículo</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {editingCustomer.vehicles && editingCustomer.vehicles.length > 0 ? (
                    editingCustomer.vehicles.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-carbon-950 border border-carbon-700 text-xs"
                      >
                        <span className="mercosul-plate text-xs font-bold">{v.plate}</span>
                        <span className="text-slate-300 font-bold">{v.model}</span>
                        <span className="text-slate-500 text-[10px]">
                          ({categoryLabels[v.category] || v.category})
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs italic">// Nenhum veículo cadastrado ainda.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-carbon-700 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-engine-start px-4 py-2 rounded flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADICIONAR VEÍCULO AO CLIENTE */}
      {isAddVehicleModalOpen && targetCustomerForVehicle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="carbon-card w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 bg-carbon-900 border-carbon-700">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <h2 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                <Car className="w-4 h-4 text-lime-400" />
                <span>Adicionar Veículo // Cliente</span>
              </h2>
              <button
                onClick={() => setIsAddVehicleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded bg-carbon-950 border border-carbon-800 text-xs font-mono text-slate-300">
              Vinculando veículo ao cliente: <strong className="text-lime-400">{targetCustomerForVehicle.name}</strong>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveVehicleToCustomer} className="space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABC1D23"
                    value={vehicleFormData.plate}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        plate: e.target.value.toUpperCase().replace("-", ""),
                      })
                    }
                    className="form-input-carbon w-full font-bold uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Porte / Categoria *
                  </label>
                  <select
                    value={vehicleFormData.category}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        category: e.target.value as Vehicle["category"],
                      })
                    }
                    className="form-select-carbon w-full text-xs"
                  >
                    <option value="HATCH">Hatch (Pequeno)</option>
                    <option value="SEDAN">Sedan (Médio)</option>
                    <option value="SUV_PICKUP">SUV / Picape</option>
                    <option value="MOTORCYCLE">Moto</option>
                    <option value="SPECIAL_UTILITY">Utilitário Especial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Corolla, Civic"
                    value={vehicleFormData.model}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, model: e.target.value })
                    }
                    className="form-input-carbon w-full text-xs"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Toyota, Honda"
                    value={vehicleFormData.brand}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, brand: e.target.value })
                    }
                    className="form-input-carbon w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    Cor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Preto, Prata"
                    value={vehicleFormData.color}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, color: e.target.value })
                    }
                    className="form-input-carbon w-full text-xs"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Ano
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 2023"
                    value={vehicleFormData.year}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, year: e.target.value })
                    }
                    className="form-input-carbon w-full text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-carbon-700 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-engine-start px-4 py-2 rounded flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Adicionar Carro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO DE VISTORIAS DO CLIENTE */}
      {selectedCustomerForHistory && (
        <CustomerChecklistHistoryModal
          isOpen={!!selectedCustomerForHistory}
          customerId={selectedCustomerForHistory.id}
          customerName={selectedCustomerForHistory.name}
          customerPhone={selectedCustomerForHistory.whatsapp || selectedCustomerForHistory.phone}
          onClose={() => setSelectedCustomerForHistory(null)}
        />
      )}
    </div>
  );
}
