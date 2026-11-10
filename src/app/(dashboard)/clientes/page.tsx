"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Car,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  FileCheck,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-xl bg-white border border-[#E7EAE7] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#252B27]">
              Clientes e Veículos
            </h1>
            <p className="text-xs text-[#737D75] mt-0.5">
              Base cadastral integrada, múltiplos veículos vinculados e histórico de vistorias
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="dp-btn-primary text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente / Veículo</span>
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA49E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome, placa do carro, telefone ou CPF..."
            className="dp-input pl-10"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#737D75]">
            <Loader2 className="w-7 h-7 animate-spin text-[#247653]" />
            <p className="text-xs font-medium">Carregando base de clientes...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-[#737D75] text-xs space-y-2">
            <Users className="w-8 h-8 text-[#9CA49E] mx-auto" />
            <p className="font-semibold text-[#252B27]">Nenhum cliente encontrado</p>
            <p>Verifique os termos de busca ou cadastre um novo cliente acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F6] text-[#737D75] uppercase tracking-wider text-[11px] border-b border-[#E7EAE7] font-semibold">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Veículos Vinculados</th>
                  <th className="py-3 px-4 text-center">Passagens</th>
                  <th className="py-3 px-4 text-right">Total Gasto</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAE7]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F8F6] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#252B27]">{c.name}</div>
                      {c.document && <div className="text-[11px] text-[#737D75]">{c.document}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-[#343C36]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-[#247653]" />
                        <span>{c.whatsapp || c.phone || "Não informado"}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#737D75] mt-0.5">
                          <Mail className="w-3 h-3 text-[#9CA49E]" />
                          <span className="truncate max-w-[160px]">{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {c.vehicles.length === 0 ? (
                          <span className="text-[#9CA49E] text-xs italic">Sem veículos</span>
                        ) : (
                          c.vehicles.map((v) => (
                            <span
                              key={v.id}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] text-xs"
                            >
                              <span className="mercosul-plate text-xs font-bold">
                                {v.plate}
                              </span>
                              <span className="text-[#252B27] font-semibold">
                                {v.model}
                              </span>
                              <span className="text-[#737D75] text-[10px]">
                                ({categoryLabels[v.category] || v.category})
                              </span>
                            </span>
                          ))
                        )}

                        <button
                          onClick={() => handleOpenAddVehicle(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E9F3EC] hover:bg-[#d5eadb] text-[#142D26] text-[11px] font-semibold transition cursor-pointer"
                          title="Adicionar mais um veículo para este cliente"
                        >
                          <Plus className="w-3 h-3 text-[#247653]" />
                          <span>Novo carro</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F8F6] text-[#343C36] border border-[#E7EAE7]">
                        {c.visitsCount} {c.visitsCount === 1 ? "visita" : "visitas"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#247653]">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCustomerForHistory(c)}
                          title="Ver histórico de vistorias deste cliente"
                          className="px-2.5 py-1.5 rounded-lg bg-[#F7F8F6] hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium border border-[#E7EAE7]"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#247653]" />
                          <span>Vistorias</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          title="Editar dados cadastrais do cliente"
                          className="px-2.5 py-1.5 rounded-lg bg-[#F7F8F6] hover:bg-[#F1F3F1] text-[#343C36] transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium border border-[#E7EAE7]"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#737D75]" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          title="Remover cliente"
                          className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#9CA49E] hover:text-[#DC4C4C] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-[#E7EAE7] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#247653]" />
                <span>Cadastrar Novo Cliente</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#737D75] hover:text-[#252B27] p-1 rounded-lg hover:bg-[#F7F8F6] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Nome Completo <span className="text-[#DC4C4C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do cliente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="dp-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    WhatsApp / Celular <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })
                    }
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="dp-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Endereço / Bairro (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Águas Claras, DF"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="dp-input"
                  />
                </div>
              </div>

              {/* SEÇÃO VEÍCULOS */}
              <div className="pt-3 border-t border-[#E7EAE7] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#252B27] flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Veículos do Cliente</span>
                  </span>
                  <label className="text-xs text-[#343C36] font-medium flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.addVehicle}
                      onChange={(e) => setFormData({ ...formData, addVehicle: e.target.checked })}
                      className="rounded accent-[#247653]"
                    />
                    <span>Cadastrar veículo(s) agora</span>
                  </label>
                </div>

                {formData.addVehicle && (
                  <div className="space-y-3">
                    {formData.vehicles.map((vDraft, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#E7EAE7] text-xs">
                          <span className="font-bold text-[#247653] flex items-center gap-1">
                            <Car className="w-3.5 h-3.5" />
                            <span>Veículo #{idx + 1} {idx === 0 ? "(Principal)" : ""}</span>
                          </span>
                          {formData.vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVehicleDraft(idx)}
                              className="text-[#737D75] hover:text-[#DC4C4C] text-[11px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Remover</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Placa do Carro <span className="text-[#DC4C4C]">*</span>
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
                              className="dp-input font-mono font-bold uppercase tracking-wider"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Categoria de Porte <span className="text-[#DC4C4C]">*</span>
                            </label>
                            <select
                              value={vDraft.category}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "category", e.target.value as any)
                              }
                              className="dp-input text-xs"
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
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">Marca</label>
                            <input
                              type="text"
                              placeholder="Ex: Honda"
                              value={vDraft.brand}
                              onChange={(e) => handleUpdateVehicleDraft(idx, "brand", e.target.value)}
                              className="dp-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Modelo <span className="text-[#DC4C4C]">*</span>
                            </label>
                            <input
                              type="text"
                              required={formData.addVehicle}
                              placeholder="Ex: Civic"
                              value={vDraft.model}
                              onChange={(e) => handleUpdateVehicleDraft(idx, "model", e.target.value)}
                              className="dp-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">Cor</label>
                            <input
                              type="text"
                              placeholder="Ex: Preto"
                              value={vDraft.color}
                              onChange={(e) => handleUpdateVehicleDraft(idx, "color", e.target.value)}
                              className="dp-input text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddVehicleDraft}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-[#9CA49E] hover:border-[#247653] text-[#343C36] hover:text-[#247653] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer bg-[#F7F8F6]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247653]" />
                      <span>Adicionar outro veículo para este cliente</span>
                    </button>
                  </div>
                )}
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
                  <span>Salvar Cadastro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CLIENTE */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-[#E7EAE7] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#247653]" />
                <span>Editar Dados do Cliente</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#737D75] hover:text-[#252B27] p-1 rounded-lg hover:bg-[#F7F8F6] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Nome Completo <span className="text-[#DC4C4C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="dp-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    WhatsApp / Celular <span className="text-[#DC4C4C]">*</span>
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
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={editFormData.document}
                    onChange={(e) => setEditFormData({ ...editFormData, document: e.target.value })}
                    className="dp-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Endereço / Bairro
                  </label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="dp-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Notas / Preferências do Cliente
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ex: Prefere aroma cítrico, cliente detalhista..."
                  className="dp-input resize-none"
                />
              </div>

              {/* VEÍCULOS VINCULADOS */}
              <div className="pt-3 border-t border-[#E7EAE7] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#252B27] flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Veículos Deste Cliente ({editingCustomer.vehicles?.length || 0})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      handleOpenAddVehicle(editingCustomer);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#247653] hover:text-[#142D26] font-semibold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar outro veículo</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {editingCustomer.vehicles && editingCustomer.vehicles.length > 0 ? (
                    editingCustomer.vehicles.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] text-xs"
                      >
                        <span className="mercosul-plate text-xs font-bold">{v.plate}</span>
                        <span className="text-[#252B27] font-semibold">{v.model}</span>
                        <span className="text-[#737D75] text-[10px]">
                          ({categoryLabels[v.category] || v.category})
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[#737D75] text-xs italic">Nenhum veículo cadastrado ainda.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7EAE7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADICIONAR VEÍCULO AO CLIENTE */}
      {isAddVehicleModalOpen && targetCustomerForVehicle && (
        <div className="fixed inset-0 z-50 bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-[#E7EAE7] rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                <Car className="w-4 h-4 text-[#247653]" />
                <span>Adicionar Veículo ao Cliente</span>
              </h2>
              <button
                onClick={() => setIsAddVehicleModalOpen(false)}
                className="text-[#737D75] hover:text-[#252B27] p-1 rounded-lg hover:bg-[#F7F8F6] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#E9F3EC]/60 border border-[#C6E2D0] text-xs text-[#142D26]">
              Vinculando veículo ao cliente: <strong>{targetCustomerForVehicle.name}</strong>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveVehicleToCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Placa do Veículo <span className="text-[#DC4C4C]">*</span>
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
                    className="dp-input font-mono font-bold uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Porte / Categoria <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <select
                    value={vehicleFormData.category}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        category: e.target.value as Vehicle["category"],
                      })
                    }
                    className="dp-input text-xs"
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
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Modelo <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Corolla, Civic"
                    value={vehicleFormData.model}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, model: e.target.value })
                    }
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Toyota, Honda"
                    value={vehicleFormData.brand}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, brand: e.target.value })
                    }
                    className="dp-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Preto, Prata"
                    value={vehicleFormData.color}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, color: e.target.value })
                    }
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 2023"
                    value={vehicleFormData.year}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, year: e.target.value })
                    }
                    className="dp-input"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7EAE7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleModalOpen(false)}
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
                  <span>Adicionar Veículo</span>
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
