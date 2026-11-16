"use client";

import { useEffect, useState } from "react";
import {
  Wrench,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductOption {
  id: string;
  name: string;
  unit: string;
  costPrice: number;
  currentStock: number;
}

interface ServiceRecipe {
  id?: string;
  productId: string;
  quantityPerService: number;
  notes?: string | null;
  product?: ProductOption;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  category: "LAVAGEM" | "HIGIENIZACAO" | "POLIMENTO" | "PROTECAO" | "OUTROS";
  estimatedMinutes: number;
  priceHatch: number;
  priceSedan: number;
  priceSuvPickup: number;
  priceMotorcycle: number;
  priceSpecial: number;
  estimatedCost: number;
  defaultCommission: number;
  maintenanceIntervalDays?: number | null;
  active: boolean;
  recipes?: ServiceRecipe[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "LAVAGEM" as Service["category"],
    estimatedMinutes: 60,
    priceHatch: 80,
    priceSedan: 100,
    priceSuvPickup: 130,
    priceMotorcycle: 50,
    priceSpecial: 160,
    estimatedCost: 15,
    defaultCommission: 15,
    maintenanceIntervalDays: "" as string | number,
    active: true,
    recipes: [] as Array<{ productId: string; quantityPerService: number; notes: string }>,
  });

  async function loadServices() {
    try {
      setLoading(true);
      const [servRes, prodRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/products"),
      ]);
      const json = await servRes.json();
      setServices(json.services || []);
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setProducts(prodJson.products || []);
      }
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      category: "LAVAGEM",
      estimatedMinutes: 60,
      priceHatch: 80,
      priceSedan: 100,
      priceSuvPickup: 130,
      priceMotorcycle: 50,
      priceSpecial: 160,
      estimatedCost: 15,
      defaultCommission: 15,
      maintenanceIntervalDays: "",
      active: true,
      recipes: [],
    });
    setError(null);
    setModalOpen(true);
  }

  function handleOpenEdit(serv: Service) {
    setEditingId(serv.id);
    setFormData({
      name: serv.name,
      description: serv.description || "",
      category: serv.category,
      estimatedMinutes: serv.estimatedMinutes,
      priceHatch: serv.priceHatch,
      priceSedan: serv.priceSedan,
      priceSuvPickup: serv.priceSuvPickup,
      priceMotorcycle: serv.priceMotorcycle,
      priceSpecial: serv.priceSpecial,
      estimatedCost: serv.estimatedCost,
      defaultCommission: serv.defaultCommission,
      maintenanceIntervalDays:
        serv.maintenanceIntervalDays != null ? String(serv.maintenanceIntervalDays) : "",
      active: serv.active,
      recipes: (serv.recipes || []).map((r) => ({
        productId: r.productId,
        quantityPerService: r.quantityPerService,
        notes: r.notes || "",
      })),
    });
    setError(null);
    setModalOpen(true);
  }

  function addRecipeRow() {
    const firstAvailable = products.find(
      (p) => !formData.recipes.some((r) => r.productId === p.id)
    );
    if (!firstAvailable) return;
    setFormData((prev) => ({
      ...prev,
      recipes: [
        ...prev.recipes,
        { productId: firstAvailable.id, quantityPerService: 50, notes: "" },
      ],
    }));
  }

  function updateRecipeRow(
    index: number,
    patch: Partial<{ productId: string; quantityPerService: number; notes: string }>
  ) {
    setFormData((prev) => {
      const next = [...prev.recipes];
      next[index] = { ...next[index], ...patch };
      return { ...prev, recipes: next };
    });
  }

  function removeRecipeRow(index: number) {
    setFormData((prev) => ({
      ...prev,
      recipes: prev.recipes.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        maintenanceIntervalDays:
          String(formData.maintenanceIntervalDays).trim() !== ""
            ? parseInt(String(formData.maintenanceIntervalDays), 10)
            : null,
        recipes: formData.recipes
          .filter((r) => r.productId && r.quantityPerService > 0)
          .map((r) => ({
            productId: r.productId,
            quantityPerService: Number(r.quantityPerService),
            notes: r.notes?.trim() || null,
          })),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar serviço.");
      }

      setModalOpen(false);
      loadServices();
    } catch (err: any) {
      setError(err.message || "Falha na conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deseja remover ou desativar o serviço "${name}"?`)) return;

    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao excluir serviço.");
        return;
      }
      loadServices();
    } catch (e) {
      console.error(e);
      alert("Erro ao remover serviço.");
    }
  }

  const filteredServices =
    selectedCategory === "ALL"
      ? services
      : services.filter((s) => s.category === selectedCategory);

  const categoryNames: Record<string, string> = {
    LAVAGEM: "Lavagens & Detalhamento",
    HIGIENIZACAO: "Higienização & Oxi-Sanitização",
    POLIMENTO: "Polimentos & Correção",
    PROTECAO: "Vitrificação & Proteção",
    OUTROS: "Outros Serviços",
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white border border-[#E7EAE7] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#252B27]">
              Catálogo de Serviços e Preços
            </h1>
            <p className="text-xs text-[#737D75] mt-0.5">
              Tabela padronizada por porte veicular: Hatch, Sedan, SUV/Picape, Moto e Especial
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="dp-btn-primary text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Filtros de Categoria */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "LAVAGEM", "HIGIENIZACAO", "POLIMENTO", "PROTECAO"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-[#247653] text-white shadow-xs"
                : "bg-white text-[#737D75] hover:bg-[#F7F8F6] hover:text-[#252B27] border border-[#E7EAE7]"
            }`}
          >
            {cat === "ALL" ? "Todos os Serviços" : categoryNames[cat] || cat}
          </button>
        ))}
      </div>

      {/* Tabela da Matriz de Preços */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#737D75]">
            <Loader2 className="w-7 h-7 animate-spin text-[#247653]" />
            <p className="text-xs font-medium">Carregando catálogo de preços...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-[#737D75] text-xs">
            Nenhum serviço cadastrado nesta categoria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8F6] text-[#737D75] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E7EAE7]">
                <tr>
                  <th className="py-3 px-4">Serviço</th>
                  <th className="py-3 px-4 text-center">Tempo Est.</th>
                  <th className="py-3 px-3 text-right">Pequeno (Hatch)</th>
                  <th className="py-3 px-3 text-right">Médio (Sedan)</th>
                  <th className="py-3 px-3 text-right">Grande (SUV/Picape)</th>
                  <th className="py-3 px-3 text-right">Moto</th>
                  <th className="py-3 px-3 text-right">Especial</th>
                  <th className="py-3 px-4 text-center">Comissão</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAE7]">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7F8F6] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#252B27]">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-[#737D75] line-clamp-1 max-w-sm">
                          {s.description}
                        </div>
                      )}
                      {s.maintenanceIntervalDays && (
                        <div className="text-[10px] font-medium text-[#247653] mt-0.5">
                          Lembrete de retorno CRM: a cada {s.maintenanceIntervalDays} dias
                        </div>
                      )}
                      {s.recipes && s.recipes.length > 0 && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#343C36] bg-[#F1F3F1] px-2 py-0.5 rounded-full mt-1">
                          <Package className="w-3 h-3 text-[#247653]" />
                          <span>
                            Ficha Técnica: {s.recipes.length}{" "}
                            {s.recipes.length === 1 ? "insumo" : "insumos"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-[#343C36]">
                        <Clock className="w-3.5 h-3.5 text-[#737D75]" />
                        <span>{s.estimatedMinutes} min</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-[#343C36]">
                      {formatCurrency(s.priceHatch)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-[#252B27]">
                      {formatCurrency(s.priceSedan)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#247653]">
                      {formatCurrency(s.priceSuvPickup)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-[#343C36]">
                      {formatCurrency(s.priceMotorcycle)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-[#142D26]">
                      {formatCurrency(s.priceSpecial)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0]">
                        {s.defaultCommission}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Editar preços"
                          className="p-1.5 rounded-lg hover:bg-[#E9F3EC] text-[#737D75] hover:text-[#247653] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          title="Remover / Desativar"
                          className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#737D75] hover:text-[#DC4C4C] transition-colors cursor-pointer"
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

      {/* MODAL DE CADASTRO E EDIÇÃO DE SERVIÇO & PREÇOS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7EAE7] rounded-2xl w-full max-w-xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
              <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#247653]" />
                <span>{editingId ? "Editar Serviço e Preços" : "Cadastrar Novo Serviço"}</span>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Nome do Serviço <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Polimento Técnico 3 Etapas"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Categoria <span className="text-[#DC4C4C]">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as Service["category"] })
                    }
                    className="dp-input"
                  >
                    <option value="LAVAGEM">Lavagem</option>
                    <option value="HIGIENIZACAO">Higienização</option>
                    <option value="POLIMENTO">Polimento</option>
                    <option value="PROTECAO">Proteção / Vitrificação</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Descrição dos Procedimentos
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhe o que está incluso no serviço..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="dp-input"
                />
              </div>

              {/* SEÇÃO DA MATRIZ DE PREÇOS */}
              <div className="p-4 bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl space-y-3">
                <p className="text-xs font-bold text-[#252B27]">
                  Matriz de Preços por Porte do Veículo (R$)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#343C36] mb-1">Hatch</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceHatch}
                      onChange={(e) => setFormData({ ...formData, priceHatch: parseFloat(e.target.value) || 0 })}
                      className="dp-input font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#343C36] mb-1">Sedan</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceSedan}
                      onChange={(e) => setFormData({ ...formData, priceSedan: parseFloat(e.target.value) || 0 })}
                      className="dp-input font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#343C36] mb-1">SUV/Picape</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceSuvPickup}
                      onChange={(e) => setFormData({ ...formData, priceSuvPickup: parseFloat(e.target.value) || 0 })}
                      className="dp-input font-bold text-[#247653]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#343C36] mb-1">Moto</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceMotorcycle}
                      onChange={(e) => setFormData({ ...formData, priceMotorcycle: parseFloat(e.target.value) || 0 })}
                      className="dp-input font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#343C36] mb-1">Especial</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceSpecial}
                      onChange={(e) => setFormData({ ...formData, priceSpecial: parseFloat(e.target.value) || 0 })}
                      className="dp-input font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* TEMPO ESTIMADO, COMISSÃO E CICLO DE RETORNO CRM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Tempo Estimado (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 0 })}
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Comissão Padrão (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    value={formData.defaultCommission}
                    onChange={(e) => setFormData({ ...formData, defaultCommission: parseFloat(e.target.value) || 0 })}
                    className="dp-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Retorno / Manutenção (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    placeholder="Ex: 180 (opcional)"
                    value={formData.maintenanceIntervalDays}
                    onChange={(e) => setFormData({ ...formData, maintenanceIntervalDays: e.target.value })}
                    className="dp-input"
                  />
                </div>
              </div>

              {/* FICHA TÉCNICA DE INSUMOS (BOM) */}
              <div className="p-4 bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#252B27] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#247653]" />
                      Ficha Técnica de Insumos (Consumo Padrão por OS)
                    </p>
                    <p className="text-[11px] text-[#737D75]">
                      Sugere automaticamente a baixa no estoque quando este serviço for executado em uma OS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRecipeRow}
                    disabled={products.length === 0 || formData.recipes.length >= products.length}
                    className="dp-btn-secondary text-[11px] px-2.5 py-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Vincular Insumo</span>
                  </button>
                </div>

                {formData.recipes.length === 0 ? (
                  <p className="text-[11px] text-[#737D75] italic">
                    Nenhum insumo vinculado ainda. Opcional — ideal para controle real de compostos, ceras, vitrificadores e shampoos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.recipes.map((recipe, idx) => {
                      const prod = products.find((p) => p.id === recipe.productId);
                      const rowCost = (prod?.costPrice || 0) * (recipe.quantityPerService || 0);
                      return (
                        <div
                          key={`${recipe.productId}-${idx}`}
                          className="grid grid-cols-12 gap-2 items-center bg-white border border-[#E7EAE7] rounded-lg p-2"
                        >
                          <div className="col-span-5">
                            <select
                              value={recipe.productId}
                              onChange={(e) => updateRecipeRow(idx, { productId: e.target.value })}
                              className="dp-input text-xs py-1.5"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.unit})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={recipe.quantityPerService}
                              onChange={(e) =>
                                updateRecipeRow(idx, {
                                  quantityPerService: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="dp-input text-xs py-1.5 text-right font-semibold"
                              title={`Quantidade em ${prod?.unit || "un"}`}
                            />
                          </div>
                          <div className="col-span-3 text-right">
                            <span className="text-[11px] font-semibold text-[#247653]">
                              {formatCurrency(rowCost)}
                            </span>
                            <span className="block text-[10px] text-[#737D75]">
                              {prod?.unit || ""}
                            </span>
                          </div>
                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => removeRecipeRow(idx)}
                              className="p-1.5 text-[#737D75] hover:text-[#DC4C4C] cursor-pointer"
                              title="Remover insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-[#737D75]">Custo estimado pela ficha técnica:</span>
                      <span className="font-bold text-[#142D26]">
                        {formatCurrency(
                          formData.recipes.reduce((acc, r) => {
                            const prod = products.find((p) => p.id === r.productId);
                            return acc + (prod?.costPrice || 0) * (r.quantityPerService || 0);
                          }, 0)
                        )}
                      </span>
                    </div>
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
                  <span>{editingId ? "Atualizar Serviço" : "Salvar Serviço"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
