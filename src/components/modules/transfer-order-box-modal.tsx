"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  X,
  Layers,
  Droplets,
  Sparkles,
  Wrench,
  Car,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface WorkBay {
  id: string;
  name: string;
  type?: string;
  color?: string | null;
  capacity: number;
  occupiedCount: number;
  availableSlots: number;
  isFull: boolean;
}

interface TransferOrderBoxModalProps {
  isOpen: boolean;
  orderId: string;
  orderNumber: number;
  plate: string;
  model: string;
  currentBox: string;
  boxes: WorkBay[];
  onClose: () => void;
  onTransferred: () => void;
}

const TYPE_ICONS: Record<string, any> = {
  LAVAGEM: Droplets,
  POLIMENTO: Sparkles,
  HIGIENIZACAO: Wrench,
  RAMPA: Car,
  GERAL: Layers,
};

export function TransferOrderBoxModal({
  isOpen,
  orderId,
  orderNumber,
  plate,
  model,
  currentBox,
  boxes,
  onClose,
  onTransferred,
}: TransferOrderBoxModalProps) {
  const [selectedBox, setSelectedBox] = useState<string>(currentBox || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConfirmTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBox || selectedBox === currentBox) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box: selectedBox }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível transferir o veículo para este box.");
        return;
      }

      onTransferred();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Erro na conexão ao transferir veículo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#142D26]/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E7EAE7] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE7]">
          <h2 className="text-base font-bold text-[#252B27] flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[#247653]" />
            <span>Mover Veículo de Box / Estação</span>
          </h2>
          <button
            onClick={onClose}
            className="text-[#737D75] hover:text-[#252B27] p-1 rounded-lg hover:bg-[#F7F8F6] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumo do Veículo */}
        <div className="p-3.5 bg-[#F7F8F6] rounded-xl border border-[#E7EAE7] flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-[#737D75] font-semibold uppercase block">
              Veículo em Atendimento
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="mercosul-plate text-xs font-bold">{plate}</span>
              <span className="text-[#252B27] font-bold">{model}</span>
            </div>
            <span className="text-[11px] text-[#737D75] mt-0.5 block">OS #{orderNumber}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#737D75] font-semibold uppercase block">
              Box Atual
            </span>
            <span className="text-xs font-semibold text-[#D97706] mt-1 inline-block px-2.5 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A]">
              {currentBox || "Sem Box"}
            </span>
          </div>
        </div>

        {/* Feedback de Erro */}
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-center gap-2 text-xs font-medium text-[#DC4C4C]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Seletor de Box */}
        <form onSubmit={handleConfirmTransfer} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#343C36]">
                Selecione o Box / Estação de Destino <span className="text-[#DC4C4C]">*</span>
              </label>
              <span className="text-[11px] text-[#737D75]">Capacidade em tempo real</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {boxes.map((b) => {
                const isCurrent = b.name.toLowerCase() === (currentBox || "").toLowerCase();
                const isFull = b.isFull && !isCurrent;
                const Icon = TYPE_ICONS[b.type || "GERAL"] || Layers;

                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedBox(b.name)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedBox === b.name
                        ? "bg-[#E9F3EC] border-[#247653] text-[#142D26] shadow-xs"
                        : isFull
                        ? "bg-[#F7F8F6] border-[#E7EAE7] text-[#9CA49E] opacity-60 cursor-not-allowed"
                        : "bg-white border-[#E7EAE7] hover:border-[#9CA49E] text-[#252B27] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: b.color || "#247653" }}
                      />
                      <Icon className="w-4 h-4 text-[#737D75] shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate text-[#252B27]">{b.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-semibold">
                              Atual
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#737D75] block truncate">
                          {b.type || "GERAL"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          isFull
                            ? "bg-[#FEF2F2] text-[#DC4C4C] border-[#FECACA]"
                            : b.occupiedCount > 0
                            ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                            : "bg-[#ECFDF5] text-[#16A36A] border-[#A7F3D0]"
                        }`}
                      >
                        {b.occupiedCount}/{b.capacity} {b.capacity === 1 ? "vaga" : "vagas"}
                      </span>
                      <span className="text-[10px] text-[#737D75] block mt-0.5">
                        {isFull ? "Lotado" : `${b.availableSlots} livre(s)`}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Opção de Pátio Externo / Área Geral */}
              <button
                type="button"
                onClick={() => setSelectedBox("Pátio Geral")}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedBox === "Pátio Geral"
                    ? "bg-[#E9F3EC] border-[#247653] text-[#142D26] shadow-xs"
                    : "bg-white border-[#E7EAE7] hover:border-[#9CA49E] text-[#252B27] cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#737D75]" />
                  <Layers className="w-4 h-4 text-[#737D75]" />
                  <div>
                    <span className="font-bold text-xs text-[#252B27]">Pátio Geral / Vaga Externa</span>
                    <span className="text-[11px] text-[#737D75] block">Área de espera ou pátio sem baia fixa</span>
                  </div>
                </div>
                <span className="text-[11px] text-[#16A36A] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
                  Livre
                </span>
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-3 border-t border-[#E7EAE7] flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="dp-btn-secondary text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedBox || selectedBox === currentBox}
              className="dp-btn-primary text-xs cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Confirmar Transferência</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
