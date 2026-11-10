"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Share2,
  ArrowRight,
  Eye,
  X,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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

  function handleSelectVehicle(vehicleId: string, vehicleObj?: any) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicleObj || vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    if (!vehicle) return;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white border border-[#E7EAE7] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#252B27]">
              Orçamentos e Propostas Comerciais
            </h1>
            <p className="text-xs text-[#737D75] mt-0.5">
              Crie propostas rápidas, envie orçamentos via WhatsApp e converta em Ordem de Serviço em 1 clique
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
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* Grid de Orçamentos */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#737D75] bg-white border border-[#E7EAE7] rounded-xl">
          <Loader2 className="w-7 h-7 animate-spin text-[#247653]" />
          <p className="text-xs font-medium">Carregando orçamentos...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white border border-[#E7EAE7] rounded-xl p-12 text-center text-[#737D75] text-xs space-y-2 shadow-xs">
          <FileSpreadsheet className="w-8 h-8 text-[#9CA49E] mx-auto" />
          <p className="font-semibold text-[#252B27]">Nenhum orçamento pendente</p>
          <p>Clique em &ldquo;Novo Orçamento&rdquo; para gerar uma proposta comercial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-[#E7EAE7] hover:border-[#247653]/50 rounded-xl p-4 shadow-xs transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[#737D75] block mb-0.5">
                      Orçamento #{b.orderNumber}
                    </span>
                    <span className="mercosul-plate text-xs font-bold inline-block">
                      {b.vehicle.plate}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      b.status === "BUDGET_PENDING"
                        ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                        : "bg-[#ECFDF5] text-[#16A36A] border-[#A7F3D0]"
                    }`}
                  >
                    {b.status === "BUDGET_PENDING" ? "Pendente" : "Convertido em OS"}
                  </span>
                </div>

                <p className="text-xs font-bold text-[#252B27] mt-2">
                  {b.vehicle.brand} {b.vehicle.model} ({b.vehicle.category})
                </p>
                <p className="text-xs text-[#737D75] mt-0.5">
                  Cliente: <strong className="text-[#343C36]">{b.vehicle.customer?.name || "Não informado"}</strong>
                </p>

                {/* Itens Inclusos */}
                <div className="mt-3 pt-3 border-t border-[#E7EAE7] space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#737D75]">
                    Serviços ({b.items.length})
                  </p>
                  {b.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-[#343C36]">
                      <span className="truncate max-w-[170px]">{it.serviceName}</span>
                      {it.unitPrice !== null && (
                        <span className="font-semibold text-[#252B27]">
                          {formatCurrency(it.unitPrice * (it.quantity || 1))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {b.totalAmount !== null && (
                  <div className="mt-3 pt-2.5 border-t border-[#E7EAE7] flex items-center justify-between text-xs">
                    <span className="text-[#737D75] font-medium">Total da Proposta:</span>
                    <span className="text-base font-extrabold text-[#247653]">
                      {formatCurrency(b.totalAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações do Card */}
              <div className="pt-3 border-t border-[#E7EAE7] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => sendWhatsAppProposal(b)}
                    className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#16A36A] border border-[#A7F3D0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <Link
                    href={`/orcamentos/${b.id}`}
                    className="dp-btn-secondary py-1.5 px-3 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Ver / PDF</span>
                  </Link>
                </div>

                {b.status === "BUDGET_PENDING" && (
                  <button
                    onClick={() => handleConvertInOS(b.id, b.orderNumber)}
                    className="dp-btn-primary w-full py-2 text-xs cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Converter em OS (Mover p/ Pátio)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE NOVO ORÇAMENTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E7EAE7] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#247653]" />
                <span>Elaborar Novo Orçamento</span>
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
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#343C36]">
                  2. Adicionar Serviços à Proposta
                </label>
                <select
                  disabled={!selectedVehicleId}
                  onChange={(e) => {
                    handleAddService(e.target.value);
                    e.target.value = "";
                  }}
                  className="dp-input disabled:opacity-50"
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
                <div className="border border-[#E7EAE7] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F7F8F6] text-[#737D75] text-[11px] font-semibold uppercase border-b border-[#E7EAE7]">
                      <tr>
                        <th className="py-2.5 px-3">Serviço</th>
                        <th className="py-2.5 px-3 text-right">Preço Unit. (Porte)</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAE7] bg-white">
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#F7F8F6]">
                          <td className="py-2.5 px-3 font-semibold text-[#252B27]">{item.name}</td>
                          <td className="py-2.5 px-3 text-right text-[#737D75]">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#247653]">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-[#9CA49E] hover:text-[#DC4C4C] p-1"
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
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E7EAE7]">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Desconto Especial (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="dp-input"
                  />
                </div>

                <div className="flex flex-col justify-end text-right p-3 rounded-xl bg-[#E9F3EC]/60 border border-[#C6E2D0]">
                  <p className="text-[11px] font-semibold text-[#343C36] uppercase">Total Final:</p>
                  <p className="text-xl font-extrabold text-[#142D26]">{formatCurrency(total)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Condições de Pagamento / Notas da Proposta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento em até 3x sem juros no cartão ou 5% no PIX. Validade: 10 dias."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="dp-input"
                />
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
