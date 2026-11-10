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

              {/* TEMPO ESTIMADO E COMISSÃO */}
              <div className="grid grid-cols-2 gap-3">
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
                    className="dp-input"
                  />
                </div>
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
