import React from "react";

/**
 * MiniVulpto — Emblema vetorial autoral inspirado no "V" aerodinâmico do Vulpto.
 * Substitui ícones genéricos (como estrelas/sparkles) por identidade própria da marca.
 */
export function MiniVulpto({ className = "w-4 h-4 text-[#247653]" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 5.5L12 20.5L12 14.5L7.2 5.5H3.5Z"
        fill="currentColor"
      />
      <path
        d="M20.5 5.5L12 20.5L12 14.5L16.8 5.5H20.5Z"
        fill="currentColor"
        fillOpacity="0.65"
      />
    </svg>
  );
}

export interface LandingDamagePin {
  id: string;
  areaLabel: string;
  damageLabel: string;
  detail: string;
  x: number;
  y: number;
  tone: "amber" | "red" | "blue";
}

export const INITIAL_HERO_PINS: LandingDamagePin[] = [
  {
    id: "front",
    areaLabel: "Para-choque Dianteiro",
    damageLabel: "Risco leve",
    detail: "Atrito superficial pré-existente na entrada",
    x: 49,
    y: 11,
    tone: "amber",
  },
  {
    id: "left",
    areaLabel: "Lateral Esquerda",
    damageLabel: "Amassado porta",
    detail: "Pequeno vinco na folha da porta dianteira",
    x: 24,
    y: 47,
    tone: "red",
  },
  {
    id: "wheel",
    areaLabel: "Roda Tras. Direita",
    damageLabel: "Ralado de guia",
    detail: "Borda diamantada marcada antes da lavagem",
    x: 89,
    y: 75,
    tone: "blue",
  },
];

const PIN_TONE_STYLES: Record<LandingDamagePin["tone"], { bg: string; ring: string }> = {
  amber: { bg: "bg-[#D97706]", ring: "ring-[#D97706]/30" },
  red: { bg: "bg-[#DC4C4C]", ring: "ring-[#DC4C4C]/30" },
  blue: { bg: "bg-[#2563EB]", ring: "ring-[#2563EB]/30" },
};

interface VehicleTopBlueprintProps {
  pins: LandingDamagePin[];
  selectedPinId: string | null;
  onSelectPin: (id: string) => void;
  onAddPin?: (xPercent: number, yPercent: number) => void;
  compact?: boolean;
}

/**
 * Silhueta veicular superior real compartilhada entre o Hero Interativo e o Showcase,
 * evitando duplicação do SVG e mantendo consistência visual com o módulo de Vistoria 360º.
 */
export function VehicleTopBlueprint({
  pins,
  selectedPinId,
  onSelectPin,
  onAddPin,
  compact = false,
}: VehicleTopBlueprintProps) {
  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onAddPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(92, Math.max(8, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(94, Math.max(6, ((e.clientY - rect.top) / rect.height) * 100));
    onAddPin(Number(x.toFixed(1)), Number(y.toFixed(1)));
  }

  return (
    <div
      onClick={handleCanvasClick}
      className={`relative mx-auto select-none ${
        compact ? "w-[190px] h-[310px] sm:w-[210px] sm:h-[340px]" : "w-[220px] h-[360px]"
      } ${onAddPin ? "cursor-crosshair" : "cursor-default"}`}
    >
      <svg
        viewBox="0 0 200 360"
        className="w-full h-full"
        role="img"
        aria-label="Silhueta técnica superior de vistoria veicular 360 graus"
      >
        {/* 4 Rodas e Pneus */}
        <g>
          <rect x="8" y="58" width="24" height="46" rx="6" fill="#252B27" stroke="#142D26" strokeWidth="1.5" />
          <rect x="12" y="64" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
          <rect x="168" y="58" width="24" height="46" rx="6" fill="#252B27" stroke="#142D26" strokeWidth="1.5" />
          <rect x="172" y="64" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
          <rect x="8" y="246" width="24" height="46" rx="6" fill="#252B27" stroke="#142D26" strokeWidth="1.5" />
          <rect x="12" y="252" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
          <rect x="168" y="246" width="24" height="46" rx="6" fill="#252B27" stroke="#142D26" strokeWidth="1.5" />
          <rect x="172" y="252" width="16" height="34" rx="4" fill="#F1F3F1" stroke="#9CA49E" strokeWidth="1" />
        </g>

        {/* Contorno da Carroceria */}
        <path
          d="M 50 30 C 50 15, 75 10, 100 10 C 125 10, 150 15, 150 30 L 158 90 C 162 120, 162 240, 158 280 L 150 340 C 145 352, 125 355, 100 355 C 75 355, 55 352, 50 340 L 42 280 C 38 240, 38 120, 42 90 Z"
          strokeWidth="2.5"
          stroke="#252B27"
          fill="#FFFFFF"
        />

        {/* Para-choque Dianteiro e Faróis */}
        <path
          d="M 50 30 C 50 15, 75 10, 100 10 C 125 10, 150 15, 150 30 L 146 42 C 125 38, 75 38, 54 42 Z"
          fill="#F1F3F1"
          stroke="#9CA49E"
          strokeWidth="1"
        />
        <path d="M 52 32 C 55 22, 68 20, 72 32 Z" fill="#E9F3EC" stroke="#247653" strokeWidth="1.2" />
        <path d="M 148 32 C 145 22, 132 20, 128 32 Z" fill="#E9F3EC" stroke="#247653" strokeWidth="1.2" />

        {/* Capô */}
        <path d="M 56 46 L 144 46 L 146 76 L 54 76 Z" strokeWidth="1" stroke="#E7EAE7" fill="#F7F8F6" />
        <text x="100" y="65" fontSize="8" fontWeight="700" fill="#737D75" textAnchor="middle">
          CAPÔ
        </text>

        {/* Para-brisa */}
        <path
          d="M 56 80 C 70 70, 130 70, 144 80 L 140 120 C 120 115, 80 115, 60 120 Z"
          strokeWidth="1.4"
          stroke="#9CA49E"
          fill="#E9F3EC"
        />

        {/* Teto */}
        <rect x="60" y="130" width="80" height="100" rx="8" strokeWidth="1.4" stroke="#E7EAE7" fill="#FFFFFF" />
        <text x="100" y="184" fontSize="9" fontWeight="700" fill="#252B27" textAnchor="middle">
          TETO
        </text>

        {/* Vidro Traseiro */}
        <path
          d="M 60 240 C 80 245, 120 245, 140 240 L 144 270 C 130 275, 70 275, 56 270 Z"
          strokeWidth="1.4"
          stroke="#9CA49E"
          fill="#E9F3EC"
        />

        {/* Porta-malas, Lanternas e Para-choque Traseiro */}
        <path d="M 56 278 L 144 278 L 142 322 L 58 322 Z" strokeWidth="1" stroke="#E7EAE7" fill="#F7F8F6" />
        <path d="M 52 324 C 55 334, 68 335, 70 324 Z" fill="#FEF2F2" stroke="#DC4C4C" strokeWidth="1.2" />
        <path d="M 148 324 C 145 334, 132 335, 130 324 Z" fill="#FEF2F2" stroke="#DC4C4C" strokeWidth="1.2" />
        <path
          d="M 58 326 C 75 330, 125 330, 142 326 L 150 340 C 145 352, 125 355, 100 355 C 75 355, 55 352, 50 340 Z"
          fill="#F1F3F1"
          stroke="#9CA49E"
          strokeWidth="1"
        />

        {/* Retrovisores */}
        <rect x="22" y="94" width="16" height="24" rx="4" strokeWidth="1.4" stroke="#343C36" fill="#F1F3F1" />
        <rect x="162" y="94" width="16" height="24" rx="4" strokeWidth="1.4" stroke="#343C36" fill="#F1F3F1" />
      </svg>

      {/* Marcadores de avaria */}
      {pins.map((pin, idx) => {
        const isSelected = selectedPinId === pin.id;
        const toneStyle = PIN_TONE_STYLES[pin.tone];
        return (
          <button
            key={pin.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin(pin.id);
            }}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            aria-label={`Selecionar avaria ${idx + 1}: ${pin.areaLabel}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white text-white text-[11px] font-bold flex items-center justify-center shadow-md transition-transform cursor-pointer ${
              toneStyle.bg
            } ${isSelected ? `scale-125 ring-4 ${toneStyle.ring} z-20` : "hover:scale-110 z-10"}`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}

export const PORT_PRICING_DEMO = [
  {
    key: "HATCH",
    label: "Hatch",
    packageTitle: "Vitrificação 9H + Polimento Técnico",
    price: 780,
    estimatedHours: "5h no Box",
  },
  {
    key: "SEDAN",
    label: "Sedan",
    packageTitle: "Vitrificação 9H + Polimento Técnico",
    price: 940,
    estimatedHours: "6h30 no Box",
  },
  {
    key: "SUV",
    label: "SUV / Picape",
    packageTitle: "Vitrificação 9H + Polimento Técnico",
    price: 1180,
    estimatedHours: "8h no Box",
  },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Preciso cadastrar cartão de crédito para iniciar o teste de 3 dias?",
    a: "Não. Você cria a conta da sua estética em menos de 1 minuto informando os dados do estabelecimento e do administrador, com acesso imediato ao onboarding por 72 horas sem compromisso.",
  },
  {
    q: "Qual é a diferença entre os perfis Administrador e Operador?",
    a: "O Administrador tem visão completa do faturamento, DRE gerencial, despesas, liquidação de comissões, estoque e CRM. O Operador acessa o pátio Kanban, recepção, vistorias 360º, ordens de serviço atribuídas e apenas seu próprio extrato de comissões.",
  },
  {
    q: "Como funciona a Vistoria Digital 360º na recepção?",
    a: "A equipe marca diretamente na silhueta veicular ou no modelo 3D as áreas com riscos, amassados, trincas ou queimaduras de verniz, registra nível de combustível, pertences deixados no interior e anexa fotos — gerando um laudo em PDF pronto para enviar via WhatsApp.",
  },
  {
    q: "Posso definir preços diferentes conforme o porte do veículo?",
    a: "Sim. O catálogo possui matriz automática para Hatch/Pequeno, Sedan/Médio, SUV/Picape, Moto e Utilitário Especial. Ao aprovar um orçamento e converter em Ordem de Serviço, os preços negociados são congelados historicamente.",
  },
  {
    q: "Como funciona o armazenamento de fotos em nuvem da empresa?",
    a: "As imagens de vistoria podem ser conectadas ao repositório em nuvem configurado pelo administrador da estética (Google Drive, Telegram Cloud, OneDrive, Dropbox ou S3/R2 com credenciais protegidas por criptografia AES-256-GCM), evitando lotar celulares da equipe.",
  },
  {
    q: "O cálculo do DRE e das comissões é automático?",
    a: "Sim. Cada Ordem de Serviço concluída alimenta o fluxo de receitas em regime de caixa, apura taxas de maquininha, custos variáveis de insumos e comissões por colaborador e consolida despesas fixas para mostrar o lucro líquido operacional real.",
  },
];
