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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="carbon-card w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 bg-carbon-900 border-carbon-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
          <h2 className="text-sm sm:text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-lime-400" />
            <span>Mover Veículo // Troca de Box & Estação</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumo do Veículo */}
        <div className="p-3 bg-carbon-950 rounded border border-carbon-800 flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">VEÍCULO EM ATENDIMENTO</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="mercosul-plate text-xs font-bold">{plate}</span>
              <span className="text-white font-bold">{model}</span>
            </div>
            <span className="text-[10px] text-slate-400">OS #{orderNumber}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold block">BOX ATUAL</span>
            <span className="text-xs font-bold text-amber-400 mt-0.5 inline-block px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              {currentBox || "Sem Box"}
            </span>
          </div>
        </div>

        {/* Feedback de Erro */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded flex items-center gap-2 text-xs font-mono text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Seletor de Box */}
        <form onSubmit={handleConfirmTransfer} className="space-y-4 font-mono">
          <div>
            <label className="form-label-carbon flex items-center justify-between mb-2">
              <span>Selecione a Estação / Box de Destino *</span>
              <span className="text-[10px] text-slate-500">Capacidade verificada em tempo real</span>
            </label>

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
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                      selectedBox === b.name
                        ? "bg-lime-400/15 border-lime-400 text-white shadow-[0_0_12px_rgba(163,230,53,0.15)]"
                        : isFull
                        ? "bg-rose-950/20 border-rose-900/40 text-slate-500 opacity-60 cursor-not-allowed"
                        : "bg-carbon-950 border-carbon-800 hover:border-carbon-600 text-slate-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: b.color || "#a3e635" }}
                      />
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs uppercase truncate text-white">{b.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ATUAL
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {b.type || "GERAL"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isFull
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                              : b.occupiedCount > 0
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-lime-500/10 text-lime-400 border-lime-500/30"
                          }`}
                        >
                          {b.occupiedCount}/{b.capacity} {b.capacity === 1 ? "VAGA" : "VAGAS"}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        {isFull ? "LOTADO // BLOQUEADO" : `${b.availableSlots} livre(s)`}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Opção de Pátio Externo / Área Geral */}
              <button
                type="button"
                onClick={() => setSelectedBox("Pátio Geral")}
                className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                  selectedBox === "Pátio Geral"
                    ? "bg-lime-400/15 border-lime-400 text-white shadow-[0_0_12px_rgba(163,230,53,0.15)]"
                    : "bg-carbon-950 border-carbon-800 hover:border-carbon-600 text-slate-300 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <Layers className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-xs uppercase text-white">Pátio Geral / Vaga Externa</span>
                    <span className="text-[10px] text-slate-400 block">Área de espera ou pátio sem baia fixa</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded bg-carbon-800 border border-carbon-700">
                  LIVRE
                </span>
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-3 border-t border-carbon-700 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedBox || selectedBox === currentBox}
              className="btn-engine-start px-5 py-2 rounded flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
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

