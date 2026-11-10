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
  FileText,
  AlertCircle,
  Loader2,
  Tag,
  ChevronRight,
  RefreshCw,
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
  // Estados de busca
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);
  const [searchResults, setSearchResults] = useState<CustomerItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Cliente e veículo selecionados
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Modais de Cadastro Rápido
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Formulário de Novo Cliente (Suporta múltiplos carros)
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

  // Formulário de Novo Veículo
  const [newVehicleForm, setNewVehicleForm] = useState({
    plate: "",
    brand: "",
    model: "",
    category: "SEDAN" as VehicleItem["category"],
    color: "",
    year: "",
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Carrega clientes iniciais ou busca com debounce
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

  // Se já houver selectedVehicleId e nenhum cliente selecionado, busca o veículo e seu cliente
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

  // Fecha dropdown ao clicar fora
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

  // Seleciona um cliente
  const handleSelectCustomer = (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setIsDropdownOpen(false);
    setSearchQuery("");

    // Se o cliente tem apenas 1 veículo, já seleciona automaticamente para acelerar o operador
    if (customer.vehicles && customer.vehicles.length === 1) {
      onSelectVehicle(customer.vehicles[0].id, customer.vehicles[0], customer);
    }
  };

  // Trocar cliente
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
  };

  // Salvar Novo Cliente (com ou sem veículo inicial)
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

      // 1. Cria o cliente
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

      // 2. Se optou por criar veículos junto
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

      // Fecha modal e limpa formulário
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

  // Salvar Novo Veículo para o cliente já selecionado
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

      // Atualiza o cliente local com o novo veículo
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
        <div ref={searchContainerRef} className="space-y-2 relative font-mono">
          <div className="flex items-center justify-between">
            <label className="form-label-carbon">
              1. Localizar Cliente (Nome, Placa, CPF ou Telefone/WhatsApp) *
            </label>
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setIsNewCustomerModalOpen(true);
              }}
              className="text-xs font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1 cursor-pointer transition uppercase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Cliente</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              disabled={disabled}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="DIGITE O NOME, CPF, WHATSAPP OU PLACA DO CARRO..."
              className="form-input-carbon w-full pl-9 pr-10 py-2.5 uppercase text-xs"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-lime-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Dropdown de Resultados da Busca */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-carbon-900 border border-carbon-700 rounded shadow-2xl overflow-hidden max-h-64 overflow-y-auto font-mono">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    // Nenhum cliente localizado com "{searchQuery}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setNewCustomerForm((prev) => ({ ...prev, name: searchQuery }));
                      setIsNewCustomerModalOpen(true);
                    }}
                    className="btn-engine-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Cadastrar "{searchQuery || "Novo Cliente"}"</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-carbon-800">
                  {searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="p-3 hover:bg-carbon-800/80 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-white truncate flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                          <span className="truncate">{cust.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                          {(cust.phone || cust.whatsapp) && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-lime-400" />
                              {cust.whatsapp || cust.phone}
                            </span>
                          )}
                          {cust.document && (
                            <span className="text-slate-500">
                              CPF/CNPJ: {cust.document}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-carbon-950 text-slate-300 border border-carbon-700 font-bold">
                          {cust.vehicles?.length || 0} carro(s)
                        </span>
                        <ChevronRight className="w-4 h-4 text-lime-400" />
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
        <div className="carbon-card p-4 space-y-3 font-mono">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-lime-400 block">
                // CLIENTE VINCULADO
              </span>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-lime-400" />
                <span>{selectedCustomer.name}</span>
              </h4>
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5 pt-0.5">
                {(selectedCustomer.phone || selectedCustomer.whatsapp) && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Phone className="w-3 h-3 text-lime-400" />
                    {selectedCustomer.whatsapp || selectedCustomer.phone}
                  </span>
                )}
                {selectedCustomer.document && (
                  <span className="text-slate-500">
                    Doc: {selectedCustomer.document}
                  </span>
                )}
                {selectedCustomer.address && (
                  <span className="text-slate-400 truncate max-w-xs">
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
                className="text-xs px-2.5 py-1.5 rounded bg-lime-400/10 hover:bg-lime-400/20 border border-lime-400/30 text-lime-400 font-bold flex items-center gap-1 cursor-pointer transition uppercase"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Novo Carro</span>
              </button>

              <button
                type="button"
                onClick={handleClearCustomer}
                className="text-xs px-2 py-1.5 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 transition cursor-pointer border border-carbon-600 uppercase"
                title="Trocar cliente"
              >
                Trocar
              </button>
            </div>
          </div>

          {/* 2. VEÍCULOS DO CLIENTE SELECIONADO */}
          <div className="pt-2.5 border-t border-carbon-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                <Car className="w-3.5 h-3.5 text-lime-400" />
                <span>Veículos Cadastrados ({selectedCustomer.vehicles?.length || 0}):</span>
              </span>
              <span className="text-[10px] text-slate-500">
                Selecione o veículo para atendimento
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
                      className={`p-3 rounded border cursor-pointer transition flex items-center justify-between gap-3 text-xs ${
                        isSelected
                          ? "bg-lime-400/10 border-lime-400 text-white shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                          : "bg-carbon-950 border-carbon-700 hover:border-carbon-600 text-slate-300"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="mercosul-plate text-xs font-bold">
                            {vh.plate}
                          </span>
                          <span className="font-bold text-white truncate">
                            {vh.model}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{getCategoryLabel(vh.category)}</span>
                          {vh.color && <span>• {vh.color}</span>}
                          {vh.year && <span>• {vh.year}</span>}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded bg-carbon-950 border border-carbon-800 text-center text-xs text-slate-500">
                // Nenhum veículo vinculado. Clique em "+ Novo Carro" acima para cadastrar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRAR NOVO CLIENTE */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="carbon-card w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto bg-carbon-900 border-carbon-700 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <h3 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                <User className="w-4 h-4 text-lime-400" />
                <span>Cadastrar Novo Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Telefone / WhatsApp *
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
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.document}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({ ...prev, document: e.target.value }))
                    }
                    placeholder="Ex: 000.000.000-00"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Endereço / Bairro (opcional)
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.address}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Ex: Águas Claras, DF"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opção de cadastrar veículo junto */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={newCustomerForm.addVehicleNow}
                    onChange={(e) =>
                      setNewCustomerForm((prev) => ({
                        ...prev,
                        addVehicleNow: e.target.checked,
                      }))
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Já cadastrar o veículo deste cliente agora</span>
                </label>

                {newCustomerForm.addVehicleNow && (
                  <div className="space-y-3 animate-in fade-in">
                    {newCustomerForm.vehicles.map((vDraft, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800/60 text-xs">
                          <span className="font-semibold text-blue-400 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5" />
                            <span>Veículo #{idx + 1} {idx === 0 ? "(Principal)" : ""}</span>
                          </span>
                          {newCustomerForm.vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVehicleDraft(idx)}
                              className="text-slate-400 hover:text-red-400 text-[11px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Remover</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Placa do Carro *
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
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Porte / Categoria *
                            </label>
                            <select
                              value={vDraft.category}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "category", e.target.value as any)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Modelo *
                            </label>
                            <input
                              type="text"
                              required={newCustomerForm.addVehicleNow}
                              value={vDraft.model}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "model", e.target.value)
                              }
                              placeholder="Ex: Onix, Corolla, Compass"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Marca (opcional)
                            </label>
                            <input
                              type="text"
                              value={vDraft.brand}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "brand", e.target.value)
                              }
                              placeholder="Ex: Chevrolet, Toyota"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Cor
                            </label>
                            <input
                              type="text"
                              value={vDraft.color}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "color", e.target.value)
                              }
                              placeholder="Ex: Preto, Prata, Branco"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Ano
                            </label>
                            <input
                              type="number"
                              value={vDraft.year}
                              onChange={(e) =>
                                handleUpdateVehicleDraft(idx, "year", e.target.value)
                              }
                              placeholder="Ex: 2023"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddVehicleDraft}
                      className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer bg-slate-900/40 hover:bg-slate-900"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Adicionar outro veículo para este cliente</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-carbon-700">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="btn-engine-start inline-flex items-center gap-2 px-4 py-2 rounded text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {modalSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar e Selecionar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CADASTRAR NOVO VEÍCULO PARA O CLIENTE SELECIONADO */}
      {isNewVehicleModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="carbon-card w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto bg-carbon-900 border-carbon-700 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <div className="space-y-0.5">
                <h3 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                  <Car className="w-4 h-4 text-lime-400" />
                  <span>Cadastrar Veículo</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Para o cliente: <strong className="text-lime-400">{selectedCustomer.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVehicleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewVehicle} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    Placa do Veículo *
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
                    className="form-input-carbon w-full font-mono font-bold uppercase tracking-wider"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                    Se a placa já existir no sistema, será vinculada a este cliente.
                  </span>
                </div>

                <div>
                  <label className="form-label-carbon">
                    Porte / Categoria *
                  </label>
                  <select
                    value={newVehicleForm.category}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    className="form-select-carbon w-full"
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
                  <label className="form-label-carbon">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVehicleForm.model}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="Ex: Corolla, Civic, Onix"
                    className="form-input-carbon w-full"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Marca (opcional)
                  </label>
                  <input
                    type="text"
                    value={newVehicleForm.brand}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    placeholder="Ex: Toyota, Honda, GM"
                    className="form-input-carbon w-full"
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
                    value={newVehicleForm.color}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    placeholder="Ex: Preto, Prata"
                    className="form-input-carbon w-full"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={newVehicleForm.year}
                    onChange={(e) =>
                      setNewVehicleForm((prev) => ({ ...prev, year: e.target.value }))
                    }
                    placeholder="Ex: 2024"
                    className="form-input-carbon w-full font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1c2230]">
                <button
                  type="button"
                  onClick={() => setIsNewVehicleModalOpen(false)}
                  className="px-3.5 py-2 rounded text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="btn-engine-start px-4 py-2 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {modalSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar Veículo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

