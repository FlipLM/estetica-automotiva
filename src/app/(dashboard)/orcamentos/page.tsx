"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Share2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Printer,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  DollarSign,
  Car,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import CustomerVehicleSelector from "@/components/modules/customer-vehicle-selector";

interface ServiceItem {
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface Budget {
  id: string;
  orderNumber: number;
  status: string;
  subtotal: number | null;
  discount: number | null;
  totalAmount: number | null;
  notes?: string;
  createdAt: string;
  vehicle: {
    id: string;
    plate: string;
    model: string;
    brand?: string;
    category: string;
    customer: {
      name: string;
      phone?: string;
      whatsapp?: string;
    };
  };
  items: ServiceItem[];
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    Array<{ serviceId: string; quantity: number; unitPrice: number; name: string }>
  >([]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const [resBudgets, resVehicles, resServices] = await Promise.all([
        fetch("/api/orders?isBudget=true"),
        fetch("/api/vehicles"),
        fetch("/api/services?active=true"),
      ]);

      const jsonBudgets = await resBudgets.json();
      const jsonVehicles = await resVehicles.json();
      const jsonServices = await resServices.json();

      setBudgets(jsonBudgets.orders || []);
      setVehicles(jsonVehicles.vehicles || []);
      setServicesCatalog(jsonServices.services || []);
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Quando o veículo é selecionado, recalcula os preços dos itens adicionados conforme o porte
  function handleSelectVehicle(vehicleId: string, vehicleObj?: any) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicleObj || vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    if (!vehicle) return;

    // Recalcula preços dos itens já selecionados com base no porte
    setSelectedItems((prev) =>
      prev.map((item) => {
        const serv = servicesCatalog.find((s) => s.id === item.serviceId);
        if (!serv) return item;
        return {
          ...item,
          unitPrice: getPriceForCategory(serv, vehicle.category),
        };
      })
    );
  }

  function getPriceForCategory(service: any, category: string): number {
    switch (category) {
      case "HATCH":
        return service.priceHatch;
      case "SEDAN":
        return service.priceSedan;
      case "SUV_PICKUP":
        return service.priceSuvPickup;
      case "MOTORCYCLE":
        return service.priceMotorcycle;
      case "SPECIAL_UTILITY":
        return service.priceSpecial;
      default:
        return service.priceSedan;
    }
  }

  function handleAddService(serviceId: string) {
    if (!serviceId) return;
    const serv = servicesCatalog.find((s) => s.id === serviceId);
    if (!serv) return;

    const vehicle = selectedVehicle || vehicles.find((v) => v.id === selectedVehicleId);
    const category = vehicle?.category || "SEDAN";
    const price = getPriceForCategory(serv, category);

    setSelectedItems((prev) => [
      ...prev,
      {
        serviceId: serv.id,
        name: serv.name,
        quantity: 1,
        unitPrice: price,
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = selectedItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  async function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicleId) {
      setError("Selecione o veículo do cliente.");
      return;
    }
    if (selectedItems.length === 0) {
      setError("Adicione pelo menos um serviço ao orçamento.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          status: "BUDGET_PENDING",
          discount,
          notes,
          items: selectedItems.map((i) => ({
            serviceId: i.serviceId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar orçamento.");
      }

      setModalOpen(false);
      setSelectedVehicleId("");
      setSelectedVehicle(null);
      setSelectedItems([]);
      setDiscount(0);
      setNotes("");
      loadData();
    } catch (err: any) {
      setError(err.message || "Falha na conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConvertInOS(budgetId: string, orderNumber: number) {
    if (!confirm(`Deseja aprovar e converter o Orçamento #${orderNumber} em Ordem de Serviço no Pátio?`)) return;

    try {
      const res = await fetch(`/api/orders/${budgetId}/convert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao converter.");
        return;
      }
      alert("Sucesso! Orçamento convertido e veículo adicionado à coluna 'Para Fazer' do Pátio.");
      loadData();
    } catch (e) {
      console.error(e);
      alert("Erro ao converter orçamento.");
    }
  }

  function sendWhatsAppProposal(b: Budget) {
    const customer = b.vehicle.customer;
    if (!customer) {
      alert("Cliente não encontrado para este veículo.");
      return;
    }
    const phone = customer.whatsapp || customer.phone;
    if (!phone) {
      alert("Cliente sem WhatsApp cadastrado.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const servicesList = b.items
      .map((it) => `- ${it.serviceName}: ${formatCurrency(it.unitPrice || 0)}`)
      .join("%0A");

    const text = `Olá, *${customer.name}*!%0A%0ASegue a proposta de orçamento para o seu *${b.vehicle.brand || ""} ${b.vehicle.model}* (Placa: *${b.vehicle.plate}*):%0A%0A*Serviços Inclusos:*%0A${servicesList}%0A%0A*Valor Total:* ${formatCurrency(b.totalAmount || 0)}%0A%0APodemos confirmar o agendamento? Ficamos à sua disposição!`;

    window.open(`https://wa.me/${formattedPhone}?text=${text}`, "_blank");
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="led-pulse-lime"></span>
            <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
              // COMERCIAL & PROPOSTAS
            </span>
          </div>
          <h1 className="text-xl font-black tracking-wide text-white uppercase flex items-center gap-2 font-mono">
            <FileSpreadsheet className="w-5 h-5 text-lime-400" />
            <span>Orçamentos & Propostas Comerciais</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Crie propostas rápidas, envie orçamentos via WhatsApp e converta em Ordem de Serviço em 1 clique
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="btn-engine-start px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* Grid de Orçamentos */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <p className="text-xs">Carregando orçamentos...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
          Nenhum orçamento pendente. Clique em "Novo Orçamento" para gerar uma proposta comercial.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const isConverted = !b.status.startsWith("BUDGET");
            return (
              <div
                key={b.id}
                className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 shadow-sm transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        Orçamento #{b.orderNumber}
                      </span>
                      <span className="text-base font-bold text-white tracking-wide block">
                        {b.vehicle.plate}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        b.status === "BUDGET_PENDING"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {b.status === "BUDGET_PENDING" ? "Pendente" : "Convertido em OS"}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200">
                    {b.vehicle.brand} {b.vehicle.model} ({b.vehicle.category})
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Cliente: {b.vehicle.customer?.name || "Não informado"}</p>

                  {/* Itens Inclusos */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Serviços ({b.items.length})
                    </p>
                    {b.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[170px]">{it.serviceName}</span>
                        {it.unitPrice !== null && (
                          <span className="font-medium text-slate-400">
                            {formatCurrency(it.unitPrice * (it.quantity || 1))}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {b.totalAmount !== null && (
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Total da Proposta:</span>
                      <span className="text-base font-bold text-emerald-400">
                        {formatCurrency(b.totalAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações do Card */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => sendWhatsAppProposal(b)}
                      className="px-2.5 py-1 rounded bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>

                    <Link
                      href={`/orcamentos/${b.id}`}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-all"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Ver / PDF</span>
                    </Link>
                  </div>

                  {b.status === "BUDGET_PENDING" && (
                    <button
                      onClick={() => handleConvertInOS(b.id, b.orderNumber)}
                      className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Converter em OS (Mover p/ Pátio)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE NOVO ORÇAMENTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="carbon-card border border-[#2b354c] w-full max-w-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2230]">
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-lime-400" />
                <span>Elaborar Novo Orçamento</span>
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
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateBudget} className="space-y-4">
              {/* Seleção do Carro & Cliente com Busca */}
              <CustomerVehicleSelector
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={(vehId, vehObj) => handleSelectVehicle(vehId, vehObj)}
              />

              {/* Adicionar Serviços */}
              <div className="space-y-2">
                <label className="form-label-carbon">
                  2. Adicionar Serviços à Proposta
                </label>
                <select
                  disabled={!selectedVehicleId}
                  onChange={(e) => {
                    handleAddService(e.target.value);
                    e.target.value = "";
                  }}
                  className="form-select-carbon w-full disabled:opacity-50"
                >
                  <option value="">+ Clique para adicionar um serviço do catálogo...</option>
                  {servicesCatalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabela de Itens Selecionados */}
              {selectedItems.length > 0 && (
                <div className="border border-[#1c2230] rounded overflow-hidden text-xs font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-[#0c0e14] text-slate-400 text-[10px] uppercase border-b border-[#1c2230]">
                      <tr>
                        <th className="py-2 px-3">Serviço</th>
                        <th className="py-2 px-3 text-right">Preço Unit. (Porte)</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c2230]">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#121620]">
                          <td className="py-2 px-3 font-medium text-white">{item.name}</td>
                          <td className="py-2 px-3 text-right text-slate-300">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-lime-400 font-mono">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Desconto e Totais */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1c2230]">
                <div>
                  <label className="form-label-carbon">
                    Desconto Especial (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="form-input-carbon w-full font-mono"
                  />
                </div>

                <div className="flex flex-col justify-end text-right">
                  <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Total Final:</p>
                  <p className="text-xl font-black text-lime-400 font-mono">{formatCurrency(total)}</p>
                </div>
              </div>

              <div>
                <label className="form-label-carbon">
                  Condições de Pagamento / Notas da Proposta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento em até 3x sem juros no cartão ou 5% no PIX. Validade: 10 dias."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input-carbon w-full"
                />
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
                  <span>Salvar Orçamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

