"use client";

import { useEffect, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle,
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

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [vehicleCategory, setVehicleCategory] = useState<string>("SEDAN");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/45 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="bg-white border border-[#E7EAE7] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-[#E7EAE7] bg-[#F7F8F6] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#247653] uppercase tracking-wider block">
                Gerenciar Serviços da Ordem
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#252B27] flex items-center gap-2">
                <span>OS #{orderNumber || "---"}</span>
                {plate && (
                  <span className="mercosul-plate text-xs font-bold">
                    {plate}
                  </span>
                )}
                {model && <span className="text-[#737D75] text-xs font-normal">({model})</span>}
              </h2>
              {customerName && (
                <p className="text-xs text-[#737D75] mt-0.5">
                  Cliente: <strong className="text-[#252B27]">{customerName}</strong> • Porte:{" "}
                  <span className="text-[#247653] font-semibold">{vehicleCategory}</span>
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737D75] hover:text-[#252B27] hover:bg-[#E7EAE7]/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#16A36A] text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-[#737D75]">
              <Loader2 className="w-7 h-7 animate-spin text-[#247653]" />
              <p className="text-xs font-medium">Carregando serviços da ordem...</p>
            </div>
          ) : (
            <>
              {/* 1. FORMULÁRIO DE ADIÇÃO RÁPIDA DE SERVIÇO */}
              {orderStatus !== "PAID" ? (
                <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#252B27] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#247653]" />
                      Adicionar novo serviço à Ordem de Serviço
                    </span>
                    <span className="text-[11px] text-[#737D75]">Preço pelo porte {vehicleCategory}</span>
                  </div>

                  <form onSubmit={handleAddService} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-6">
                        <label className="text-xs font-semibold text-[#343C36] block mb-1">
                          Serviço do Catálogo <span className="text-[#DC4C4C]">*</span>
                        </label>
                        <select
                          value={selectedServiceId}
                          onChange={(e) => handleSelectCatalogService(e.target.value)}
                          className="dp-input text-xs"
                          required
                        >
                          <option value="">Selecione um serviço...</option>
                          {catalog.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-[#343C36] block mb-1">
                          Qtd.
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="dp-input text-xs text-center"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-xs font-semibold text-[#343C36] block mb-1">
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
                          className="dp-input text-xs font-bold text-[#247653]"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="submit"
                        disabled={submitting || !selectedServiceId}
                        className="dp-btn-primary text-xs cursor-pointer"
                      >
                        {submitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Incluir Serviço na OS</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-medium">
                  Esta ordem de serviço já foi paga e quitada. Novos itens não podem mais ser adicionados.
                </div>
              )}

              {/* 2. TABELA DE SERVIÇOS ATUAIS NA OS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#252B27] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#247653]" />
                    Serviços Contratados ({items.length})
                  </span>
                  <span className="text-xs text-[#737D75]">
                    Subtotal: <strong className="text-[#252B27]">{formatCurrency(subtotal)}</strong>
                  </span>
                </div>

                <div className="border border-[#E7EAE7] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F7F8F6] text-[#737D75] text-[11px] font-semibold uppercase border-b border-[#E7EAE7]">
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
                    <tbody className="divide-y divide-[#E7EAE7] bg-white">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#737D75] text-xs">
                            Nenhum serviço registrado nesta ordem de serviço.
                          </td>
                        </tr>
                      ) : (
                        items.map((it) => (
                          <tr key={it.id} className="hover:bg-[#F7F8F6] transition">
                            <td className="py-2.5 px-3 font-semibold text-[#252B27]">
                              {it.serviceName}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#343C36]">
                              {it.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#737D75]">
                              {formatCurrency(it.unitPrice)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#247653]">
                              {formatCurrency(it.totalPrice)}
                            </td>
                            {orderStatus !== "PAID" && (
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(it.id)}
                                  disabled={removingItemId === it.id}
                                  className="text-[#9CA49E] hover:text-[#DC4C4C] p-1 transition cursor-pointer disabled:opacity-50"
                                  title="Remover este serviço"
                                >
                                  {removingItemId === it.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DC4C4C]" />
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
              <div className="p-4 rounded-xl bg-[#E9F3EC]/60 border border-[#C6E2D0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-[#343C36]">
                  <div>
                    <span>Subtotal: </span>
                    <strong className="text-[#252B27]">{formatCurrency(subtotal)}</strong>
                  </div>
                  {discount > 0 && (
                    <div>
                      <span>Desconto: </span>
                      <strong className="text-[#D97706]">- {formatCurrency(discount)}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#343C36] font-semibold uppercase text-[11px]">
                    Valor Total da OS:
                  </span>
                  <span className="text-lg font-extrabold text-[#142D26]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-[#E7EAE7] bg-[#F7F8F6] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="dp-btn-secondary text-xs cursor-pointer"
          >
            Concluir e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
