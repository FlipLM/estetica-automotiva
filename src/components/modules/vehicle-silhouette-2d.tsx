"use client";

import { useState, useRef } from "react";
import { Camera, AlertCircle, Trash2, X, Disc, ShieldAlert, Sparkles } from "lucide-react";

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

export interface VehicleSilhouette2DProps {
  damages: DamagePin[];
  onChange: (damages: DamagePin[]) => void;
  readOnly?: boolean;
}

export function VehicleSilhouette2D({
  damages,
  onChange,
  readOnly = false,
}: VehicleSilhouette2DProps) {
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
      color: "bg-[#D97706] border-white text-white",
      badge: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    },
    SCRATCH: {
      label: "Risco / Arranhão",
      color: "bg-[#F59E0B] border-white text-white",
      badge: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    },
    DENT: {
      label: "Amassado / Batida",
      color: "bg-[#DC4C4C] border-white text-white",
      badge: "bg-[#FEF2F2] text-[#DC4C4C] border-[#FECACA]",
    },
    CHIP: {
      label: "Trinca no Vidro / Lasca de Pedra",
      color: "bg-[#EA580C] border-white text-white",
      badge: "bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]",
    },
    PAINT_BURN: {
      label: "Queimadura de Verniz / Sol",
      color: "bg-[#7C3AED] border-white text-white",
      badge: "bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]",
    },
    PEELING: {
      label: "Descascamento de Pintura",
      color: "bg-[#DB2777] border-white text-white",
      badge: "bg-[#FDF2F8] text-[#BE185D] border-[#FBCFE8]",
    },
    STAIN: {
      label: "Mancha de Chuva Ácida / Dejeto",
      color: "bg-[#0D9488] border-white text-white",
      badge: "bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]",
    },
    CRACK: {
      label: "Quebrado / Rachado (Farol/Retrovisor)",
      color: "bg-[#E11D48] border-white text-white",
      badge: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
    },
    RIPPED_TEAR: {
      label: "Rasgo / Desgaste (Bancos/Pneu)",
      color: "bg-[#CA8A04] border-white text-white",
      badge: "bg-[#FEFCE8] text-[#A16207] border-[#FEF08A]",
    },
    OTHER: {
      label: "Outra Avaria",
      color: "bg-[#2563EB] border-white text-white",
      badge: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
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
    FRONT: "Frente / Capô",
    REAR: "Traseira / Porta-malas",
    GLASS: "Vidros / Para-brisa",
  };

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let area: string = "ROOF";
    let defaultDamage: string = "SCRATCH";

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
    } else if (x <= 25 && y >= 26 && y <= 36) {
      area = "MIRROR_LEFT";
    } else if (x >= 75 && y >= 26 && y <= 36) {
      area = "MIRROR_RIGHT";
    } else if (y < 12 && (x < 42 || x > 58)) {
      area = "HEADLIGHTS";
      defaultDamage = "CHIP";
    } else if (y < 12) {
      area = "FRONT_BUMPER";
    } else if (y >= 12 && y < 24) {
      area = "HOOD";
    } else if (y >= 24 && y < 36) {
      area = "WINDSHIELD";
      defaultDamage = "CHIP";
    } else if (y >= 36 && y < 65) {
      if (x < 30) area = "LEFT_SIDE";
      else if (x > 70) area = "RIGHT_SIDE";
      else area = "ROOF";
    } else if (y >= 65 && y < 76) {
      area = "REAR_GLASS";
    } else if (y >= 76 && y < 88) {
      area = "TRUNK";
    } else if (y >= 88 && (x < 42 || x > 58)) {
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
    <div className="space-y-4">
      {/* Controles de Vista & Instrução */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-[#343C36]">
          <span className="w-2 h-2 rounded-full bg-[#247653]" />
          <span className="font-semibold text-[#252B27]">
            {readOnly
              ? "Silhueta com mapeamento de componentes e avarias:"
              : "Clique sobre o veículo, rodas ou componentes para apontar uma avaria:"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#737D75]">Total de Avarias:</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC4C4C] border border-[#FECACA]">
            {damages.length} {damages.length === 1 ? "registro" : "registros"}
          </span>
        </div>
      </div>

      {/* BARRA DE ATALHOS RÁPIDOS PARA COMPONENTES CRÍTICOS */}
      {!readOnly && (
        <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-2">
          <p className="text-[11px] font-semibold text-[#737D75] flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-[#247653]" />
            <span>Atalhos rápidos por componente (Rodas, Faróis, Interior):</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_FRONT_LEFT", 10, 24, "CURB_RASH")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-[#D97706]" />
              <span>Roda Diant. Esq.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_FRONT_RIGHT", 90, 24, "CURB_RASH")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-[#D97706]" />
              <span>Roda Diant. Dir.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_REAR_LEFT", 10, 75, "CURB_RASH")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-[#D97706]" />
              <span>Roda Tras. Esq.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("WHEEL_REAR_RIGHT", 90, 75, "CURB_RASH")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Disc className="w-3 h-3 text-[#D97706]" />
              <span>Roda Tras. Dir.</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("HEADLIGHTS", 50, 6, "CHIP")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Sparkles className="w-3 h-3 text-[#2563EB]" />
              <span>Faróis / Milhas</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("TAILLIGHTS", 50, 94, "CRACK")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <span className="w-2 h-2 rounded-full bg-[#DC4C4C]" />
              <span>Lanternas</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("INTERIOR", 50, 52, "RIPPED_TEAR")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <ShieldAlert className="w-3 h-3 text-[#7C3AED]" />
              <span>Interior / Bancos</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuickPin("PLASTICS", 18, 48, "SCRATCH")}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E9F3EC] text-[#343C36] hover:text-[#142D26] border border-[#E7EAE7] text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Sparkles className="w-3 h-3 text-[#737D75]" />
              <span>Partes Plásticas</span>
            </button>
          </div>
        </div>
      )}

      {/* ÁREA INTERATIVA DA SILHUETA VEICULAR COM COMPONENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Canvas da Silhueta */}
        <div className="lg:col-span-7 bg-[#F7F8F6] border border-[#E7EAE7] rounded-2xl p-4 flex flex-col items-center justify-center relative select-none">
          <div
            onClick={handleCanvasClick}
            className={`relative w-full max-w-[310px] h-[500px] flex items-center justify-center ${
              readOnly ? "cursor-default" : "cursor-crosshair"
            }`}
          >
            {/* SVG da Silhueta Veicular Superior Clean */}
            <svg
              viewBox="0 0 200 360"
              className="w-full h-full drop-shadow-sm stroke-[#9CA49E] fill-white text-[#343C36]"
            >
              {/* 4 RODAS E PNEUS */}
              <g className="cursor-pointer">
                <rect x="8" y="58" width="24" height="46" rx="6" fill="#343C36" stroke="#252B27" strokeWidth="1.5" />
                <rect x="12" y="64" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
                <line x1="20" y1="64" x2="20" y2="98" stroke="#9CA49E" strokeWidth="1" />
                <text x="20" y="83" fontSize="6" fontWeight="bold" fill="#252B27" textAnchor="middle">
                  RODA
                </text>
              </g>

              <g className="cursor-pointer">
                <rect x="168" y="58" width="24" height="46" rx="6" fill="#343C36" stroke="#252B27" strokeWidth="1.5" />
                <rect x="172" y="64" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
                <line x1="180" y1="64" x2="180" y2="98" stroke="#9CA49E" strokeWidth="1" />
                <text x="180" y="83" fontSize="6" fontWeight="bold" fill="#252B27" textAnchor="middle">
                  RODA
                </text>
              </g>

              <g className="cursor-pointer">
                <rect x="8" y="246" width="24" height="46" rx="6" fill="#343C36" stroke="#252B27" strokeWidth="1.5" />
                <rect x="12" y="252" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
                <line x1="20" y1="252" x2="20" y2="286" stroke="#9CA49E" strokeWidth="1" />
                <text x="20" y="271" fontSize="6" fontWeight="bold" fill="#252B27" textAnchor="middle">
                  RODA
                </text>
              </g>

              <g className="cursor-pointer">
                <rect x="168" y="246" width="24" height="46" rx="6" fill="#343C36" stroke="#252B27" strokeWidth="1.5" />
                <rect x="172" y="252" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
                <line x1="180" y1="252" x2="180" y2="286" stroke="#9CA49E" strokeWidth="1" />
                <text x="180" y="271" fontSize="6" fontWeight="bold" fill="#252B27" textAnchor="middle">
                  RODA
                </text>
              </g>

              {/* Contorno Geral da Carroceria */}
              <path
                d="M 50 30 C 50 15, 75 10, 100 10 C 125 10, 150 15, 150 30 L 158 90 C 162 120, 162 240, 158 280 L 150 340 C 145 352, 125 355, 100 355 C 75 355, 55 352, 50 340 L 42 280 C 38 240, 38 120, 42 90 Z"
                strokeWidth="2.5"
                stroke="#343C36"
                fill="#FFFFFF"
              />

              {/* Para-choque Dianteiro */}
              <path
                d="M 50 30 C 50 15, 75 10, 100 10 C 125 10, 150 15, 150 30 L 146 42 C 125 38, 75 38, 54 42 Z"
                fill="#F1F3F1"
                stroke="#9CA49E"
                strokeWidth="1"
              />
              <text x="100" y="28" fontSize="7" fontWeight="bold" fill="#343C36" textAnchor="middle">
                PARA-CHOQUE DIANT.
              </text>

              {/* Faróis Dianteiros */}
              <path d="M 52 32 C 55 22, 68 20, 72 32 Z" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.2" />
              <path d="M 148 32 C 145 22, 132 20, 128 32 Z" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.2" />

              {/* Capô Dianteiro */}
              <path
                d="M 56 46 L 144 46 L 146 76 L 54 76 Z"
                strokeWidth="1"
                stroke="#E7EAE7"
                fill="#F7F8F6"
              />
              <text x="100" y="64" fontSize="9" fontWeight="bold" fill="#252B27" textAnchor="middle">
                CAPÔ
              </text>

              {/* Para-brisa Dianteiro */}
              <path
                d="M 56 80 C 70 70, 130 70, 144 80 L 140 120 C 120 115, 80 115, 60 120 Z"
                strokeWidth="1.5"
                stroke="#9CA49E"
                fill="#E9F3EC"
              />
              <text x="100" y="100" fontSize="8" fontWeight="600" fill="#142D26" textAnchor="middle">
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
                stroke="#E7EAE7"
                fill="#FFFFFF"
              />
              <text x="100" y="185" fontSize="10" fontWeight="bold" fill="#252B27" textAnchor="middle">
                TETO
              </text>

              {/* Vidro Traseiro */}
              <path
                d="M 60 240 C 80 245, 120 245, 140 240 L 144 270 C 130 275, 70 275, 56 270 Z"
                strokeWidth="1.5"
                stroke="#9CA49E"
                fill="#E9F3EC"
              />
              <text x="100" y="260" fontSize="8" fontWeight="600" fill="#142D26" textAnchor="middle">
                VIDRO TRASEIRO
              </text>

              {/* Porta-malas Traseiro */}
              <path
                d="M 56 278 L 144 278 L 142 322 L 58 322 Z"
                strokeWidth="1"
                stroke="#E7EAE7"
                fill="#F7F8F6"
              />
              <text x="100" y="304" fontSize="9" fontWeight="bold" fill="#252B27" textAnchor="middle">
                PORTA-MALAS
              </text>

              {/* Lanternas Traseiras */}
              <path d="M 52 324 C 55 334, 68 335, 70 324 Z" fill="#FEF2F2" stroke="#DC4C4C" strokeWidth="1.2" />
              <path d="M 148 324 C 145 334, 132 335, 130 324 Z" fill="#FEF2F2" stroke="#DC4C4C" strokeWidth="1.2" />

              {/* Para-choque Traseiro */}
              <path
                d="M 58 326 C 75 330, 125 330, 142 326 L 150 340 C 145 352, 125 355, 100 355 C 75 355, 55 352, 50 340 Z"
                fill="#F1F3F1"
                stroke="#9CA49E"
                strokeWidth="1"
              />
              <text x="100" y="346" fontSize="7" fontWeight="bold" fill="#343C36" textAnchor="middle">
                PARA-CHOQUE TRAS.
              </text>

              {/* Retrovisores */}
              <g className="cursor-pointer">
                <rect x="22" y="94" width="16" height="24" rx="4" strokeWidth="1.5" stroke="#343C36" fill="#F1F3F1" />
                <rect x="24" y="96" width="6" height="20" rx="2" fill="#E9F3EC" />
              </g>

              <g className="cursor-pointer">
                <rect x="162" y="94" width="16" height="24" rx="4" strokeWidth="1.5" stroke="#343C36" fill="#F1F3F1" />
                <rect x="170" y="96" width="6" height="20" rx="2" fill="#E9F3EC" />
              </g>

              {/* Indicadores Laterais */}
              <text x="35" y="195" fontSize="7" fontWeight="600" fill="#737D75" textAnchor="middle" transform="rotate(-90 35,195)">
                LATERAL ESQ.
              </text>
              <text x="165" y="195" fontSize="7" fontWeight="600" fill="#737D75" textAnchor="middle" transform="rotate(90 165,195)">
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-md transition-transform ${
                    cfg.color
                  } ${isSelected ? "scale-125 ring-4 ring-[#247653]/30 z-20" : "scale-100 z-10"}`}
                  title={`${index + 1}. ${cfg.label} - ${areaLabels[d.area] || d.area}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-[#737D75] mt-2 text-center">
            Vista Superior 360º com 4 Rodas, Faróis, Para-choques e Retrovisores mapeados
          </p>
        </div>

        {/* Painel Lateral de Detalhes da Avaria Selecionada */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-[#E7EAE7] rounded-2xl p-4 shadow-xs">
          {selectedDamageIndex !== null && damages[selectedDamageIndex] ? (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E7EAE7]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#247653] text-white flex items-center justify-center text-xs font-bold">
                    {selectedDamageIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-[#252B27]">
                    Editar Avaria #{selectedDamageIndex + 1}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDamage(selectedDamageIndex)}
                    className="text-xs font-semibold text-[#DC4C4C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                )}
              </div>

              {/* Tipo de Avaria / Dano */}
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Tipo de Avaria / Dano
                </label>
                <select
                  disabled={readOnly}
                  value={damages[selectedDamageIndex].damageType}
                  onChange={(e) => handleUpdateSelected("damageType", e.target.value)}
                  className="dp-input"
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
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Região / Componente do Carro
                </label>
                <select
                  disabled={readOnly}
                  value={damages[selectedDamageIndex].area}
                  onChange={(e) => handleUpdateSelected("area", e.target.value)}
                  className="dp-input"
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
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Descrição / Local Exato
                </label>
                <textarea
                  disabled={readOnly}
                  rows={2}
                  placeholder="Ex: Ralado profundo no aro diamantado da roda..."
                  value={damages[selectedDamageIndex].description || ""}
                  onChange={(e) => handleUpdateSelected("description", e.target.value)}
                  className="dp-input"
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
                        <label className="text-xs font-semibold text-[#343C36]">
                          Fotografias da Avaria ({currentPhotos.length})
                        </label>
                        {currentPhotos.length > 0 && (
                          <span className="text-[11px] text-[#737D75]">
                            Clique na imagem para ampliar
                          </span>
                        )}
                      </div>

                      {currentPhotos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {currentPhotos.map((url, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative rounded-lg overflow-hidden border border-[#E7EAE7] group aspect-square bg-[#F7F8F6] shadow-xs"
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
                                  className="absolute top-1 right-1 p-1 rounded-full bg-white/90 hover:bg-[#DC4C4C] text-[#DC4C4C] hover:text-white transition-colors shadow-xs"
                                  title="Remover esta foto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#142D26]/85 text-[9px] font-bold text-white">
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
                            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#9CA49E] hover:border-[#247653] bg-[#F7F8F6] hover:bg-[#E9F3EC]/50 text-[#343C36] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Camera className="w-4 h-4 text-[#247653]" />
                            <span>
                              {uploading
                                ? "Enviando fotos..."
                                : currentPhotos.length > 0
                                  ? "Anexar mais fotos desta avaria"
                                  : "Tirar Foto(s) ou Anexar"}
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
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#737D75] space-y-2">
              <AlertCircle className="w-8 h-8 text-[#9CA49E]" />
              <p className="text-xs">
                {damages.length === 0
                  ? "Nenhuma avaria marcada. Clique sobre a silhueta, nas rodas ou use os atalhos rápidos acima."
                  : "Selecione um dos marcadores numerados no veículo para ver ou editar seus detalhes."}
              </p>
            </div>
          )}

          {/* Lista Resumo de Avarias */}
          {damages.length > 0 && (
            <div className="pt-3 border-t border-[#E7EAE7] mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#737D75] mb-2">
                Avarias Registradas ({damages.length})
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {damages.map((d, idx) => {
                  const cfg = damageTypeConfig[d.damageType] || damageTypeConfig.OTHER;
                  const photoCount =
                    d.photos && d.photos.length > 0
                      ? d.photos.length
                      : d.photoUrl
                        ? 1
                        : 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDamageIndex(idx)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                        selectedDamageIndex === idx
                          ? "bg-[#E9F3EC] border-[#247653]"
                          : "bg-[#F7F8F6] border-[#E7EAE7] hover:border-[#9CA49E]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-[#247653] text-[10px] font-bold text-white flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#252B27] truncate text-xs">{cfg.label}</p>
                          <p className="text-[11px] text-[#737D75] truncate">
                            {areaLabels[d.area] || d.area} {d.description ? `— ${d.description}` : ""}
                          </p>
                        </div>
                      </div>
                      {photoCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-[#247653] shrink-0 font-bold">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/85 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden border border-[#E7EAE7] shadow-2xl bg-white">
            <img
              src={previewImage}
              alt="Evidência ampliada"
              className="w-full h-full max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-[#142D26]/80 hover:bg-[#142D26] text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
