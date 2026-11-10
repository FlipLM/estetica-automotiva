"use client";

import { useState } from "react";
import { Box, Layers, Sparkles, LayoutGrid } from "lucide-react";
import { Inspection3D } from "./inspection/inspection-3d";
import { VehicleSilhouette2D } from "./vehicle-silhouette-2d";
import type { Anchor } from "./inspection/palio";

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
  | "GLASS"
  | string;

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
  | "OTHER"
  | string;

export interface DamagePin {
  id?: string;
  area: VehicleArea;
  damageType: DamageType;
  coordinateX?: number; // 0 a 100% (usado na silhueta 2D)
  coordinateY?: number; // 0 a 100% (usado na silhueta 2D)
  description?: string;
  photoUrl?: string;
  photos?: string[];
  anchor3D?: Anchor | any; // Âncora tridimensional
}

export interface VehicleSilhouette360Props {
  damages: DamagePin[];
  onChange: (damages: DamagePin[]) => void;
  readOnly?: boolean;
  defaultMode?: "3d" | "2d";
}

export function VehicleSilhouette360({
  damages,
  onChange,
  readOnly = false,
  defaultMode = "3d",
}: VehicleSilhouette360Props) {
  const [mode, setMode] = useState<"3d" | "2d">(defaultMode);

  return (
    <section className="rounded-2xl border border-[#DFE2DF] bg-white p-3.5 sm:p-5 text-[#142D26] shadow-xs relative space-y-4 max-w-full overflow-hidden">
      {/* Cabeçalho do Módulo de Vistoria com Alternador 3D / 2D */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#F2F4F1]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-[#142D26]">Mapeamento Visual de Avarias</h3>
            <span className="text-[10px] font-bold text-[#247653] bg-[#E9F3EC] px-2 py-0.5 rounded-full border border-[#247653]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {mode === "3d" ? "Modelo 3D Ativo" : "Silhueta 2D Ativa"}
            </span>
          </div>
          <p className="text-xs text-[#737D75] mt-0.5">
            {mode === "3d"
              ? "Gire o modelo 3D em 360°, abra portas e capô e clique sobre a peça para marcar o dano."
              : "Clique diretamente sobre a silhueta técnica para fixar os marcadores de avarias."}
          </p>
        </div>

        {/* Toggle Segmentado 3D / 2D */}
        <div className="grid grid-cols-2 sm:flex items-center p-1 bg-[#F2F4F1] rounded-xl border border-[#DFE2DF] w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "3d"
                ? "bg-white text-[#247653] shadow-xs border border-[#DFE2DF]/60"
                : "text-[#737D75] hover:text-[#142D26]"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Modelo 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("2d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "2d"
                ? "bg-white text-[#247653] shadow-xs border border-[#DFE2DF]/60"
                : "text-[#737D75] hover:text-[#142D26]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Silhueta 2D</span>
          </button>
        </div>
      </div>

      {/* Renderização Condicional do Modo Escolhido */}
      {mode === "3d" ? (
        <Inspection3D
          damages={damages}
          onChange={onChange}
          readOnly={readOnly}
          onFallbackTo2D={() => setMode("2d")}
        />
      ) : (
        <VehicleSilhouette2D
          damages={damages}
          onChange={onChange}
          readOnly={readOnly}
        />
      )}
    </section>
  );
}
