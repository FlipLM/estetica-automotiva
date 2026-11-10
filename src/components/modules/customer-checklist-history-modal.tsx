"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  User,
  Car,
  Fuel,
  Camera,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Share2,
  Loader2,
  FileCheck,
  Eye,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface CustomerChecklistHistoryModalProps {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ChecklistSummary {
  id: string;
  fuelLevel: number;
  valuablesLeft?: string;
  photosUrls?: string;
  customerConfirmed: boolean;
  notes?: string;
  createdAt: string;
  serviceOrder: {
    id: string;
    orderNumber: number;
    mileage?: number;
    status: string;
    box?: string;
    vehicle: {
      id: string;
      plate: string;
      model: string;
      brand?: string;
      color?: string;
      category: string;
    };
  };
  damageRecords: Array<{
    id: string;
    area: string;
    damageType: string;
    description?: string;
    photoUrl?: string;
    photos?: string[];
  }>;
}

export function CustomerChecklistHistoryModal({
  customerId,
  customerName,
  customerPhone,
  isOpen,
  onClose,
}: CustomerChecklistHistoryModalProps) {
  const [checklists, setChecklists] = useState<ChecklistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !customerId) return;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/checklists?customerId=${customerId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro ao carregar histórico de vistorias.");
        }

        setChecklists(data.checklists || []);
      } catch (err: any) {
        setError(err.message || "Erro na conexão.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [isOpen, customerId]);

  function handleShareWhatsApp(chk: ChecklistSummary) {
    if (!customerPhone) {
      alert("Cliente não possui telefone/WhatsApp cadastrado.");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    const formatted = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const vh = chk.serviceOrder.vehicle;
    const text = `Olá, *${customerName}*!%0A%0ASegue o histórico da sua vistoria de entrada na oficina:%0A- Veículo: *${vh.brand || ""} ${vh.model}* (Placa: *${vh.plate}*)%0A- Data: ${formatDateTime(chk.createdAt)}%0A- Combustível: ${chk.fuelLevel}%%0A- Avarias Mapeadas: ${chk.damageRecords.length} ponto(s)%0A%0ACaso precise de algo, estamos à disposição!`;
    window.open(`https://wa.me/${formatted}?text=${text}`, "_blank");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="carbon-card border-carbon-700 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-carbon-700 bg-carbon-900/90 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-carbon-950 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="led-pulse-lime" />
                <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
                  // HISTÓRICO INDIVIDUAL DE VISTORIAS DO CLIENTE
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>{customerName}</span>
                {customerPhone && (
                  <span className="text-slate-400 font-mono text-xs font-normal">
                    ({customerPhone})
                  </span>
                )}
              </h2>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Total de vistorias realizadas:{" "}
                <strong className="text-lime-400">{checklists.length} inspeção(ões)</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-carbon-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 font-mono">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
              <p className="text-xs uppercase tracking-wider">
                CARREGANDO HISTÓRICO DE VISTORIAS DO CLIENTE...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          ) : checklists.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs carbon-card border-carbon-800 space-y-2">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-bold uppercase">Nenhuma Vistoria Registrada</p>
              <p className="text-slate-500 text-[11px]">
                Este cliente ainda não possui checklists ou vistorias de entrada vinculadas aos seus veículos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {checklists.map((chk, index) => {
                const vh = chk.serviceOrder.vehicle;
                const totalPhotos = chk.damageRecords.reduce((acc, d) => {
                  return acc + (d.photos?.length || (d.photoUrl ? 1 : 0));
                }, 0);

                return (
                  <div
                    key={chk.id}
                    className="p-4 sm:p-5 rounded-xl carbon-card border-carbon-700 bg-carbon-900/50 hover:border-lime-500/40 transition-all space-y-3.5"
                  >
                    {/* Header do Card de Vistoria */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-carbon-800">
                      <div className="flex items-center gap-2.5">
                        <span className="mercosul-plate text-xs font-bold inline-block">
                          {vh.plate}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white uppercase block">
                            {vh.brand ? `${vh.brand} ` : ""}
                            {vh.model} {vh.color ? `• ${vh.color}` : ""}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Porte: {vh.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-carbon-950 text-slate-300 border border-carbon-700 text-[10px] font-bold">
                          OS #{chk.serviceOrder.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDateTime(chk.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Indicadores: Combustível, KM e Avarias */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded bg-carbon-950 border border-carbon-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                          <Fuel className="w-3 h-3 text-amber-400" />
                          Combustível
                        </span>
                        <p className="font-bold text-amber-400">{chk.fuelLevel}%</p>
                      </div>

                      <div className="p-2.5 rounded bg-carbon-950 border border-carbon-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                          <Car className="w-3 h-3 text-lime-400" />
                          Quilometragem
                        </span>
                        <p className="font-bold text-slate-200">
                          {chk.serviceOrder.mileage
                            ? `${chk.serviceOrder.mileage.toLocaleString("pt-BR")} km`
                            : "Não registrada"}
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-carbon-950 border border-carbon-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          Avarias
                        </span>
                        <p
                          className={`font-bold ${
                            chk.damageRecords.length > 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {chk.damageRecords.length} identificada(s)
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-carbon-950 border border-carbon-800 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                          <Camera className="w-3 h-3 text-cyan-400" />
                          Fotos Anexadas
                        </span>
                        <p className="font-bold text-cyan-400">{totalPhotos} evidência(s)</p>
                      </div>
                    </div>

                    {/* Pertences Declarados */}
                    {chk.valuablesLeft && (
                      <div className="p-2 rounded bg-carbon-950/80 border border-carbon-800 text-[11px] text-slate-300">
                        <span className="text-slate-500 font-bold uppercase text-[10px]">
                          Pertences no Interior:{" "}
                        </span>
                        {chk.valuablesLeft}
                      </div>
                    )}

                    {/* Mini Galeria de Fotos de Avarias Desta Vistoria */}
                    {chk.damageRecords.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                          Mapeamento de Avarias & Evidências Desta Entrada:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {chk.damageRecords.map((d, dIdx) => {
                            const dPhotos =
                              d.photos && d.photos.length > 0
                                ? d.photos
                                : d.photoUrl
                                ? [d.photoUrl]
                                : [];

                            return (
                              <div
                                key={d.id || dIdx}
                                className="p-2.5 rounded bg-carbon-950 border border-carbon-800/80 space-y-2"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-4 h-4 rounded-full bg-slate-800 text-lime-400 text-[9px] font-bold flex items-center justify-center border border-slate-700">
                                      {dIdx + 1}
                                    </span>
                                    <span className="font-bold text-white truncate">
                                      {d.damageType} — {d.area}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 shrink-0">
                                    {dPhotos.length} foto(s)
                                  </span>
                                </div>

                                {d.description && (
                                  <p className="text-[10px] text-slate-400 italic">
                                    "{d.description}"
                                  </p>
                                )}

                                {dPhotos.length > 0 && (
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {dPhotos.map((url, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setPreviewPhoto(url)}
                                        className="relative w-12 h-12 rounded border border-carbon-700 overflow-hidden shrink-0 cursor-pointer hover:border-lime-400 transition"
                                      >
                                        <img
                                          src={url}
                                          alt="Foto"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Ações da Vistoria */}
                    <div className="pt-2 border-t border-carbon-800 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(chk)}
                        className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer uppercase"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar WhatsApp</span>
                      </button>

                      <Link
                        href={`/vistoria/${chk.id}`}
                        onClick={onClose}
                        className="px-3 py-1.5 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 hover:text-white border border-carbon-600 text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer uppercase"
                      >
                        <Eye className="w-3.5 h-3.5 text-lime-400" />
                        <span>Abrir Comprovante 360°</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-carbon-700 bg-carbon-900/90 flex items-center justify-end font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            FECHAR HISTÓRICO
          </button>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <img
              src={previewPhoto}
              alt="Foto ampliada"
              className="w-full h-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

