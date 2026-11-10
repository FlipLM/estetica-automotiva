"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Gauge,
  Sparkles,
  Droplets,
  Wrench,
  Car,
} from "lucide-react";

interface WorkBay {
  id: string;
  name: string;
  type: string;
  description?: string;
  color?: string;
  capacity: number;
  active: boolean;
  occupiedCount?: number;
  availableSlots?: number;
  isFull?: boolean;
  currentOrders?: Array<{
    id: string;
    orderNumber: number;
    status: string;
    plate: string;
    model: string;
  }>;
  createdAt: string;
}

const BOX_TYPES = [
  { id: "LAVAGEM", label: "Lavagem & Descontaminação", icon: Droplets, defaultColor: "#38bdf8" },
  { id: "POLIMENTO", label: "Polimento & Vitrificação", icon: Sparkles, defaultColor: "#a3e635" },
  { id: "HIGIENIZACAO", label: "Higienização & Detailing Interno", icon: Wrench, defaultColor: "#fbbf24" },
  { id: "RAMPA", label: "Rampa & Limpeza de Chassi", icon: Car, defaultColor: "#c084fc" },
  { id: "GERAL", label: "Box Multiuso / Geral", icon: Layers, defaultColor: "#94a3b8" },
];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<WorkBay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<WorkBay | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "LAVAGEM",
    color: "#a3e635",
    capacity: 1,
    description: "",
    active: true,
  });

  async function loadBoxes() {
    try {
      setLoading(true);
      const res = await fetch("/api/boxes");
      const json = await res.json();
      if (res.ok) {
        setBoxes(json.boxes || []);
      }
    } catch (err) {
      console.error("Erro ao carregar boxes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBoxes();
  }, []);

  function handleOpenCreate() {
    setEditingBox(null);
    setFormData({
      name: "",
      type: "LAVAGEM",
      color: "#a3e635",
      capacity: 1,
      description: "",
      active: true,
    });
    setError(null);
    setModalOpen(true);
  }

  function handleOpenEdit(box: WorkBay) {
    setEditingBox(box);
    setFormData({
      name: box.name,
      type: box.type || "GERAL",
      color: box.color || "#a3e635",
      capacity: box.capacity || 1,
      description: box.description || "",
      active: box.active,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingBox ? `/api/boxes/${editingBox.id}` : "/api/boxes";
      const method = editingBox ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar box.");
      }

      setFeedback(editingBox ? "Box atualizado com sucesso!" : "Novo box cadastrado!");
      setModalOpen(false);
      loadBoxes();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deseja realmente remover o ${name}?`)) return;

    try {
      const res = await fetch(`/api/boxes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Não foi possível remover o box.");
        return;
      }
      setBoxes((prev) => prev.filter((b) => b.id !== id));
      setFeedback("Box removido com sucesso.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      alert("Erro ao comunicar com o servidor.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded carbon-card border-carbon-700 bg-carbon-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-carbon-800 border border-carbon-700 flex items-center justify-center text-lime-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-display font-extrabold tracking-wide text-white uppercase flex items-center gap-2">
              <span>Gestão de Boxes & Baias da Oficina</span>
              <span className="led-pulse-lime" />
            </h1>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              ORGANIZAÇÃO DOS POSTOS DE TRABALHO, RAMPAS, CABINES E CAPACIDADE DO PÁTIO
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-engine-start px-3.5 py-2 rounded text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ CADASTRAR NOVO BOX</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded bg-lime-400/10 border border-lime-400/40 text-lime-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-lime-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid de Cards de Boxes */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
          <Loader2 className="w-7 h-7 animate-spin text-lime-400" />
          <p className="text-xs uppercase tracking-wider">CARREGANDO INFRAESTRUTURA DE BOXES...</p>
        </div>
      ) : boxes.length === 0 ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs carbon-card">
          // NENHUM BOX CADASTRADO NO MOMENTO
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {boxes.map((box) => {
            const typeConfig = BOX_TYPES.find((t) => t.id === box.type) || BOX_TYPES[4];
            const Icon = typeConfig.icon;

            return (
              <div
                key={box.id}
                className={`carbon-card p-4 flex flex-col justify-between group transition-all duration-200 ${
                  box.isFull
                    ? "border-red-500/60 shadow-lg shadow-red-500/5 bg-red-950/10"
                    : "hover:border-lime-400/50"
                }`}
              >
                <div>
                  {/* Top Header do Box */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: box.color || "#a3e635" }}
                      />
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                        {typeConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {box.isFull ? (
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded border uppercase bg-red-500/20 text-red-400 border-red-500/50 flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-2.5 h-2.5" />
                          LOTADO ({box.occupiedCount}/{box.capacity})
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase bg-lime-500/10 text-lime-400 border-lime-500/30">
                          {box.occupiedCount || 0}/{box.capacity} {box.capacity === 1 ? "VAGA" : "VAGAS"}
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                          box.active
                            ? "bg-slate-800 text-slate-300 border-slate-700"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {box.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  {/* Nome do Box */}
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded border shrink-0 mt-0.5 ${
                      box.isFull
                        ? "bg-red-950/40 border-red-500/40 text-red-400"
                        : "bg-carbon-800 border-carbon-700 text-lime-400"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-mono text-sm font-bold text-white group-hover:text-lime-400 transition-colors">
                        {box.name}
                      </h3>
                      {box.description && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {box.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Monitor de Ocupação & Veículos Presentes */}
                  <div className="mt-3.5 pt-3 border-t border-carbon-700/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 uppercase tracking-wider">Capacidade Máxima:</span>
                      <span className="text-white font-bold">{box.capacity} {box.capacity === 1 ? "veículo" : "veículos simultâneos"}</span>
                    </div>

                    {/* Barra de Lotação Visual */}
                    <div className="w-full h-1.5 bg-carbon-950 rounded border border-carbon-700 overflow-hidden flex">
                      {Array.from({ length: box.capacity }).map((_, slotIdx) => {
                        const isSlotOccupied = slotIdx < (box.occupiedCount || 0);
                        return (
                          <div
                            key={slotIdx}
                            className={`flex-1 border-r border-carbon-900 last:border-r-0 ${
                              isSlotOccupied
                                ? box.isFull
                                  ? "bg-red-500"
                                  : "bg-amber-400"
                                : "bg-carbon-800/40"
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Veículos Atualmente no Box */}
                    {box.currentOrders && box.currentOrders.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">
                          Atendimentos em andamento:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {box.currentOrders.map((ord) => (
                            <span
                              key={ord.id}
                              className="mercosul-plate text-[9px] py-0 px-1.5"
                              title={`OS #${ord.orderNumber} - ${ord.model}`}
                            >
                              {ord.plate}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Box 100% Livre para entrada</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do Card com Ações */}
                <div className="mt-4 pt-3 border-t border-carbon-700/80 flex items-center justify-between font-mono text-xs">
                  <span className={`text-[10px] font-bold ${box.isFull ? "text-red-400" : "text-slate-500"}`}>
                    {box.isFull ? "BLOQUEADO AUTOMÁTICO" : "LIBERADO P/ ENTRADA"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(box)}
                      className="px-2 py-1 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-carbon-600 uppercase"
                      title="Editar box"
                    >
                      <Pencil className="w-3 h-3 text-lime-400" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(box.id, box.name)}
                      className="p-1 rounded hover:bg-carbon-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Excluir box"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Box */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="carbon-card w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto bg-carbon-900 border-carbon-700">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <h2 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                <Gauge className="w-4 h-4 text-lime-400" />
                <span>{editingBox ? "Editar Box / Baia" : "Cadastrar Novo Box"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label-carbon">Nome / Identificação do Box *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Box 01 - Lavagem Técnica"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input-carbon w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">Tipo de Atividade</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const selected = e.target.value;
                      const cfg = BOX_TYPES.find((t) => t.id === selected);
                      setFormData({
                        ...formData,
                        type: selected,
                        color: cfg?.defaultColor || formData.color,
                      });
                    }}
                    className="form-select-carbon w-full font-mono text-xs"
                  >
                    {BOX_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label-carbon flex items-center justify-between">
                    <span>Vagas (Capacidade) *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="form-input-carbon w-full font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Bloqueia ao atingir o limite
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label-carbon">Cor Indicadora no Cockpit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-9 p-0.5 rounded bg-carbon-800 border border-carbon-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="form-input-carbon flex-1 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="form-label-carbon">Descrição / Equipamentos Instalados</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Rampa pneumática 4T, lavadora de alta pressão 220v, iluminação LED 6500K..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input-carbon w-full resize-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="form-checkbox-carbon"
                  />
                  <span>Box ativo para recebimento de veículos</span>
                </label>
              </div>

              <div className="pt-4 border-t border-carbon-700 flex items-center justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 border border-carbon-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-engine-start px-4 py-2 rounded flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBox ? "Salvar Alterações" : "Salvar Box"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

