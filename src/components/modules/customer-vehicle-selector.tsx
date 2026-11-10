"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  User,
  Car,
  Plus,
  Check,
  X,
  Phone,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";

export interface VehicleItem {
  id: string;
  plate: string;
  brand?: string | null;
  model: string;
  color?: string | null;
  year?: number | null;
  category: "HATCH" | "SEDAN" | "SUV_PICKUP" | "MOTORCYCLE" | "SPECIAL_UTILITY";
  customerId?: string | null;
}

export interface VehicleDraft {
  plate: string;
  brand: string;
  model: string;
  category: VehicleItem["category"];
  color: string;
  year: string;
}

export interface CustomerItem {
  id: string;
  name: string;
  document?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  vehicles: VehicleItem[];
}

interface CustomerVehicleSelectorProps {
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string, vehicle: VehicleItem, customer: CustomerItem) => void;
  disabled?: boolean;
}

export default function CustomerVehicleSelector({
  selectedVehicleId,
  onSelectVehicle,
  disabled = false,
}: CustomerVehicleSelectorProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchResults, setSearchResults] = useState<CustomerItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    document: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    addVehicleNow: true,
    vehicles: [
      {
        plate: "",
        brand: "",
        model: "",
        category: "SEDAN" as VehicleItem["category"],
        color: "",
        year: "",
      },
    ] as VehicleDraft[],
  });

  const handleAddVehicleDraft = () => {
    setNewCustomerForm((prev) => ({
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
  };

  const handleRemoveVehicleDraft = (index: number) => {
    setNewCustomerForm((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateVehicleDraft = (
    index: number,
    field: keyof VehicleDraft,
    value: string
  ) => {
    setNewCustomerForm((prev) => {
      const updated = [...prev.vehicles];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, vehicles: updated };
    });
  };

  const [newVehicleForm, setNewVehicleForm] = useState({
    plate: "",
    brand: "",
    model: "",
    category: "SEDAN" as VehicleItem["category"],
    color: "",
    year: "",
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const url = searchQuery.trim()
          ? `/api/customers?q=${encodeURIComponent(searchQuery.trim())}`
          : "/api/customers";
        const res = await fetch(url);
        const data = await res.json();
        if (data.customers) {
          setSearchResults(data.customers);
        }
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedVehicleId || selectedCustomer) return;

    async function loadCurrentVehicle() {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();
        if (data.customers) {
          for (const cust of data.customers) {
            const vh = cust.vehicles?.find((v: VehicleItem) => v.id === selectedVehicleId);
            if (vh) {
              setSelectedCustomer(cust);
              break;
            }
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar veículo atual:", err);
      }
    }
    loadCurrentVehicle();
  }, [selectedVehicleId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCustomer = (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setIsDropdownOpen(false);
    setSearchQuery("");

    if (customer.vehicles && customer.vehicles.length === 1) {
      onSelectVehicle(customer.vehicles[0].id, customer.vehicles[0], customer);
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
  };

  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError(null);

    try {
      if (!newCustomerForm.name.trim()) {
        throw new Error("O nome do cliente é obrigatório.");
      }
      if (!newCustomerForm.phone.trim() && !newCustomerForm.whatsapp?.trim()) {
        throw new Error("Informe ao menos um telefone ou WhatsApp para contato.");
      }

      const resCust = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerForm.name.trim(),
          document: newCustomerForm.document.trim() || null,
          phone: newCustomerForm.phone.trim() || null,
          whatsapp: newCustomerForm.whatsapp.trim() || newCustomerForm.phone.trim() || null,
          email: newCustomerForm.email.trim() || null,
          address: newCustomerForm.address.trim() || null,
        }),
      });

      const custData = await resCust.json();
      if (!resCust.ok) {
        throw new Error(custData.error || "Erro ao cadastrar cliente.");
      }

      const createdCustomer: CustomerItem = {
        ...custData.customer,
        vehicles: [],
      };

      let primaryVehicle: VehicleItem | null = null;
      const createdVehicles: VehicleItem[] = [];

      if (newCustomerForm.addVehicleNow && newCustomerForm.vehicles.length > 0) {
        for (const vDraft of newCustomerForm.vehicles) {
          if (!vDraft.plate.trim() || !vDraft.model.trim()) continue;

          try {
            const resVeh = await fetch("/api/vehicles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: createdCustomer.id,
                plate: vDraft.plate.trim().toUpperCase().replace("-", ""),
                brand: vDraft.brand.trim() || null,
                model: vDraft.model.trim(),
                category: vDraft.category,
                color: vDraft.color.trim() || null,
                year: vDraft.year ? parseInt(vDraft.year, 10) : null,
              }),
            });

            const vehData = await resVeh.json();
            if (resVeh.ok && vehData.vehicle) {
              createdVehicles.push(vehData.vehicle);
              if (!primaryVehicle) {
                primaryVehicle = vehData.vehicle;
              }
            }
          } catch (e) {
            console.error("Erro ao cadastrar veículo do cliente:", e);
          }
        }
      }

      createdCustomer.vehicles = createdVehicles;
      setSelectedCustomer(createdCustomer);

      if (primaryVehicle) {
        onSelectVehicle(primaryVehicle.id, primaryVehicle, createdCustomer);
      }

      setIsNewCustomerModalOpen(false);
      setNewCustomerForm({
        name: "",
        document: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        addVehicleNow: true,
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
    } catch (err: any) {
      setModalError(err.message || "Falha ao salvar.");
    } finally {
      setModalSaving(false);
    }
  };

  const handleSaveNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setModalSaving(true);
    setModalError(null);

    try {
      if (!newVehicleForm.plate.trim() || !newVehicleForm.model.trim()) {
        throw new Error("Placa e modelo do veículo são obrigatórios.");
      }

      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          plate: newVehicleForm.plate.trim(),
          brand: newVehicleForm.brand.trim() || null,
          model: newVehicleForm.model.trim(),
          category: newVehicleForm.category,
          color: newVehicleForm.color.trim() || null,
          year: newVehicleForm.year ? parseInt(newVehicleForm.year, 10) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao cadastrar veículo.");
      }

      const registeredVehicle = data.vehicle;

      const updatedVehicles = [
        ...selectedCustomer.vehicles.filter((v) => v.id !== registeredVehicle.id),
        registeredVehicle,
      ];

      const updatedCustomer: CustomerItem = {
        ...selectedCustomer,
        vehicles: updatedVehicles,
      };

      setSelectedCustomer(updatedCustomer);
      onSelectVehicle(registeredVehicle.id, registeredVehicle, updatedCustomer);

      setIsNewVehicleModalOpen(false);
      setNewVehicleForm({
        plate: "",
        brand: "",
        model: "",
        category: "SEDAN",
        color: "",
        year: "",
      });
    } catch (err: any) {
      setModalError(err.message || "Falha ao cadastrar veículo.");
    } finally {
      setModalSaving(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "HATCH":
        return "Hatch (Pequeno)";
      case "SEDAN":
        return "Sedan (Médio)";
      case "SUV_PICKUP":
        return "SUV / Caminhonete";
      case "MOTORCYCLE":
        return "Motocicleta";
      case "SPECIAL_UTILITY":
        return "Utilitário Especial";
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. SELEÇÃO / BUSCA DO CLIENTE */}
      {!selectedCustomer ? (
        <div ref={searchContainerRef} className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#343C36]">
              1. Localizar Cliente (Nome, Placa, CPF ou WhatsApp) <span className="text-[#DC4C4C]">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setIsNewCustomerModalOpen(true);
              }}
              className="text-xs font-semibold text-[#247653] hover:text-[#142D26] flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar novo cliente</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA49E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              disabled={disabled}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Digite o nome, CPF, WhatsApp ou placa do carro..."
              className="dp-input pl-9 pr-10"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-[#247653] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Dropdown de Resultados da Busca */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white border border-[#E7EAE7] rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center space-y-2.5">
                  <p className="text-xs text-[#737D75]">
                    Nenhum cliente encontrado com &ldquo;{searchQuery}&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setNewCustomerForm((prev) => ({ ...prev, name: searchQuery }));
                      setIsNewCustomerModalOpen(true);
                    }}
                    className="dp-btn-primary text-xs px-3 py-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar &ldquo;{searchQuery || "Novo Cliente"}&rdquo;</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#E7EAE7]">
                  {searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-3 hover:bg-[#F7F8F6] cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-[#252B27] truncate flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#247653] shrink-0" />
                          <span className="truncate">{cust.name}</span>
                        </div>
                        <div className="text-[11px] text-[#737D75] flex flex-wrap items-center gap-2">
                          {(cust.phone || cust.whatsapp) && (
                            <span className="flex items-center gap-1 text-[#343C36]">
                              <Phone className="w-3 h-3 text-[#247653]" />
                              {cust.whatsapp || cust.phone}
                            </span>
                          )}
                          {cust.document && (
                            <span className="text-[#9CA49E]">
                              CPF/CNPJ: {cust.document}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E9F3EC] text-[#142D26] font-semibold">
                          {cust.vehicles?.length || 0} veículo(s)
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#737D75]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Card do Cliente Selecionado */
        <div className="bg-white border border-[#E7EAE7] rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#247653] block">
                Cliente Vinculado
              </span>
              <h4 className="text-sm font-bold text-[#252B27] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#247653]" />
                <span>{selectedCustomer.name}</span>
              </h4>
              <div className="text-xs text-[#737D75] flex flex-wrap items-center gap-2.5 pt-0.5">
                {(selectedCustomer.phone || selectedCustomer.whatsapp) && (
                  <span className="flex items-center gap-1 text-[#343C36]">
                    <Phone className="w-3 h-3 text-[#247653]" />
                    {selectedCustomer.whatsapp || selectedCustomer.phone}
                  </span>
                )}
                {selectedCustomer.document && (
                  <span className="text-[#9CA49E]">
                    Doc: {selectedCustomer.document}
                  </span>
                )}
                {selectedCustomer.address && (
                  <span className="text-[#737D75] truncate max-w-xs">
                    {selectedCustomer.address}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setIsNewVehicleModalOpen(true);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#E9F3EC] hover:bg-[#d5eadb] text-[#142D26] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5 text-[#247653]" />
                <span>Novo veículo</span>
              </button>

              <button
                type="button"
                onClick={handleClearCustomer}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#F7F8F6] hover:bg-[#F1F3F1] text-[#343C36] transition cursor-pointer border border-[#E7EAE7] font-medium"
                title="Trocar cliente"
              >
                Trocar cliente
              </button>
            </div>
          </div>

          {/* 2. VEÍCULOS DO CLIENTE SELECIONADO */}
          <div className="pt-3 border-t border-[#E7EAE7] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#343C36] flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#247653]" />
                <span>Veículos do Cliente ({selectedCustomer.vehicles?.length || 0})</span>
              </span>
              <span className="text-[11px] text-[#737D75]">
                Selecione o veículo para o atendimento
              </span>
            </div>

            {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedCustomer.vehicles.map((vh) => {
                  const isSelected = selectedVehicleId === vh.id;
                  return (
                    <div
                      key={vh.id}
                      onClick={() => onSelectVehicle(vh.id, vh, selectedCustomer)}
                      className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between gap-3 text-xs ${
                        isSelected
                          ? "bg-[#E9F3EC]/60 border-[#247653] text-[#142D26] shadow-xs"
                          : "bg-[#F7F8F6] border-[#E7EAE7] hover:border-[#9CA49E] text-[#343C36]"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="mercosul-plate text-xs font-bold">
                            {vh.plate}
                          </span>
                          <span className="font-bold text-[#252B27] truncate">
                            {vh.model}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#737D75] flex items-center gap-1.5">
                          <span>{getCategoryLabel(vh.category)}</span>
                          {vh.color && <span>• {vh.color}</span>}
                          {vh.year && <span>• {vh.year}</span>}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#247653] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] text-center text-xs text-[#737D75]">
                Nenhum veículo vinculado. Clique em &ldquo;Novo veículo&rdquo; acima para cadastrar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRAR NOVO CLIENTE */}
      {mounted && isNewCustomerModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E7EAE7] my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <h3 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                <User className="w-4 h-4 text-[#247653]" />
                <span>Cadastrar Novo Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-[#737D75] hover:text-[#252B27] p-1 rounded-lg hover:bg-[#F7F8F6] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Nome Completo <span className="text-[#DC4C4C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="dp-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Telefone / WhatsApp <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.whatsapp}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Ex: (61) 98112-2091"
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.document}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({ ...prev, document: e.target.value }))
                    }
                    placeholder="Ex: 000.000.000-00"
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
                    value={newCustomerForm.email}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="cliente@email.com"
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Endereço / Bairro (opcional)
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.address}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Ex: Águas Claras, DF"
                    className="dp-input"
                  />
                </div>
              </div>

              {/* Opção de cadastrar veículo junto */}
              <div className="pt-3 border-t border-[#E7EAE7] space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#252B27]">
                  <input
                    type="checkbox"
                    checked={newCustomerForm.addVehicleNow}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({
                        ...prev,
                        addVehicleNow: e.target.checked,
                      }))
                    }
                    className="rounded text-[#247653] focus:ring-[#247653] w-4 h-4 cursor-pointer accent-[#247653]"
                  />
                  <span>Já cadastrar o veículo deste cliente agora</span>
                </label>

                {newCustomerForm.addVehicleNow && (
                  <div className="space-y-3 animate-in fade-in">
                    {newCustomerForm.vehicles.map((vDraft, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#E7EAE7] text-xs">
                          <span className="font-semibold text-[#247653] flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5" />
                            <span>Veículo #{idx + 1} {idx === 0 ? "(Principal)" : ""}</span>
                          </span>
                          {newCustomerForm.vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVehicleDraft(idx)}
                              className="text-[#737D75] hover:text-[#DC4C4C] text-[11px] flex items-center gap-0.5 cursor-pointer font-medium"
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
                              required={newCustomerForm.addVehicleNow}
                              value={vDraft.plate}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(
                                  idx,
                                  "plate",
                                  e.target.value.toUpperCase().replace("-", "")
                                )
                              }
                              placeholder="ABC1D23"
                              className="dp-input font-mono font-bold uppercase"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Porte / Categoria <span className="text-[#DC4C4C]">*</span>
                            </label>
                            <select
                              value={vDraft.category}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "category", e.target.value as any)
                              }
                              className="dp-input"
                            >
                              <option value="HATCH">Hatch (Pequeno)</option>
                              <option value="SEDAN">Sedan (Médio)</option>
                              <option value="SUV_PICKUP">SUV / Caminhonete</option>
                              <option value="MOTORCYCLE">Motocicleta</option>
                              <option value="SPECIAL_UTILITY">Utilitário Especial</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Modelo <span className="text-[#DC4C4C]">*</span>
                            </label>
                            <input
                              type="text"
                              required={newCustomerForm.addVehicleNow}
                              value={vDraft.model}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "model", e.target.value)
                              }
                              placeholder="Ex: Onix, Corolla, Compass"
                              className="dp-input"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Marca (opcional)
                            </label>
                            <input
                              type="text"
                              value={vDraft.brand}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "brand", e.target.value)
                              }
                              placeholder="Ex: Chevrolet, Toyota"
                              className="dp-input"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Cor
                            </label>
                            <input
                              type="text"
                              value={vDraft.color}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "color", e.target.value)
                              }
                              placeholder="Ex: Preto, Prata, Branco"
                              className="dp-input"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                              Ano
                            </label>
                            <input
                              type="number"
                              value={vDraft.year}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "year", e.target.value)
                              }
                              placeholder="Ex: 2023"
                              className="dp-input"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddVehicleDraft}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-[#E7EAE7] hover:border-[#247653] text-[#343C36] hover:text-[#247653] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer bg-[#F7F8F6]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#247653]" />
                      <span>Adicionar outro veículo para este cliente</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E7EAE7]">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="dp-btn-secondary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="dp-btn-primary text-xs cursor-pointer"
                >
                  {modalSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar e Selecionar</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: CADASTRAR NOVO VEÍCULO PARA O CLIENTE SELECIONADO */}
      {mounted && isNewVehicleModalOpen && selectedCustomer && createPortal(
        <div className="fixed inset-0 z-[100] bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E7EAE7] my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#247653]" />
                  <span>Cadastrar Novo Veículo</span>
                </h3>
                <p className="text-xs text-[#737D75]">
                  Cliente: <strong className="text-[#252B27]">{selectedCustomer.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVehicleModalOpen(false)}
                className="text-[#737D75] hover:text-[#252B27] p-1 rounded-lg hover:bg-[#F7F8F6] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewVehicle} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Placa do Veículo <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVehicleForm.plate}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({
                        ...prev,
                        plate: e.target.value.toUpperCase().replace("-", ""),
                      }))
                    }
                    placeholder="ABC1D23"
                    className="dp-input font-mono font-bold uppercase tracking-wider"
                  />
                  <span className="text-[10px] text-[#737D75] mt-1 block">
                    Se a placa já existir, será vinculada a este cliente.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Porte / Categoria <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <select
                    value={newVehicleForm.category}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    className="dp-input"
                  >
                    <option value="HATCH">Hatch (Pequeno)</option>
                    <option value="SEDAN">Sedan (Médio)</option>
                    <option value="SUV_PICKUP">SUV / Caminhonete</option>
                    <option value="MOTORCYCLE">Motocicleta</option>
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
                    value={newVehicleForm.model}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="Ex: Corolla, Civic, Onix"
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Marca (opcional)
                  </label>
                  <input
                    type="text"
                    value={newVehicleForm.brand}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    placeholder="Ex: Toyota, Honda, GM"
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
                    value={newVehicleForm.color}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    placeholder="Ex: Preto, Prata"
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={newVehicleForm.year}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, year: e.target.value }))
                    }
                    placeholder="Ex: 2024"
                    className="dp-input"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E7EAE7]">
                <button
                  type="button"
                  onClick={() => setIsNewVehicleModalOpen(false)}
                  className="dp-btn-secondary text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="dp-btn-primary text-xs cursor-pointer"
                >
                  {modalSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar Veículo</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
