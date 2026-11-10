"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Gauge,
  Sparkles,
  Droplets,
  Wrench,
  Car,
} from "lucide-react";
import {
  Button,
  Badge,
  PageHeader,
  Modal,
  Alert,
  LoadingState,
  EmptyState,
  Input,
  Select,
  Textarea,
  Checkbox,
} from "@/components/ui";

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
  { id: "LAVAGEM", label: "Lavagem & Descontaminação", icon: Droplets, defaultColor: "#2563EB" },
  { id: "POLIMENTO", label: "Polimento & Vitrificação", icon: Sparkles, defaultColor: "#247653" },
  { id: "HIGIENIZACAO", label: "Higienização & Detailing Interno", icon: Wrench, defaultColor: "#D97706" },
  { id: "RAMPA", label: "Rampa & Limpeza de Chassi", icon: Car, defaultColor: "#7C3AED" },
  { id: "GERAL", label: "Box Multiuso / Geral", icon: Layers, defaultColor: "#737D75" },
];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<WorkBay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<WorkBay | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "LAVAGEM",
    color: "#247653",
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
      color: "#247653",
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
      color: box.color || "#247653",
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

      setFeedback(editingBox ? "Box atualizado com sucesso!" : "Novo box cadastrado com sucesso!");
      setModalOpen(false);
      loadBoxes();
      setTimeout(() => setFeedback(null), 3500);
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
      <PageHeader
        title="Boxes e Vagas do Pátio"
        description="Configure as estações físicas de trabalho, rampas, cabines e a quantidade máxima de veículos simultâneos por box."
        actions={
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Cadastrar Novo Box
          </Button>
        }
      />

      {feedback && <Alert variant="success" title={feedback} />}

      {loading ? (
        <LoadingState message="Carregando infraestrutura de boxes..." />
      ) : boxes.length === 0 ? (
        <EmptyState
          icon={<Gauge className="w-6 h-6" />}
          title="Nenhum box cadastrado"
          description="Cadastre os boxes e baias físicas da sua estética para organizar as vagas do pátio."
          action={
            <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Cadastrar Primeiro Box
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {boxes.map((box) => {
            const typeConfig = BOX_TYPES.find((t) => t.id === box.type) || BOX_TYPES[4];
            const Icon = typeConfig.icon;

            return (
              <div
                key={box.id}
                className={`bg-white rounded-xl border p-5 flex flex-col justify-between shadow-xs transition-all ${
                  box.isFull
                    ? "border-[#DC4C4C]/40 bg-[#FEF2F2]/20"
                    : "border-[#E7EAE7] hover:border-[#247653]/40"
                }`}
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: box.color || "#247653" }}
                      />
                      <span className="text-xs font-medium text-[#737D75] truncate">
                        {typeConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={box.isFull ? "error" : "success"} size="sm">
                        {box.isFull
                          ? `Lotado (${box.occupiedCount}/${box.capacity})`
                          : `${box.occupiedCount || 0}/${box.capacity} ${box.capacity === 1 ? "vaga" : "vagas"}`}
                      </Badge>
                    </div>
                  </div>

                  {/* Nome e Descrição */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg border shrink-0 flex items-center justify-center ${
                        box.isFull
                          ? "bg-[#FEF2F2] border-[#DC4C4C]/20 text-[#DC4C4C]"
                          : "bg-[#E9F3EC] border-[#247653]/20 text-[#247653]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-[#252B27]">
                        {box.name}
                      </h3>
                      {box.description ? (
                        <p className="text-xs text-[#737D75] mt-1 leading-relaxed">
                          {box.description}
                        </p>
                      ) : (
                        <p className="text-xs text-[#9CA49E] mt-1">Sem observações de equipamento</p>
                      )}
                    </div>
                  </div>

                  {/* Monitor de Ocupação e Veículos Presentes */}
                  <div className="mt-4 pt-3.5 border-t border-[#F1F3F1] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#737D75]">Capacidade máxima:</span>
                      <span className="font-semibold text-[#252B27]">
                        {box.capacity} {box.capacity === 1 ? "veículo" : "veículos simultâneos"}
                      </span>
                    </div>

                    {/* Barra de Lotação por Vagas */}
                    <div className="w-full h-2 bg-[#F1F3F1] rounded-full overflow-hidden flex gap-0.5">
                      {Array.from({ length: box.capacity }).map((_, slotIdx) => {
                        const isSlotOccupied = slotIdx < (box.occupiedCount || 0);
                        return (
                          <div
                            key={slotIdx}
                            className={`flex-1 ${
                              isSlotOccupied
                                ? box.isFull
                                  ? "bg-[#DC4C4C]"
                                  : "bg-[#D97706]"
                                : "bg-[#E7EAE7]"
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Veículos Atualmente no Box */}
                    {box.currentOrders && box.currentOrders.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-medium text-[#737D75] block">
                          Veículos neste box agora:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {box.currentOrders.map((ord) => (
                            <span
                              key={ord.id}
                              className="mercosul-plate"
                              title={`OS #${ord.orderNumber} - ${ord.model}`}
                            >
                              {ord.plate}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#16A36A] font-medium flex items-center gap-1.5 pt-1">
                        <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                        <span>Box 100% livre para entrada</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="mt-4 pt-3 border-t border-[#F1F3F1] flex items-center justify-between">
                  <Badge variant={box.active ? "neutral" : "error"} size="sm">
                    {box.active ? "Ativo" : "Inativo"}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(box)}
                      leftIcon={<Pencil className="w-3.5 h-3.5" />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(box.id, box.name)}
                      className="text-[#737D75] hover:text-[#DC4C4C]"
                      title="Excluir box"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Box */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBox ? "Editar Box / Baia" : "Cadastrar Novo Box"}
        description="Defina o nome da estação de trabalho, a atividade principal e o limite de vagas simultâneas."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error" title={error} />}

          <Input
            label="Nome / Identificação do Box"
            required
            placeholder="Ex: Box 01 - Lavagem Técnica"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Tipo de Atividade"
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
              options={BOX_TYPES.map((t) => ({ value: t.id, label: t.label }))}
            />

            <Input
              label="Capacidade (Vagas)"
              type="number"
              min={1}
              max={20}
              required
              hint="Bloqueia novas entradas ao atingir o limite"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })
              }
            />
          </div>

          <div>
            <label className="form-label">Cor de Identificação</label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 p-1 rounded-lg bg-white border border-[#E7EAE7] cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="form-input flex-1 uppercase"
              />
            </div>
          </div>

          <Textarea
            label="Descrição / Equipamentos Instalados (opcional)"
            rows={2}
            placeholder="Ex: Elevador pantográfico, lavadora de alta pressão, iluminação de inspeção..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Checkbox
            label="Box ativo para recebimento de veículos"
            checked={formData.active}
            onChange={(checked) => setFormData({ ...formData, active: checked })}
          />

          <div className="pt-4 border-t border-[#E7EAE7] flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingBox ? "Salvar Alterações" : "Cadastrar Box"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
