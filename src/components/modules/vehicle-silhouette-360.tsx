"use client";

import { useState, useRef } from "react";
import { Camera, AlertCircle, Trash2, X, Plus, Upload, Check, Disc, ShieldAlert, Sparkles } from "lucide-react";

export type VehicleArea =
  | "WHEEL_FRONT_LEFT"
  | "WHEEL_FRONT_RIGHT"
  | "WHEEL_REAR_LEFT"
  | "WHEEL_REAR_RIGHT"
  | "FRONT_BUMPER"
  | "HOOD"
  | "HEADLIGHTS"
  | "WINDSHIELD"
  | "ROOF"
  | "REAR_GLASS"
  | "TRUNK"
  | "REAR_BUMPER"
  | "TAILLIGHTS"
  | "LEFT_SIDE"
  | "RIGHT_SIDE"
  | "MIRROR_LEFT"
  | "MIRROR_RIGHT"
  | "INTERIOR"
  | "PLASTICS"
  | "FRONT"
  | "REAR"
  | "GLASS";

export type DamageType =
  | "CURB_RASH"
  | "SCRATCH"
  | "DENT"
  | "CHIP"
  | "PAINT_BURN"
  | "PEELING"
  | "STAIN"
  | "CRACK"
  | "RIPPED_TEAR"
  | "OTHER";

export interface DamagePin {
  id?: string;
  area: VehicleArea | string;
  damageType: DamageType | string;
  coordinateX: number; // 0 a 100%
  coordinateY: number; // 0 a 100%
  description?: string;
  photoUrl?: string;
  photos?: string[]; // Múltiplas fotos da mesma avaria
}

interface VehicleSilhouette360Props {
  damages: DamagePin[];
  onChange: (damages: DamagePin[]) => void;
  readOnly?: boolean;
}

export function VehicleSilhouette360({
  damages,
  onChange,
  readOnly = false,
}: VehicleSilhouette360Props) {
  const [selectedDamageIndex, setSelectedDamageIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const damageTypeConfig: Record<
    string,
    { label: string; color: string; badge: string }
  > = {
    CURB_RASH: {
      label: "Ralado de Guia / Meio-fio (Roda)",
      color: "bg-amber-600 border-amber-300 text-white",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    SCRATCH: {
      label: "Risco / Arranhão",
      color: "bg-amber-500 border-amber-300 text-black",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    DENT: {
      label: "Amassado / Batida",
      color: "bg-red-500 border-red-300 text-white",
      badge: "bg-red-500/10 text-red-400 border-red-500/30",
    },
    CHIP: {
      label: "Trinca no Vidro / Lasca de Pedra",
      color: "bg-orange-500 border-orange-300 text-white",
      badge: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    },
    PAINT_BURN: {
      label: "Queimadura de Verniz / Sol",
      color: "bg-purple-500 border-purple-300 text-white",
      badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    PEELING: {
      label: "Descascamento de Pintura",
      color: "bg-pink-500 border-pink-300 text-white",
      badge: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    },
    STAIN: {
      label: "Mancha de Chuva Ácida / Dejeto",
      color: "bg-teal-500 border-teal-300 text-white",
      badge: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    },
    CRACK: {
      label: "Quebrado / Rachado (Farol/Retrovisor)",
      color: "bg-rose-600 border-rose-300 text-white",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    },
    RIPPED_TEAR: {
      label: "Rasgo / Desgaste (Bancos/Pneu)",
      color: "bg-yellow-600 border-yellow-300 text-white",
      badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    },
    OTHER: {
      label: "Outra Avaria",
      color: "bg-blue-500 border-blue-300 text-white",
      badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
  };

  const areaLabels: Record<string, string> = {
    WHEEL_FRONT_LEFT: "Roda Diant. Esquerda / Pneu",
    WHEEL_FRONT_RIGHT: "Roda Diant. Direita / Pneu",
    WHEEL_REAR_LEFT: "Roda Tras. Esquerda / Pneu",
    WHEEL_REAR_RIGHT: "Roda Tras. Direita / Pneu",
    FRONT_BUMPER: "Para-choque Dianteiro / Grade",
    HOOD: "Capô Dianteiro",
    HEADLIGHTS: "Faróis Dianteiros / Milhas",
    MIRROR_LEFT: "Retrovisor Esquerdo",
    MIRROR_RIGHT: "Retrovisor Direito",
    WINDSHIELD: "Vidro Dianteiro / Para-brisa",
    ROOF: "Teto",
    LEFT_SIDE: "Lateral Esquerda (Portas/Para-lama)",
    RIGHT_SIDE: "Lateral Direita (Portas/Para-lama)",
    REAR_GLASS: "Vidro Traseiro",
    TRUNK: "Tampa Traseira / Porta-malas",
    REAR_BUMPER: "Para-choque Traseiro / Difusor",
    TAILLIGHTS: "Lanternas Traseiras",
    INTERIOR: "Interior / Bancos / Painel",
    PLASTICS: "Partes Plásticas / Frisos / Borrachas",
    // Compatibilidade legada
    FRONT: "Frente / Capô",
    REAR: "Traseira / Porta-malas",
    GLASS: "Vidros / Para-brisa",
  };

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Detecção inteligente por região de toque
    let area: string = "ROOF";
    let defaultDamage: string = "SCRATCH";

    // 1. Rodas
    if (x <= 25 && y >= 15 && y <= 33) {
      area = "WHEEL_FRONT_LEFT";
      defaultDamage = "CURB_RASH";
    } else if (x >= 75 && y >= 15 && y <= 33) {
      area = "WHEEL_FRONT_RIGHT";
      defaultDamage = "CURB_RASH";
    } else if (x <= 25 && y >= 66 && y <= 85) {
      area = "WHEEL_REAR_LEFT";
      defaultDamage = "CURB_RASH";
    } else if (x >= 75 && y >= 66 && y <= 85) {
      area = "WHEEL_REAR_RIGHT";
      defaultDamage = "CURB_RASH";
    }
    // 2. Retrovisores
    else if (x <= 25 && y >= 26 && y <= 36) {
      area = "MIRROR_LEFT";
    } else if (x >= 75 && y >= 26 && y <= 36) {
      area = "MIRROR_RIGHT";
    }
    // 3. Faróis Dianteiros e Para-choque Frontal
    else if (y < 12 && (x < 42 || x > 58)) {
      area = "HEADLIGHTS";
      defaultDamage = "CHIP";
    } else if (y < 12) {
      area = "FRONT_BUMPER";
    }
    // 4. Capô
    else if (y >= 12 && y < 24) {
      area = "HOOD";
    }
    // 5. Para-brisa
    else if (y >= 24 && y < 36) {
      area = "WINDSHIELD";
      defaultDamage = "CHIP";
    }
    // 6. Teto e Laterais
    else if (y >= 36 && y < 65) {
      if (x < 30) area = "LEFT_SIDE";
      else if (x > 70) area = "RIGHT_SIDE";
      else area = "ROOF";
    }
    // 7. Vidro Traseiro
    else if (y >= 65 && y < 76) {
      area = "REAR_GLASS";
    }
    // 8. Porta-malas
    else if (y >= 76 && y < 88) {
      area = "TRUNK";
    }
    // 9. Lanternas e Para-choque Traseiro
    else if (y >= 88 && (x < 42 || x > 58)) {
      area = "TAILLIGHTS";
      defaultDamage = "CRACK";
    } else if (y >= 88) {
      area = "REAR_BUMPER";
    }

    const newDamage: DamagePin = {
      area,
      damageType: defaultDamage,
      coordinateX: parseFloat(x.toFixed(1)),
      coordinateY: parseFloat(y.toFixed(1)),
      description: "",
    };

    const nextList = [...damages, newDamage];
    onChange(nextList);
    setSelectedDamageIndex(nextList.length - 1);
  }

  // Atalho rápido para adicionar componentes pontuais (Rodas, Interior, Retrovisores)
  function handleAddQuickPin(areaKey: string, coordX: number, coordY: number, damageType: string = "SCRATCH") {
    if (readOnly) return;
    const newDamage: DamagePin = {
      area: areaKey,
      damageType,
      coordinateX: coordX,
      coordinateY: coordY,
      description: `Avaria em ${areaLabels[areaKey] || areaKey}`,
    };
    const nextList = [...damages, newDamage];
    onChange(nextList);
    setSelectedDamageIndex(nextList.length - 1);
  }

  function handleRemoveDamage(index: number) {
    const nextList = damages.filter((_, i) => i !== index);
    onChange(nextList);
    if (selectedDamageIndex === index) setSelectedDamageIndex(null);
  }

  function handleUpdateSelected(field: keyof DamagePin, value: any) {
    if (selectedDamageIndex === null) return;
    const nextList = [...damages];
    nextList[selectedDamageIndex] = {
      ...nextList[selectedDamageIndex],
      [field]: value,
    };
    onChange(nextList);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || selectedDamageIndex === null) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: form,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro no upload");
        if (data.url) uploadedUrls.push(data.url);
      }

      const currentDamage = damages[selectedDamageIndex];
      const existingPhotos =
        currentDamage.photos && currentDamage.photos.length > 0
          ? currentDamage.photos
          : currentDamage.photoUrl
            ? [currentDamage.photoUrl]
            : [];

      const mergedPhotos = [...existingPhotos, ...uploadedUrls];

      const nextList = [...damages];
      nextList[selectedDamageIndex] = {
        ...currentDamage,
        photos: mergedPhotos,
        photoUrl: mergedPhotos[0] || undefined,
      };
      onChange(nextList);
    } catch (err: any) {
      alert(err.message || "Falha ao enviar fotografia(s).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemovePhoto(photoIndex: number) {
    if (selectedDamageIndex === null) return;
    const currentDamage = damages[selectedDamageIndex];
    const existingPhotos =
      currentDamage.photos && currentDamage.photos.length > 0
        ? currentDamage.photos
        : currentDamage.photoUrl
          ? [currentDamage.photoUrl]
          : [];

    const nextPhotos = existingPhotos.filter((_, i) => i !== photoIndex);

    const nextList = [...damages];
    nextList[selectedDamageIndex] = {
      ...currentDamage,
      photos: nextPhotos,
      photoUrl: nextPhotos[0] || undefined,
    };
    onChange(nextList);
  }

  return (
    <div className="space-y-3.5">
      {/* Controles de Vista & Instrução */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
          <span className="led-pulse-lime" />
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            {readOnly
              ? "Silhueta com mapeamento de componentes e avarias:"
              : "Clique sobre o veículo, rodas ou componentes para apontar a avaria:"}
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total de Avarias:</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
            {damages.length} {damages.length === 1 ? "registro" : "registros"}
          </span>
        </div>
      </div>

      {/* BARRA DE ATALHOS RÁPIDOS PARA COMPONENTES CRÍTICOS (RODAS, RETROVISORES, INTERIOR) */}
      {!readOnly && (
        <div className="p-2.5 rounded bg-[#0c0e14] border border-[#1c2230] space-y-1.5 font-mono">
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Disc className="w-3 h-3 text-lime-400" />
            <span>Atalhos de Componentes Críticos (Rodas, Retrovisores, Interior):</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_FRONT_LEFT", 10, 24, "CURB_RASH")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-amber-400" />
              <span>Roda Diant. Esq.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_FRONT_RIGHT", 90, 24, "CURB_RASH")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-amber-400" />
              <span>Roda Diant. Dir.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_REAR_LEFT", 10, 75, "CURB_RASH")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-amber-400" />
              <span>Roda Tras. Esq.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_REAR_RIGHT", 90, 75, "CURB_RASH")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-amber-400" />
              <span>Roda Tras. Dir.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("HEADLIGHTS", 50, 6, "CHIP")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Faróis / Milhas</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("TAILLIGHTS", 50, 94, "CRACK")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Lanternas</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("INTERIOR", 50, 52, "RIPPED_TEAR")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <ShieldAlert className="w-3 h-3 text-purple-400" />
              <span>Interior / Bancos</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("PLASTICS", 18, 48, "SCRATCH")}
              className="px-2 py-1 rounded bg-[#161a24] hover:bg-[#202738] text-slate-300 hover:text-white border border-[#232a3a] text-[11px] flex items-center gap-1 cursor-pointer transition"
            >
              <Sparkles className="w-3 h-3 text-slate-400" />
              <span>Partes Plásticas</span>
            </button>
          </div>
        </div>
      )}

      {/* ÁREA INTERATIVA DA SILHUETA VEICULAR COM COMPONENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Canvas da Silhueta */}
        <div className="lg:col-span-7 bg-[#0b101b] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative select-none">
          <div
            onClick={handleCanvasClick}
            className={`relative w-full max-w-[310px] h-[500px] flex items-center justify-center ${readOnly ? "cursor-default" : "cursor-crosshair"
              }`}
          >
            {/* SVG da Silhueta Veicular Superior com Rodas, Faróis, Retrovisores */}
            <svg
              viewBox="0 0 200 360"
              className="w-full h-full drop-shadow-2xl stroke-slate-700 fill-slate-900/90 text-slate-800"
            >
              {/* 4 RODAS E PNEUS */}
              {/* Roda Dianteira Esquerda */}
              <g className="cursor-pointer">
                <rect x="8" y="58" width="24" height="46" rx="6" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                <rect x="12" y="64" width="16" height="34" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <line x1="20" y1="64" x2="20" y2="98" stroke="#475569" strokeWidth="1" />
                <text x="20" y="83" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                  RODA
                </text>
              </g>

              {/* Roda Dianteira Direita */}
              <g className="cursor-pointer">
                <rect x="168" y="58" width="24" height="46" rx="6" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                <rect x="172" y="64" width="16" height="34" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <line x1="180" y1="64" x2="180" y2="98" stroke="#475569" strokeWidth="1" />
                <text x="180" y="83" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                  RODA
                </text>
              </g>

              {/* Roda Traseira Esquerda */}
              <g className="cursor-pointer">
                <rect x="8" y="246" width="24" height="46" rx="6" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                <rect x="12" y="252" width="16" height="34" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <line x1="20" y1="252" x2="20" y2="286" stroke="#475569" strokeWidth="1" />
                <text x="20" y="271" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                  RODA
                </text>
              </g>

              {/* Roda Traseira Direita */}
              <g className="cursor-pointer">
                <rect x="168" y="246" width="24" height="46" rx="6" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
                <rect x="172" y="252" width="16" height="34" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <line x1="180" y1="252" x2="180" y2="286" stroke="#475569" strokeWidth="1" />
                <text x="180" y="271" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle">
                  RODA
                </text>
              </g>

              {/* Contorno Geral da Carroceria */}
              <path
                d="M 50 30 C 50 15, 75 10, 100 10 C 125 10, 150 15, 150 30 L 158 90 C 162 120, 162 240, 158 280 L 150 340 C 145 352, 125 355, 100 355 C 75 355, 55 352, 50 340 L 42 280 C 38 240, 38 120, 42 90 Z"
                strokeWidth="2.5"
                className="hover:fill-slate-800/80 transition-colors"
              />

              {/* Para-choque Dianteiro */}
              <path
                d="M 50 30 C 50 15, 75 10, 100 10 C 125 10, 150 15, 150 30 L 146 42 C 125 38, 75 38, 54 42 Z"
                fill="#1e293b"
                strokeWidth="1"
              />
              <text x="100" y="28" fontSize="7" fontWeight="bold" fill="#64748b" textAnchor="middle">
                PARA-CHOQUE DIANT.
              </text>

              {/* Faróis Dianteiros */}
              <path d="M 52 32 C 55 22, 68 20, 72 32 Z" fill="#38bdf8" fillOpacity="0.4" stroke="#0ea5e9" strokeWidth="1.2" />
              <path d="M 148 32 C 145 22, 132 20, 128 32 Z" fill="#38bdf8" fillOpacity="0.4" stroke="#0ea5e9" strokeWidth="1.2" />

              {/* Capô Dianteiro */}
              <path
                d="M 56 46 L 144 46 L 146 76 L 54 76 Z"
                strokeWidth="1"
                fill="#131c2e"
              />
              <text x="100" y="64" fontSize="9" fontWeight="bold" fill="#64748b" textAnchor="middle">
                CAPÔ
              </text>

              {/* Para-brisa Dianteiro */}
              <path
                d="M 56 80 C 70 70, 130 70, 144 80 L 140 120 C 120 115, 80 115, 60 120 Z"
                strokeWidth="1.5"
                fill="#1e293b"
              />
              <text x="100" y="100" fontSize="8" fill="#64748b" textAnchor="middle">
                VIDRO DIANTEIRO
              </text>

              {/* Teto */}
              <rect
                x="60"
                y="130"
                width="80"
                height="100"
                rx="6"
                strokeWidth="1.5"
                fill="#0f172a"
              />
              <text x="100" y="185" fontSize="10" fontWeight="bold" fill="#475569" textAnchor="middle">
                TETO
              </text>

              {/* Vidro Traseiro */}
              <path
                d="M 60 240 C 80 245, 120 245, 140 240 L 144 270 C 130 275, 70 275, 56 270 Z"
                strokeWidth="1.5"
                fill="#1e293b"
              />
              <text x="100" y="260" fontSize="8" fill="#64748b" textAnchor="middle">
                VIDRO TRASEIRO
              </text>

              {/* Porta-malas Traseiro */}
              <path
                d="M 56 278 L 144 278 L 142 322 L 58 322 Z"
                strokeWidth="1"
                fill="#131c2e"
              />
              <text x="100" y="304" fontSize="9" fontWeight="bold" fill="#64748b" textAnchor="middle">
                PORTA-MALAS
              </text>

              {/* Lanternas Traseiras */}
              <path d="M 52 324 C 55 334, 68 335, 70 324 Z" fill="#f43f5e" fillOpacity="0.5" stroke="#e11d48" strokeWidth="1.2" />
              <path d="M 148 324 C 145 334, 132 335, 130 324 Z" fill="#f43f5e" fillOpacity="0.5" stroke="#e11d48" strokeWidth="1.2" />

              {/* Para-choque Traseiro */}
              <path
                d="M 58 326 C 75 330, 125 330, 142 326 L 150 340 C 145 352, 125 355, 100 355 C 75 355, 55 352, 50 340 Z"
                fill="#1e293b"
                strokeWidth="1"
              />
              <text x="100" y="346" fontSize="7" fontWeight="bold" fill="#64748b" textAnchor="middle">
                PARA-CHOQUE TRAS.
              </text>

              {/* Retrovisores */}
              <g className="cursor-pointer">
                <rect x="22" y="94" width="16" height="24" rx="4" strokeWidth="1.5" stroke="#475569" fill="#1e293b" />
                <rect x="24" y="96" width="6" height="20" rx="2" fill="#38bdf8" fillOpacity="0.3" />
              </g>

              <g className="cursor-pointer">
                <rect x="162" y="94" width="16" height="24" rx="4" strokeWidth="1.5" stroke="#475569" fill="#1e293b" />
                <rect x="170" y="96" width="6" height="20" rx="2" fill="#38bdf8" fillOpacity="0.3" />
              </g>

              {/* Indicadores Laterais */}
              <text x="35" y="195" fontSize="7" fill="#64748b" textAnchor="middle" transform="rotate(-90 35,195)">
                LATERAL ESQ.
              </text>
              <text x="165" y="195" fontSize="7" fill="#64748b" textAnchor="middle" transform="rotate(90 165,195)">
                LATERAL DIR.
              </text>
            </svg>

            {/* Alfinetes (Pins) de Avarias Sobrepostos */}
            {damages.map((d, index) => {
              const cfg = damageTypeConfig[d.damageType] || damageTypeConfig.OTHER;
              const isSelected = selectedDamageIndex === index;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDamageIndex(index);
                  }}
                  style={{
                    left: `${d.coordinateX}%`,
                    top: `${d.coordinateY}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-lg transition-transform ${cfg.color
                    } ${isSelected ? "scale-125 ring-4 ring-white/50 z-20" : "scale-100 z-10"}`}
                  title={`${index + 1}. ${cfg.label} - ${areaLabels[d.area] || d.area}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Vista Superior 360º com 4 Rodas, Faróis, Para-choques e Retrovisores mapeados
          </p>
        </div>

        {/* Painel Lateral de Detalhes da Avaria Selecionada */}
        <div className="lg:col-span-5 flex flex-col justify-between carbon-card p-4">
          {selectedDamageIndex !== null && damages[selectedDamageIndex] ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#1c2230]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-lime-400 text-black flex items-center justify-center text-xs font-black font-mono">
                    {selectedDamageIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Editar Avaria #{selectedDamageIndex + 1}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDamage(selectedDamageIndex)}
                    className="text-xs font-mono uppercase text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              {/* Tipo de Avaria / Dano */}
              <div>
                <label className="form-label-carbon">
                  Tipo de Avaria / Dano:
                </label>
                <select
                  disabled={readOnly}
                  value={damages[selectedDamageIndex].damageType}
                  onChange={(e) => handleUpdateSelected("damageType", e.target.value)}
                  className="form-select-carbon w-full"
                >
                  <option value="CURB_RASH">Ralado de Guia / Meio-fio (Roda)</option>
                  <option value="SCRATCH">Risco / Arranhão</option>
                  <option value="DENT">Amassado / Batida</option>
                  <option value="CHIP">Trinca no Vidro / Lasca de Pedra</option>
                  <option value="PAINT_BURN">Queimadura de Verniz / Sol</option>
                  <option value="PEELING">Descascamento de Pintura</option>
                  <option value="STAIN">Mancha de Chuva Ácida / Dejeto</option>
                  <option value="CRACK">Quebrado / Rachado (Farol/Retrovisor)</option>
                  <option value="RIPPED_TEAR">Rasgo / Furo (Bancos/Pneu)</option>
                  <option value="OTHER">Outra Avaria</option>
                </select>
              </div>

              {/* Região / Componente do Carro */}
              <div>
                <label className="form-label-carbon">
                  Região / Componente do Carro:
                </label>
                <select
                  disabled={readOnly}
                  value={damages[selectedDamageIndex].area}
                  onChange={(e) => handleUpdateSelected("area", e.target.value)}
                  className="form-select-carbon w-full"
                >
                  <optgroup label="Rodas e Pneus">
                    <option value="WHEEL_FRONT_LEFT">Roda Dianteira Esquerda / Pneu</option>
                    <option value="WHEEL_FRONT_RIGHT">Roda Dianteira Direita / Pneu</option>
                    <option value="WHEEL_REAR_LEFT">Roda Traseira Esquerda / Pneu</option>
                    <option value="WHEEL_REAR_RIGHT">Roda Traseira Direita / Pneu</option>
                  </optgroup>
                  <optgroup label="Frente e Iluminação">
                    <option value="FRONT_BUMPER">Para-choque Dianteiro / Grade</option>
                    <option value="HOOD">Capô Dianteiro</option>
                    <option value="HEADLIGHTS">Faróis Dianteiros / Milhas</option>
                    <option value="WINDSHIELD">Vidro Dianteiro / Para-brisa</option>
                  </optgroup>
                  <optgroup label="Laterais e Retrovisores">
                    <option value="MIRROR_LEFT">Retrovisor Esquerdo</option>
                    <option value="MIRROR_RIGHT">Retrovisor Direito</option>
                    <option value="LEFT_SIDE">Lateral Esquerda (Portas/Para-lama)</option>
                    <option value="RIGHT_SIDE">Lateral Direita (Portas/Para-lama)</option>
                    <option value="ROOF">Teto</option>
                  </optgroup>
                  <optgroup label="Traseira">
                    <option value="TRUNK">Tampa Traseira / Porta-malas</option>
                    <option value="REAR_BUMPER">Para-choque Traseiro / Difusor</option>
                    <option value="TAILLIGHTS">Lanternas Traseiras</option>
                    <option value="REAR_GLASS">Vidro Traseiro</option>
                  </optgroup>
                  <optgroup label="Outros Componentes">
                    <option value="INTERIOR">Interior / Bancos / Painel</option>
                    <option value="PLASTICS">Partes Plásticas / Frisos / Borrachas</option>
                  </optgroup>
                </select>
              </div>

              {/* Descrição Detalhada */}
              <div>
                <label className="form-label-carbon">
                  Descrição / Local Exato:
                </label>
                <textarea
                  disabled={readOnly}
                  rows={2}
                  placeholder="Ex: Ralado profundo no aro diamantado da roda..."
                  value={damages[selectedDamageIndex].description || ""}
                  onChange={(e) => handleUpdateSelected("description", e.target.value)}
                  className="form-input-carbon w-full"
                />
              </div>

              {/* Captura de Múltiplas Fotos pela Câmera ou Galeria */}
              <div className="space-y-2">
                {(() => {
                  const currentDamage = damages[selectedDamageIndex];
                  const currentPhotos =
                    currentDamage.photos && currentDamage.photos.length > 0
                      ? currentDamage.photos
                      : currentDamage.photoUrl
                        ? [currentDamage.photoUrl]
                        : [];

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="form-label-carbon">
                          Fotografias da Avaria ({currentPhotos.length}):
                        </label>
                        {currentPhotos.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Clique na imagem para ampliar
                          </span>
                        )}
                      </div>

                      {/* Grade de Fotos da Mesma Avaria */}
                      {currentPhotos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {currentPhotos.map((url, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative rounded-lg overflow-hidden border border-[#1c2230] group aspect-square bg-black/60 shadow-sm"
                            >
                              <img
                                src={url}
                                alt={`Avaria ${selectedDamageIndex + 1} - Foto ${pIdx + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                onClick={() => setPreviewImage(url)}
                              />
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePhoto(pIdx);
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/80 hover:bg-rose-600 text-rose-400 hover:text-white transition-colors"
                                  title="Remover esta foto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-lime-400">
                                #{pIdx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!readOnly && (
                        <div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2.5 px-3 rounded border border-dashed border-[#232a3a] hover:border-lime-400 bg-[#0c0e14] hover:bg-[#161a24] text-slate-300 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-mono uppercase tracking-wider"
                          >
                            <Camera className="w-4 h-4 text-lime-400" />
                            <span>
                              {uploading
                                ? "Enviando fotos..."
                                : currentPhotos.length > 0
                                  ? "+ Anexar Mais Fotos Desta Avaria"
                                  : "Tirar Foto(s) / Anexar"}
                            </span>
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2 font-mono">
              <AlertCircle className="w-8 h-8 text-slate-600" />
              <p className="text-xs">
                {damages.length === 0
                  ? "Nenhuma avaria marcada. Clique sobre a silhueta, nas rodas ou use os atalhos rápidos acima."
                  : "Selecione um dos alfinetes numerados no carro para ver ou editar seus detalhes."}
              </p>
            </div>
          )}

          {/* Lista Resumo de Avarias */}
          {damages.length > 0 && (
            <div className="pt-3 border-t border-[#1c2230] mt-3 font-mono">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Avarias Registradas ({damages.length})
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {damages.map((d, idx) => {
                  const cfg = damageTypeConfig[d.damageType] || damageTypeConfig.OTHER;
                  const photoCount = (d.photos && d.photos.length > 0)
                    ? d.photos.length
                    : d.photoUrl
                      ? 1
                      : 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDamageIndex(idx)}
                      className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border transition-all ${selectedDamageIndex === idx
                          ? "bg-[#141822] border-lime-400"
                          : "bg-[#090b10] border-[#1c2230] hover:border-[#2b354c]"
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-bold text-lime-400 flex items-center justify-center border border-slate-700">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-[11px]">{cfg.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {areaLabels[d.area] || d.area} {d.description ? `— ${d.description}` : ""}
                          </p>
                        </div>
                      </div>
                      {photoCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-lime-400 shrink-0 font-bold">
                          <Camera className="w-3 h-3" />
                          <span>{photoCount}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Zoom / Lightbox para Foto Ampliada */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <img
              src={previewImage}
              alt="Evidência ampliada"
              className="w-full h-full max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/80 hover:bg-black text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
