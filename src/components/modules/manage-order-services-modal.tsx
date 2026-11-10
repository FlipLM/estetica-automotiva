"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Car,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ManageOrderServicesModalProps {
  orderId: string;
  orderNumber?: number;
  plate?: string;
  model?: string;
  customerName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

interface ServiceItem {
  id: string;
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  completed: boolean;
}

interface ServiceCatalogItem {
  id: string;
  name: string;
  category: string;
  priceHatch: number;
  priceSedan: number;
  priceSuvPickup: number;
  priceMotorcycle: number;
  priceSpecial: number;
  estimatedMinutes: number;
}

export function ManageOrderServicesModal({
  orderId,
  orderNumber,
  plate,
  model,
  customerName,
  isOpen,
  onClose,
  onOrderUpdated,
}: ManageOrderServicesModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dados da OS
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [vehicleCategory, setVehicleCategory] = useState<string>("SEDAN");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Catálogo de Serviços
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const [resItems, resCatalog] = await Promise.all([
          fetch(`/api/orders/${orderId}/items`),
          fetch("/api/services?active=true"),
        ]);

        const jsonItems = await resItems.json();
        const jsonCatalog = await resCatalog.json();

        if (!resItems.ok) {
          throw new Error(jsonItems.error || "Erro ao carregar serviços da OS.");
        }

        setItems(jsonItems.items || []);
        setVehicleCategory(jsonItems.vehicle?.category || "SEDAN");
        setOrderStatus(jsonItems.status || "");
        setSubtotal(jsonItems.subtotal || 0);
        setDiscount(jsonItems.discount || 0);
        setTotalAmount(jsonItems.totalAmount || 0);

        setCatalog(jsonCatalog.services || []);
      } catch (err: any) {
        setError(err.message || "Falha ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, orderId]);

  // Atualiza preço sugerido automaticamente quando seleciona o serviço
  function handleSelectCatalogService(serviceId: string) {
    setSelectedServiceId(serviceId);
    if (!serviceId) {
      setCustomPrice("");
      return;
    }

    const serv = catalog.find((s) => s.id === serviceId);
    if (!serv) return;

    let autoPrice = serv.priceSedan;
    switch (vehicleCategory) {
      case "HATCH":
        autoPrice = serv.priceHatch;
        break;
      case "SEDAN":
        autoPrice = serv.priceSedan;
        break;
      case "SUV_PICKUP":
        autoPrice = serv.priceSuvPickup;
        break;
      case "MOTORCYCLE":
        autoPrice = serv.priceMotorcycle;
        break;
      case "SPECIAL_UTILITY":
        autoPrice = serv.priceSpecial;
        break;
      default:
        autoPrice = serv.priceSedan;
    }

    setCustomPrice(autoPrice);
  }

  // Adicionar novo serviço à OS
  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServiceId) {
      setError("Selecione um serviço para adicionar.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          quantity: Number(quantity) || 1,
          unitPrice: customPrice !== "" ? Number(customPrice) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao adicionar serviço.");
      }

      setItems(data.order.items || []);
      setSubtotal(data.order.subtotal || 0);
      setDiscount(data.order.discount || 0);
      setTotalAmount(data.order.totalAmount || 0);

      // Limpa seleção
      setSelectedServiceId("");
      setCustomPrice("");
      setQuantity(1);
      setSuccessMsg(data.message || "Novo serviço adicionado com sucesso!");

      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao adicionar serviço.");
    } finally {
      setSubmitting(false);
    }
  }

  // Remover serviço da OS
  async function handleRemoveItem(itemId: string) {
    if (!confirm("Tem certeza que deseja remover este serviço da ordem de serviço?")) {
      return;
    }

    setRemovingItemId(itemId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/items?itemId=${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao remover item.");
      }

      setItems(data.order.items || []);
      setSubtotal(data.order.subtotal || 0);
      setDiscount(data.order.discount || 0);
      setTotalAmount(data.order.totalAmount || 0);
      setSuccessMsg("Serviço removido com sucesso.");

      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || "Falha ao remover item.");
    } finally {
      setRemovingItemId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="carbon-card border-carbon-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-carbon-700 bg-carbon-900/90 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-carbon-950 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="led-pulse-lime" />
                <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
                  // ADICIONAR SERVIÇOS À OS ATIVA
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>OS #{orderNumber || "---"}</span>
                {plate && (
                  <span className="text-lime-400 font-mono text-sm px-2 py-0.5 rounded bg-lime-500/10 border border-lime-500/30">
                    {plate}
                  </span>
                )}
                {model && <span className="text-slate-400 text-xs font-normal">({model})</span>}
              </h2>
              {customerName && (
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Cliente: <strong className="text-slate-200">{customerName}</strong> • Categoria:{" "}
                  <span className="text-lime-400 font-bold">{vehicleCategory}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-carbon-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Mensagens de Feedback */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-lime-500/10 border border-lime-500/30 text-lime-400 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
              <Loader2 className="w-7 h-7 animate-spin text-lime-400" />
              <p className="text-xs uppercase tracking-wider">CARREGANDO SERVIÇOS DA OS...</p>
            </div>
          ) : (
            <>
              {/* 1. FORMULÁRIO DE ADIÇÃO RÁPIDA DE SERVIÇO */}
              {orderStatus !== "PAID" ? (
                <div className="p-4 rounded-lg bg-carbon-950 border border-carbon-700 space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-lime-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Cliente solicitou novo serviço? Adicione agora:
                    </span>
                    <span className="text-[10px] text-slate-400">Preço pelo porte {vehicleCategory}</span>
                  </div>

                  <form onSubmit={handleAddService} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      {/* Seletor do Serviço */}
                      <div className="sm:col-span-6">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Serviço do Catálogo *
                        </label>
                        <select
                          value={selectedServiceId}
                          onChange={(e) => handleSelectCatalogService(e.target.value)}
                          className="form-select-carbon w-full text-xs"
                          required
                        >
                          <option value="">Selecione um serviço...</option>
                          {catalog.map((s) => (
                            <option key={s.id} value={s.id} className="bg-carbon-900 text-white">
                              {s.name} ({s.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantidade */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Qtd.
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="form-input-carbon w-full text-xs text-center font-mono"
                        />
                      </div>

                      {/* Preço Unitário Aplicado */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                          Valor Unitário (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customPrice}
                          onChange={(e) =>
                            setCustomPrice(e.target.value === "" ? "" : parseFloat(e.target.value))
                          }
                          placeholder="R$ 0,00"
                          className="form-input-carbon w-full text-xs font-mono text-lime-400 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="submit"
                        disabled={submitting || !selectedServiceId}
                        className="btn-engine-start px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                        <span>INCLUIR SERVIÇO NA OS</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-3 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono">
                  Esta ordem de serviço já foi quitada. Itens não podem mais ser adicionados.
                </div>
              )}

              {/* 2. TABELA DE SERVIÇOS ATUAIS NA OS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-lime-400" />
                    Serviços Contratados ({items.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Subtotal: <strong className="text-white">{formatCurrency(subtotal)}</strong>
                  </span>
                </div>

                <div className="border border-carbon-700 rounded-lg overflow-hidden font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-carbon-950 text-slate-400 text-[10px] uppercase border-b border-carbon-700">
                      <tr>
                        <th className="py-2.5 px-3">Serviço</th>
                        <th className="py-2.5 px-3 text-center w-16">Qtd</th>
                        <th className="py-2.5 px-3 text-right">Unitário</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        {orderStatus !== "PAID" && (
                          <th className="py-2.5 px-2 text-center w-10"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-carbon-800 bg-carbon-900/50">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                            Nenhum serviço registrado nesta ordem de serviço.
                          </td>
                        </tr>
                      ) : (
                        items.map((it) => (
                          <tr key={it.id} className="hover:bg-carbon-800/40 transition">
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {it.serviceName}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-300">
                              {it.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400">
                              {formatCurrency(it.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-lime-400">
                              {formatCurrency(it.totalPrice)}
                            </td>
                            {orderStatus !== "PAID" && (
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(it.id)}
                                  disabled={removingItemId === it.id}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer disabled:opacity-50"
                                  title="Remover este serviço"
                                >
                                  {removingItemId === it.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. RESUMO FINANCEIRO TOTALIZADOR */}
              <div className="p-3.5 rounded-lg bg-carbon-950 border border-carbon-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-4 text-slate-400">
                  <div>
                    <span>Subtotal: </span>
                    <strong className="text-white">{formatCurrency(subtotal)}</strong>
                  </div>
                  {discount > 0 && (
                    <div>
                      <span>Desconto: </span>
                      <strong className="text-amber-400">- {formatCurrency(discount)}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider">
                    Valor Total da OS:
                  </span>
                  <span className="text-lg font-black text-lime-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-carbon-700 bg-carbon-900/90 flex items-center justify-end font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            CONCLUIR & FECHAR
          </button>
        </div>
      </div>
    </div>
  );
}

