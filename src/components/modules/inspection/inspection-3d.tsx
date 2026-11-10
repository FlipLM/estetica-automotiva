"use client";

import dynamic from "next/dynamic";
import { Component, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RotateCcw,
  X,
  Check,
  Trash2,
  Camera,
  Image as ImageIcon,
  Plus,
  Maximize2,
  Sparkles,
  Info,
  Layers,
  Upload,
} from "lucide-react";
import type { DamagePin } from "../vehicle-silhouette-360";
import { Anchor, MODEL_VERSION, OpenState, PartId, PARTS, revealed } from "./palio";
import { translateArea, translateDamageType, DAMAGE_TYPES } from "@/lib/damage-dictionary";

const Scene = dynamic(() => import("./scene"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex flex-col items-center justify-center text-sm text-[#737D75] gap-3">
      <div className="w-8 h-8 border-3 border-[#247653] border-t-transparent rounded-full animate-spin" />
      <span className="font-medium text-xs">Carregando modelo veicular 3D...</span>
    </div>
  ),
});

const DAMAGE_TYPE_OPTIONS = Object.entries(DAMAGE_TYPES).map(([id, label]) => ({
  id,
  label,
}));

class ViewerBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface PendingDamage {
  anchor: Anchor;
  damageType: string;
  description: string;
  photos: string[];
}

export function Inspection3D({
  damages,
  onChange,
  readOnly = false,
  onFallbackTo2D,
}: {
  damages: DamagePin[];
  onChange: (damages: DamagePin[]) => void;
  readOnly?: boolean;
  onFallbackTo2D?: () => void;
}) {
  const [failure, setFailure] = useState(false);
  const [open, setOpen] = useState<OpenState>({});

  // Avaria sendo criada pelo clique imediato na superfície
  const [pendingDamage, setPendingDamage] = useState<PendingDamage | null>(null);

  // Avaria salva selecionada para edição ou exclusão
  const [selectedDamageIndex, setSelectedDamageIndex] = useState<number | null>(null);

  // Lightbox de foto ampliada
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputPendingRef = useRef<HTMLInputElement>(null);
  const fileInputExistingRef = useRef<HTMLInputElement>(null);

  const fail = useCallback(() => {
    setFailure(true);
    if (onFallbackTo2D) onFallbackTo2D();
  }, [onFallbackTo2D]);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (!gl) fail();
    } catch {
      fail();
    }
  }, [fail]);

  const handleTogglePart = useCallback((partId: PartId) => {
    setOpen((prev) => ({ ...prev, [partId]: !prev[partId] }));
  }, []);

  const handlePick = useCallback(
    (anchor: Anchor) => {
      if (readOnly) return;
      setPendingDamage({
        anchor,
        damageType: "SCRATCH",
        description: "",
        photos: [],
      });
      setSelectedDamageIndex(null);
    },
    [readOnly]
  );

  const handleSelectDamage = useCallback(
    (index: number) => {
      setSelectedDamageIndex(index);
      setPendingDamage(null);

      // Abre a peça articulada se a avaria for interna
      const target = damages[index];
      if (target?.anchor3D?.revealAny?.length) {
        setOpen((prev) => {
          const updated = { ...prev };
          target.anchor3D!.revealAny.forEach((p: PartId) => {
            updated[p] = true;
          });
          return updated;
        });
      }
    },
    [damages]
  );

  // Upload de fotos para avaria provisória
  async function handlePendingPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !pendingDamage) return;

    setUploadingPhoto(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) newUrls.push(data.url);
      }
      setPendingDamage((prev) =>
        prev ? { ...prev, photos: [...prev.photos, ...newUrls] } : null
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar imagem.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputPendingRef.current) fileInputPendingRef.current.value = "";
    }
  }

  // Upload de fotos para avaria existente
  async function handleExistingPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || selectedDamageIndex === null) return;

    setUploadingPhoto(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) newUrls.push(data.url);
      }
      const updated = [...damages];
      const target = updated[selectedDamageIndex];
      const existingPhotos = target.photos || (target.photoUrl ? [target.photoUrl] : []);
      const merged = [...existingPhotos, ...newUrls];
      updated[selectedDamageIndex] = {
        ...target,
        photos: merged,
        photoUrl: merged[0] || target.photoUrl,
      };
      onChange(updated);
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar foto para a avaria.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputExistingRef.current) fileInputExistingRef.current.value = "";
    }
  }

  function handleConfirmPending() {
    if (!pendingDamage) return;

    const newPin: DamagePin = {
      area: pendingDamage.anchor.part,
      damageType: pendingDamage.damageType,
      coordinateX: 50,
      coordinateY: 50,
      description: pendingDamage.description.trim() || undefined,
      photos: pendingDamage.photos,
      photoUrl: pendingDamage.photos[0] || undefined,
      anchor3D: pendingDamage.anchor,
    };

    onChange([...damages, newPin]);
    setPendingDamage(null);
  }

  function handleCancelPending() {
    setPendingDamage(null);
  }

  function handleDeleteDamage(index: number) {
    onChange(damages.filter((_, i) => i !== index));
    if (selectedDamageIndex === index) setSelectedDamageIndex(null);
  }

  if (failure) {
    return (
      <div className="rounded-2xl border border-dashed border-[#DFE2DF] bg-white p-6 text-center space-y-3">
        <Info className="w-8 h-8 mx-auto text-[#D97706]" />
        <h4 className="text-sm font-bold text-[#142D26]">Aceleração WebGL Indisponível</h4>
        <p className="text-xs text-[#737D75] max-w-md mx-auto">
          O navegador atual não suporta aceleração 3D ou o WebGL está desativado. Você pode continuar a vistoria no modo silhueta 2D.
        </p>
        {onFallbackTo2D && (
          <button
            type="button"
            onClick={onFallbackTo2D}
            className="px-4 py-2 bg-[#247653] hover:bg-[#16A36A] text-white text-xs font-semibold rounded-xl transition-all"
          >
            Mudar para Silhueta 2D
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      {/* Barra de Ações Rápidas: Abertura das portas/capô e centralização da câmera */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F8FAF8] border border-[#DFE2DF] p-3 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#343C36] flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-[#247653]" />
            Peças:
          </span>
          {PARTS.map((p) => {
            const isOpen = !!open[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTogglePart(p.id)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isOpen
                    ? "bg-[#247653] text-white border-[#247653] shadow-xs"
                    : "bg-white text-[#343C36] border-[#DFE2DF] hover:border-[#247653]"
                }`}
                title={`Clique para ${isOpen ? "fechar" : "abrir"} ${p.label}`}
              >
                {p.label.replace("Porta ", "P. ").replace("Dianteira", "D.").replace("Traseira", "T.")} {isOpen ? "✓" : ""}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCameraResetTrigger((v) => v + 1)}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#DFE2DF] bg-white hover:bg-[#F2F4F1] text-[#343C36] flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#247653]" />
          <span>Centralizar Visão</span>
        </button>
      </div>

      {/* Visualizador 3D Principal */}
      <div className="h-[420px] sm:h-[520px] w-full overflow-hidden rounded-2xl border border-[#DFE2DF] bg-[#F8FAF8] relative touch-none select-none shadow-inner">
        <ViewerBoundary onFailure={fail}>
          <Scene
            damages={damages}
            pendingAnchor={pendingDamage?.anchor}
            open={open}
            readOnly={readOnly}
            cameraResetTrigger={cameraResetTrigger}
            onPick={handlePick}
            onTogglePart={handleTogglePart}
            onSelect={handleSelectDamage}
            onFailure={fail}
          />
        </ViewerBoundary>

        {/* Dica de Operação no Canto Superior Esquerdo */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border border-[#DFE2DF] px-3 py-1.5 rounded-xl shadow-xs pointer-events-auto">
            <p className="text-[11px] font-semibold text-[#142D26] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              Modelo 3D Interativo 360º
            </p>
            <p className="text-[10px] text-[#737D75] mt-0.5">
              Gire com o mouse/dedo. Dê 1 clique para apontar avaria ou 2 cliques na porta/capô para abrir.
            </p>
          </div>
        </div>

        {/* Modal/Gaveta para Registro de Nova Avaria (Surge logo após o clique) */}
        <AnimatePresence>
          {pendingDamage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-[380px] bg-white border border-[#DFE2DF] rounded-2xl p-4 shadow-xl z-20 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F1]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC4C4C] animate-ping" />
                  <h4 className="text-xs font-bold text-[#142D26]">Apontar Avaria no 3D</h4>
                </div>
                <button
                  type="button"
                  onClick={handleCancelPending}
                  className="p-1 hover:bg-[#F2F4F1] rounded-lg text-[#737D75] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#737D75] uppercase block mb-1">
                  Local Identificado
                </label>
                <div className="px-2.5 py-1.5 rounded-lg bg-[#E9F3EC] text-[#247653] font-bold text-xs border border-[#247653]/20">
                  {translateArea(pendingDamage.anchor.part)}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#737D75] uppercase block mb-1">
                  Tipo de Dano
                </label>
                <select
                  value={pendingDamage.damageType}
                  onChange={(e) =>
                    setPendingDamage((p) => (p ? { ...p, damageType: e.target.value } : null))
                  }
                  className="w-full text-xs rounded-xl border border-[#DFE2DF] p-2 bg-[#FAFAF7] text-[#142D26] font-medium focus:outline-hidden focus:border-[#247653]"
                >
                  {DAMAGE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#737D75] uppercase block mb-1">
                  Descrição / Detalhes
                </label>
                <textarea
                  rows={2}
                  value={pendingDamage.description}
                  onChange={(e) =>
                    setPendingDamage((p) => (p ? { ...p, description: e.target.value } : null))
                  }
                  placeholder="Ex: Risco superficial próximo ao vinco..."
                  className="w-full text-xs rounded-xl border border-[#DFE2DF] p-2 bg-[#FAFAF7] text-[#142D26] focus:outline-hidden focus:border-[#247653] resize-none"
                />
              </div>

              {/* Upload de Fotos da Avaria */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-[#737D75] uppercase">
                    Fotos da Avaria ({pendingDamage.photos.length})
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputPendingRef}
                    onChange={handlePendingPhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputPendingRef.current?.click()}
                    className="text-[10px] font-semibold text-[#247653] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{uploadingPhoto ? "Enviando..." : "+ Tirar/Anexar Foto"}</span>
                  </button>
                </div>

                {pendingDamage.photos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {pendingDamage.photos.map((url, pIdx) => (
                      <div
                        key={pIdx}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#DFE2DF] group"
                      >
                        <img src={url} alt="Avaria" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDamage((p) =>
                              p
                                ? {
                                    ...p,
                                    photos: p.photos.filter((_, idx) => idx !== pIdx),
                                  }
                                : null
                            )
                          }
                          className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelPending}
                  className="flex-1 py-2 text-xs font-semibold text-[#737D75] bg-[#F2F4F1] hover:bg-[#E5E8E5] rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPending}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-[#247653] hover:bg-[#16A36A] rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Avaria</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Detalhes da Avaria Selecionada */}
        <AnimatePresence>
          {selectedDamageIndex !== null && damages[selectedDamageIndex] && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-[380px] bg-white border border-[#DFE2DF] rounded-2xl p-4 shadow-xl z-20 space-y-3"
            >
              {(() => {
                const item = damages[selectedDamageIndex];
                const photos = item.photos || (item.photoUrl ? [item.photoUrl] : []);
                return (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-[#F2F4F1]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                        <h4 className="text-xs font-bold text-[#142D26]">
                          Avaria #{selectedDamageIndex + 1}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDamageIndex(null)}
                        className="p-1 hover:bg-[#F2F4F1] rounded-lg text-[#737D75] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#737D75]">Área:</span>
                        <span className="font-bold text-[#142D26]">
                          {translateArea(item.area)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737D75]">Tipo:</span>
                        <span className="font-bold text-[#142D26]">
                          {translateDamageType(item.damageType)}
                        </span>
                      </div>
                      {item.description && (
                        <div className="pt-1 text-[#343C36] bg-[#FAFAF7] p-2 rounded-xl border border-[#DFE2DF]">
                          "{item.description}"
                        </div>
                      )}
                    </div>

                    {/* Galeria de Fotos */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#737D75] uppercase">
                          Fotografias ({photos.length})
                        </span>
                        {!readOnly && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              ref={fileInputExistingRef}
                              onChange={handleExistingPhotoUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={uploadingPhoto}
                              onClick={() => fileInputExistingRef.current?.click()}
                              className="text-[10px] font-semibold text-[#247653] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Camera className="w-3 h-3" />
                              <span>{uploadingPhoto ? "Enviando..." : "+ Foto"}</span>
                            </button>
                          </>
                        )}
                      </div>

                      {photos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {photos.map((src, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setViewingPhoto(src)}
                              className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#DFE2DF] hover:opacity-90 group cursor-pointer"
                            >
                              <img src={src} alt="Foto" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#737D75] italic">Nenhuma foto anexada.</p>
                      )}
                    </div>

                    {!readOnly && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#F2F4F1]">
                        <button
                          type="button"
                          onClick={() => handleDeleteDamage(selectedDamageIndex)}
                          className="text-xs font-semibold text-[#DC4C4C] hover:bg-[#FEE2E2] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover Avaria</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDamageIndex(null)}
                          className="text-xs font-semibold text-[#343C36] bg-[#F2F4F1] hover:bg-[#E5E8E5] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de Avarias Registradas em formato de Cards Rápidos */}
      {damages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#142D26] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#247653]" />
            Avarias Apontadas ({damages.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {damages.map((d, index) => {
              const isSelected = selectedDamageIndex === index;
              const photosCount = d.photos?.length || (d.photoUrl ? 1 : 0);
              return (
                <div
                  key={d.id || index}
                  onClick={() => handleSelectDamage(index)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? "bg-[#E9F3EC] border-[#247653] shadow-xs"
                      : "bg-white border-[#DFE2DF] hover:border-[#247653]"
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#247653]">#{index + 1}</span>
                      <span className="font-bold text-[#142D26] truncate">
                        {translateArea(d.area)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#737D75]">
                      {translateDamageType(d.damageType)}
                    </p>
                    {d.description && (
                      <p className="text-[10px] text-[#343C36] truncate italic">
                        "{d.description}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {photosCount > 0 && (
                      <span className="text-[10px] font-bold text-[#247653] bg-[#E9F3EC] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {photosCount}
                      </span>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDamage(index);
                        }}
                        className="text-[#737D75] hover:text-[#DC4C4C] p-1 rounded-md transition-colors"
                        title="Remover avaria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox / Foto Ampliada */}
      <AnimatePresence>
        {viewingPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingPhoto(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden bg-black">
              <img
                src={viewingPhoto}
                alt="Foto Ampliada"
                className="max-w-full max-h-[85vh] object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nota de Licença Técnica do Modelo 3D */}
      <p className="text-[10px] text-[#737D75] pt-2 border-t border-[#DFE2DF]/60">
        Modelo tridimensional veicular sob licença Creative Commons (CC BY 4.0). Rig cinemático e mapeamento de impacto adaptados para DetailPro.
      </p>
    </div>
  );
}

