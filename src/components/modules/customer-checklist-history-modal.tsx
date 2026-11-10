"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Car,
  Fuel,
  Camera,
  AlertTriangle,
  Share2,
  Loader2,
  FileCheck,
  Eye,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/45 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="bg-white border border-[#E7EAE7] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-[#E7EAE7] bg-[#F7F8F6] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#247653] uppercase tracking-wider block">
                Histórico de Vistorias do Cliente
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#252B27] flex items-center gap-2">
                <span>{customerName}</span>
                {customerPhone && (
                  <span className="text-[#737D75] text-xs font-normal">
                    ({customerPhone})
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#737D75] mt-0.5">
                Total de vistorias realizadas:{" "}
                <strong className="text-[#247653]">{checklists.length} inspeção(ões)</strong>
              </p>
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#737D75]">
              <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
              <p className="text-xs font-medium">
                Carregando histórico de vistorias do cliente...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium">
              {error}
            </div>
          ) : checklists.length === 0 ? (
            <div className="p-12 text-center text-[#737D75] text-xs bg-[#F7F8F6] rounded-xl border border-[#E7EAE7] space-y-2">
              <FileCheck className="w-10 h-10 text-[#9CA49E] mx-auto" />
              <p className="text-[#252B27] font-bold">Nenhuma Vistoria Registrada</p>
              <p className="text-[#737D75] text-xs">
                Este cliente ainda não possui checklists ou vistorias de entrada vinculadas aos seus veículos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {checklists.map((chk) => {
                const vh = chk.serviceOrder.vehicle;
                const totalPhotos = chk.damageRecords.reduce((acc, d) => {
                  return acc + (d.photos?.length || (d.photoUrl ? 1 : 0));
                }, 0);

                return (
                  <div
                    key={chk.id}
                    className="p-4 sm:p-5 rounded-xl bg-white border border-[#E7EAE7] hover:border-[#247653]/50 transition-all space-y-3.5 shadow-xs"
                  >
                    {/* Header do Card de Vistoria */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E7EAE7]">
                      <div className="flex items-center gap-2.5">
                        <span className="mercosul-plate text-xs font-bold inline-block">
                          {vh.plate}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-[#252B27] block">
                            {vh.brand ? `${vh.brand} ` : ""}
                            {vh.model} {vh.color ? `• ${vh.color}` : ""}
                          </span>
                          <span className="text-[11px] text-[#737D75]">
                            Porte: {vh.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E9F3EC] text-[#142D26] text-[11px] font-bold">
                          OS #{chk.serviceOrder.orderNumber}
                        </span>
                        <span className="text-xs text-[#737D75]">
                          {formatDateTime(chk.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Indicadores: Combustível, KM e Avarias */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] space-y-1">
                        <span className="text-[10px] text-[#737D75] font-semibold uppercase flex items-center gap-1">
                          <Fuel className="w-3 h-3 text-[#D97706]" />
                          Combustível
                        </span>
                        <p className="font-bold text-[#252B27]">{chk.fuelLevel}%</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] space-y-1">
                        <span className="text-[10px] text-[#737D75] font-semibold uppercase flex items-center gap-1">
                          <Car className="w-3 h-3 text-[#247653]" />
                          Quilometragem
                        </span>
                        <p className="font-bold text-[#252B27]">
                          {chk.serviceOrder.mileage
                            ? `${chk.serviceOrder.mileage.toLocaleString("pt-BR")} km`
                            : "Não registrada"}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] space-y-1">
                        <span className="text-[10px] text-[#737D75] font-semibold uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[#DC4C4C]" />
                          Avarias
                        </span>
                        <p
                          className={`font-bold ${
                            chk.damageRecords.length > 0 ? "text-[#DC4C4C]" : "text-[#16A36A]"
                          }`}
                        >
                          {chk.damageRecords.length} identificada(s)
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] space-y-1">
                        <span className="text-[10px] text-[#737D75] font-semibold uppercase flex items-center gap-1">
                          <Camera className="w-3 h-3 text-[#2563EB]" />
                          Fotos Anexadas
                        </span>
                        <p className="font-bold text-[#2563EB]">{totalPhotos} evidência(s)</p>
                      </div>
                    </div>

                    {/* Pertences Declarados */}
                    {chk.valuablesLeft && (
                      <div className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] text-xs text-[#343C36]">
                        <span className="text-[#737D75] font-semibold">
                          Pertences no interior:{" "}
                        </span>
                        {chk.valuablesLeft}
                      </div>
                    )}

                    {/* Mini Galeria de Fotos de Avarias Desta Vistoria */}
                    {chk.damageRecords.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs text-[#343C36] font-semibold block">
                          Mapeamento de Avarias e Evidências desta Entrada:
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
                                className="p-2.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-4 h-4 rounded-full bg-[#247653] text-white text-[10px] font-bold flex items-center justify-center">
                                      {dIdx + 1}
                                    </span>
                                    <span className="font-bold text-[#252B27] truncate">
                                      {d.damageType} — {d.area}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-[#737D75] shrink-0">
                                    {dPhotos.length} foto(s)
                                  </span>
                                </div>

                                {d.description && (
                                  <p className="text-[11px] text-[#737D75] italic">
                                    &ldquo;{d.description}&rdquo;
                                  </p>
                                )}

                                {dPhotos.length > 0 && (
                                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {dPhotos.map((url, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setPreviewPhoto(url)}
                                        className="relative w-12 h-12 rounded-lg border border-[#E7EAE7] overflow-hidden shrink-0 cursor-pointer hover:border-[#247653] transition"
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
                    <div className="pt-2 border-t border-[#E7EAE7] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(chk)}
                        className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#16A36A] border border-[#A7F3D0] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar por WhatsApp</span>
                      </button>

                      <Link
                        href={`/vistoria/${chk.id}`}
                        onClick={onClose}
                        className="dp-btn-secondary text-xs py-1.5 px-3"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#247653]" />
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
        <div className="p-4 border-t border-[#E7EAE7] bg-[#F7F8F6] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="dp-btn-secondary text-xs cursor-pointer"
          >
            Fechar Histórico
          </button>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/85 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-[#E7EAE7] shadow-2xl bg-white">
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
