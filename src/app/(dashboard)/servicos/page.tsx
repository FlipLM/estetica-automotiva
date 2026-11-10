"use client";

import { useEffect, useState } from "react";
import {
  Wrench,
  Clock,
  Sparkles,
  Award,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  active: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
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
    active: true,
  });

  async function loadServices() {
    try {
      setLoading(true);
      const res = await fetch("/api/services");
      const json = await res.json();
      setServices(json.services || []);
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
      active: true,
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
      active: serv.active,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" />
            <span>Catálogo de Serviços & Matriz de Preços</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tabela padronizada por porte veicular: Hatch, Sedan, SUV/Picape, Moto e Especial
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat === "ALL" ? "Todos os Serviços" : categoryNames[cat] || cat}
          </button>
        ))}
      </div>

      {/* Tabela da Matriz de Preços */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <p className="text-xs">Carregando catálogo de preços...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Nenhum serviço cadastrado nesta categoria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800/70">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{s.estimatedMinutes} min</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-200">
                      {formatCurrency(s.priceHatch)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-white">
                      {formatCurrency(s.priceSedan)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-blue-400">
                      {formatCurrency(s.priceSuvPickup)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-300">
                      {formatCurrency(s.priceMotorcycle)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-purple-400">
                      {formatCurrency(s.priceSpecial)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.defaultCommission}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Editar preços"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          title="Remover / Desativar"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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

      {/* MODAL DE CADASTRO E EDIÇÃO DE SERVIÇO & PREÇOS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-500" />
                <span>{editingId ? "Editar Serviço & Preços" : "Novo Serviço"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Polimento Técnico 3 Etapas"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as Service["category"] })
                    }
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Descrição dos Procedimentos
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhe o que está incluso no serviço..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* SEÇÃO DA MATRIZ DE PREÇOS */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-slate-200">
                  Matriz de Preços por Porte do Veículo (R$)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Hatch (Pequeno)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceHatch}
                      onChange={(e) => setFormData({ ...formData, priceHatch: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Sedan (Médio)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceSedan}
                      onChange={(e) => setFormData({ ...formData, priceSedan: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">SUV / Picape</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceSuvPickup}
                      onChange={(e) => setFormData({ ...formData, priceSuvPickup: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-blue-400 text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Moto</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceMotorcycle}
                      onChange={(e) => setFormData({ ...formData, priceMotorcycle: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Especial / Van</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.priceSpecial}
                      onChange={(e) => setFormData({ ...formData, priceSpecial: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-purple-400 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* TEMPO ESTIMADO E COMISSÃO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tempo Estimado (minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Comissão Padrão do Operador (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    value={formData.defaultCommission}
                    onChange={(e) => setFormData({ ...formData, defaultCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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

