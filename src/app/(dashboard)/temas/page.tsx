"use client";

import { useState } from "react";
import {
  Sparkles,
  Car,
  Wrench,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Palette,
  Eye,
  Sliders,
  Check,
} from "lucide-react";

interface ThemeOption {
  id: string;
  num: number;
  name: string;
  tagline: string;
  category: string;
  fontHeadline: string;
  fontBody: string;
  fontUrl: string;
  colors: {
    bg: string;
    card: string;
    border: string;
    text: string;
    subtext: string;
    accent: string;
    accentHover: string;
    badgeBg: string;
    badgeText: string;
  };
  stylePreset: {
    rounded: string;
    shadow: string;
    borderWidth: string;
    cardPadding: string;
    fontHeadlineStyle: string;
  };
  characteristics: string[];
}

const THEMES: ThemeOption[] = [
  {
    id: "apex_motorsport",
    num: 1,
    name: "Apex Motorsport",
    tagline: "Telemetria de F1, Porsche GT3 & Precisão Mecânica",
    category: "Racing / Performance",
    fontHeadline: "'Chakra Petch', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap",
    colors: {
      bg: "#08090b",
      card: "#121418",
      border: "#242933",
      text: "#f8fafc",
      subtext: "#8692a6",
      accent: "#e11d48", // Vermelho Brembo
      accentHover: "#be123c",
      badgeBg: "rgba(225, 29, 72, 0.15)",
      badgeText: "#fb7185",
    },
    stylePreset: {
      rounded: "rounded-md",
      shadow: "shadow-none",
      borderWidth: "border",
      cardPadding: "p-4",
      fontHeadlineStyle: "uppercase tracking-wider font-bold",
    },
    characteristics: [
      "Bordas afiadas e angulares (estilo cockpit de competição)",
      "Acento vermelho pinça de freio Brembo + fibra de carbono",
      "Tipografia técnica de telemetria nos números de OS e placas",
      "Alta densidade operacional para trabalho ágil no pátio",
    ],
  },
  {
    id: "boutique_ceramic",
    num: 2,
    name: "Boutique Ceramic Detailing",
    tagline: "Ateliê de Luxo, Alta Costura & Vitrificação Nobre",
    category: "Ultra-Luxo / Connoisseur",
    fontHeadline: "'Playfair Display', serif",
    fontBody: "'Inter', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@300;400;500&display=swap",
    colors: {
      bg: "#0c0d0e",
      card: "#151719",
      border: "#2a2723",
      text: "#f5f5f7",
      subtext: "#9a968f",
      accent: "#c5a880", // Ouro Champanhe Acetinado
      accentHover: "#b39366",
      badgeBg: "rgba(197, 168, 128, 0.12)",
      badgeText: "#dfc8a8",
    },
    stylePreset: {
      rounded: "rounded-xl",
      shadow: "shadow-xl shadow-black/40",
      borderWidth: "border",
      cardPadding: "p-6",
      fontHeadlineStyle: "font-normal italic tracking-normal",
    },
    characteristics: [
      "Tipografia serifada editorial clássica (Playfair Display)",
      "Acentos em bronze acetinado e ouro champanhe sobre preto ônix",
      "Transmite serviço de ticket alto (PPF completo e vitrificação)",
      "Espaçamentos elegantes com respiro generoso e sofisticado",
    ],
  },
  {
    id: "snapon_industrial",
    num: 3,
    name: "Snap-on Industrial Pro",
    tagline: "Aço Escovado, Laranja Mecânico & Oficina Pesada",
    category: "Industrial / Heavy Workshop",
    fontHeadline: "'Barlow Condensed', sans-serif",
    fontBody: "'Work Sans', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Work+Sans:wght@400;500;600&display=swap",
    colors: {
      bg: "#121316",
      card: "#1c1e24",
      border: "#2e323b",
      text: "#ffffff",
      subtext: "#949ba8",
      accent: "#ea580c", // Laranja Mecânico Snap-on
      accentHover: "#c2410c",
      badgeBg: "rgba(234, 88, 12, 0.18)",
      badgeText: "#fb923c",
    },
    stylePreset: {
      rounded: "rounded-lg",
      shadow: "shadow-md shadow-black/50",
      borderWidth: "border-2",
      cardPadding: "p-4",
      fontHeadlineStyle: "uppercase tracking-widest font-black text-lg",
    },
    characteristics: [
      "Cabeçalhos em caixa alta condensada com presença física imponente",
      "Laranja industrial elétrico com botões robustos de alto contraste",
      "Perfeito para leitura sob o sol do pátio ou na mão de lavador",
      "Sensação de ferramenta de trabalho pesada e indestrutível",
    ],
  },
  {
    id: "swiss_neobrutalism",
    num: 4,
    name: "Swiss Neo-Brutalism",
    tagline: "Bordas Fortes 2px, Sombras Sólidas & Zero Clichês",
    category: "Design Moderno / Autoral",
    fontHeadline: "'Syne', sans-serif",
    fontBody: "'Space Grotesk', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@500;600&display=swap",
    colors: {
      bg: "#f4f1ea", // Versão Brutalista Creme / Papel de projeto
      card: "#ffffff",
      border: "#18181b",
      text: "#18181b",
      subtext: "#52525b",
      accent: "#2563eb", // Azul Klein
      accentHover: "#1d4ed8",
      badgeBg: "#fef08a",
      badgeText: "#854d0e",
    },
    stylePreset: {
      rounded: "rounded-xl",
      shadow: "shadow-[4px_4px_0px_#18181b]",
      borderWidth: "border-2",
      cardPadding: "p-5",
      fontHeadlineStyle: "font-black tracking-tight",
    },
    characteristics: [
      "Bordas sólidas pretas de 2px com sombras duras deslocadas",
      "Contraste vigoroso em fundo claro (ou dark com amarelo cromo)",
      "100% autoral: impossível confundir com template ou IA padrão",
      "Extremamente expressivo, jovem, descolado e memorável",
    ],
  },
  {
    id: "linear_craft",
    num: 5,
    name: "Linear Craft Precision",
    tagline: "Software de Elite, Micro-Interações & Alta Densidade",
    category: "Modern SaaS / Craft",
    fontHeadline: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
    colors: {
      bg: "#0c0e12",
      card: "#14171f",
      border: "#202533",
      text: "#f3f4f6",
      subtext: "#7a8294",
      accent: "#5e6ad2", // Roxo Linear / Raycast
      accentHover: "#4f5bc4",
      badgeBg: "rgba(94, 106, 210, 0.15)",
      badgeText: "#a5b4fc",
    },
    stylePreset: {
      rounded: "rounded-lg",
      shadow: "shadow-xs",
      borderWidth: "border",
      cardPadding: "p-3.5",
      fontHeadlineStyle: "-tracking-tight font-semibold",
    },
    characteristics: [
      "Camadas de cinza grafite balanceadas milimetricamente",
      "Alta densidade de dados com atalhos de teclado aparentes",
      "Sem firulas, sem gradientes cafonas, foco na velocidade",
      "A estética adorada pelas maiores startups de tecnologia do mundo",
    ],
  },
  {
    id: "clean_lab",
    num: 6,
    name: "Clean Lab / Hexagon Studio",
    tagline: "Luz Branca, Assepsia Total & Box de Detailing LED",
    category: "Scandinavian Clean / Light",
    fontHeadline: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
    colors: {
      bg: "#f8fafc",
      card: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      subtext: "#64748b",
      accent: "#0ea5e9", // Azul Céu Cristal
      accentHover: "#0284c7",
      badgeBg: "#e0f2fe",
      badgeText: "#0369a1",
    },
    stylePreset: {
      rounded: "rounded-xl",
      shadow: "shadow-sm shadow-slate-200",
      borderWidth: "border",
      cardPadding: "p-5",
      fontHeadlineStyle: "font-bold tracking-tight text-slate-900",
    },
    characteristics: [
      "Fundo claro luminoso que simula um box de polimento profissional",
      "Elimina instantaneamente a sensação de 'tela escura gerada por IA'",
      "Contraste limpo, legibilidade perfeita e sensação cirúrgica",
      "Transmite organização, transparência e capricho técnico",
    ],
  },
  {
    id: "jdm_retro_tuner",
    num: 7,
    name: "JDM Retro-Tuner",
    tagline: "Era de Ouro dos Esportivos Japoneses & Painel Digital",
    category: "Cyber Retro / Tuner",
    fontHeadline: "'Rajdhani', sans-serif",
    fontBody: "'Rajdhani', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap",
    colors: {
      bg: "#050608",
      card: "#0d0f14",
      border: "#1c2230",
      text: "#f0fdf4",
      subtext: "#6b7280",
      accent: "#22c55e", // Verde Tacômetro Fluorescente
      accentHover: "#16a34a",
      badgeBg: "rgba(34, 197, 94, 0.12)",
      badgeText: "#4ade80",
    },
    stylePreset: {
      rounded: "rounded-md",
      shadow: "shadow-none",
      borderWidth: "border",
      cardPadding: "p-4",
      fontHeadlineStyle: "uppercase tracking-widest font-bold",
    },
    characteristics: [
      "Elementos de cluster digital e medidores de tacômetro",
      "Verde fósforo e laranja neon com estética de scanner automotivo",
      "Fortíssima conexão com entusiastas de carros turbo e esportivos",
      "Placas e dados com aparência de display digital LCD clássico",
    ],
  },
  {
    id: "tactical_dispatch",
    num: 8,
    name: "Tactical Dispatch Terminal",
    tagline: "Despacho Aéreo, Pátio Militar & Alta Densidade Monospace",
    category: "Utilitário / Command Center",
    fontHeadline: "'Courier New', monospace",
    fontBody: "'Courier New', monospace",
    fontUrl: "",
    colors: {
      bg: "#000000",
      card: "#0f0f10",
      border: "#27272a",
      text: "#e4e4e7",
      subtext: "#71717a",
      accent: "#f59e0b", // Âmbar Radar
      accentHover: "#d97706",
      badgeBg: "rgba(245, 158, 11, 0.15)",
      badgeText: "#fbbf24",
    },
    stylePreset: {
      rounded: "rounded-none", // Reto 100%
      shadow: "shadow-none",
      borderWidth: "border",
      cardPadding: "p-3",
      fontHeadlineStyle: "uppercase tracking-wider font-bold",
    },
    characteristics: [
      "100% Monospaçado e cantos retos sem arredondamento",
      "Estilo tela de comando tático militar / terminal de aviação",
      "Visão tabular ultra-otimizada para pátios com mais de 30 veículos",
      "Zero distrações decorativas, foco absoluto em dados brutos e velocidade",
    ],
  },
  {
    id: "heritage_ledger",
    num: 9,
    name: "Heritage Garage Ledger",
    tagline: "Prancheta de Alumínio, Papel Kraft & Carimbos de Oficina",
    category: "Tradicional / Documental",
    fontHeadline: "'Georgia', serif",
    fontBody: "'Courier New', monospace",
    fontUrl: "",
    colors: {
      bg: "#f5f2eb",
      card: "#ffffff",
      border: "#dcd6ca",
      text: "#1c1917",
      subtext: "#78716c",
      accent: "#991b1b", // Vermelho Carimbo de Cartório
      accentHover: "#7f1d1d",
      badgeBg: "rgba(153, 27, 27, 0.1)",
      badgeText: "#991b1b",
    },
    stylePreset: {
      rounded: "rounded-sm",
      shadow: "shadow-sm shadow-stone-300",
      borderWidth: "border",
      cardPadding: "p-5",
      fontHeadlineStyle: "font-bold tracking-tight",
    },
    characteristics: [
      "Releitura visual de bloco de OS de papel e fichas de cliente",
      "Carimbos de status em vermelho bordô (PAGO / APROVADO)",
      "Elimina a frieza digital trazendo o charme das oficinas históricas",
      "Passa muita credibilidade e solidez institucional",
    ],
  },
  {
    id: "carbon_stealth",
    num: 10,
    name: "Forged Carbon & Acid Lime",
    tagline: "Fibra de Carbono Forjada, Preto Fosco & Verde Ácido",
    category: "Hypercar / Stealth",
    fontHeadline: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap",
    colors: {
      bg: "#050505",
      card: "#111111",
      border: "#222222",
      text: "#ffffff",
      subtext: "#737373",
      accent: "#a3e635", // Verde Lima Ácido / Lamborghini
      accentHover: "#84cc16",
      badgeBg: "rgba(163, 230, 53, 0.15)",
      badgeText: "#bef264",
    },
    stylePreset: {
      rounded: "rounded-xl",
      shadow: "shadow-2xl shadow-black",
      borderWidth: "border",
      cardPadding: "p-5",
      fontHeadlineStyle: "font-black tracking-tight",
    },
    characteristics: [
      "Preto fosco profundo com ponto de foco em verde-limão ácido",
      "Inspirado na customização de supercarros (Lamborghini / AMG Black Series)",
      "Imponente, agressivo e moderno, com contraste cirúrgico",
      "Os botões e status saltam aos olhos do operador instantaneamente",
    ],
  },
];

export default function TemasShowcasePage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(THEMES[0]);

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Font Loader */}
      {selectedTheme.fontUrl && (
        <link rel="stylesheet" href={selectedTheme.fontUrl} />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-500" />
            <span>Showcase Visual: 10 Identidades Anti-IA para o Sistema</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Clique em cada tema abaixo para visualizar a simulação em tempo real de cards, placas, botões e tipografia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Tema ativo no preview:</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
            #{selectedTheme.num} {selectedTheme.name}
          </span>
        </div>
      </div>

      {/* CARROSSEL / SELETOR DOS 10 TEMAS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {THEMES.map((t) => {
          const isSelected = selectedTheme.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                isSelected
                  ? "bg-slate-800 border-blue-500 ring-2 ring-blue-500/30"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-blue-400">#{t.num}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                    {t.category.split("/")[0]}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {t.name}
                </h4>
              </div>

              {/* Mini Paleta de Cores */}
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/40"
                  style={{ backgroundColor: t.colors.bg }}
                  title="Fundo"
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/40"
                  style={{ backgroundColor: t.colors.card }}
                  title="Card"
                />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/40"
                  style={{ backgroundColor: t.colors.accent }}
                  title="Acento"
                />
                {isSelected && (
                  <Check className="w-3 h-3 text-blue-400 ml-auto" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* SIMULADOR AO VIVO DO TEMA SELECIONADO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">
              Preview Interativo em Tempo Real — {selectedTheme.name}
            </h2>
          </div>
          <span className="text-xs text-slate-400 italic">
            {selectedTheme.tagline}
          </span>
        </div>

        {/* CONTAINER COM O TEMA APLICADO */}
        <div
          style={{
            backgroundColor: selectedTheme.colors.bg,
            color: selectedTheme.colors.text,
            fontFamily: selectedTheme.fontBody,
            borderColor: selectedTheme.colors.border,
          }}
          className={`border ${selectedTheme.stylePreset.rounded} p-6 sm:p-8 space-y-6 transition-colors duration-200 shadow-2xl relative overflow-hidden`}
        >
          {/* Top Bar do Sistema no Tema */}
          <div
            style={{
              borderColor: selectedTheme.colors.border,
            }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: selectedTheme.colors.accent,
                  color: selectedTheme.id === "clean_lab" || selectedTheme.id === "swiss_neobrutalism" ? "#ffffff" : "#000000",
                }}
                className={`w-10 h-10 ${selectedTheme.stylePreset.rounded} flex items-center justify-center font-bold text-base shadow-sm`}
              >
                <Car className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: selectedTheme.fontHeadline,
                  }}
                  className={`text-lg ${selectedTheme.stylePreset.fontHeadlineStyle}`}
                >
                  Prime Detailing OS
                </h3>
                <p
                  style={{ color: selectedTheme.colors.subtext }}
                  className="text-xs"
                >
                  Estúdio de Estética & Polimento Técnico de Alta Performance
                </p>
              </div>
            </div>

            {/* Ações / Botões do Header no Tema */}
            <div className="flex items-center gap-2.5">
              <button
                style={{
                  backgroundColor: selectedTheme.colors.accent,
                  color: selectedTheme.id === "carbon_stealth" ? "#000000" : "#ffffff",
                }}
                className={`px-4 py-2 ${selectedTheme.stylePreset.rounded} text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Nova OS no Pátio</span>
              </button>

              <button
                style={{
                  backgroundColor: selectedTheme.colors.card,
                  borderColor: selectedTheme.colors.border,
                  color: selectedTheme.colors.text,
                }}
                className={`px-3 py-2 ${selectedTheme.stylePreset.rounded} border text-xs font-medium hover:opacity-80 transition cursor-pointer`}
              >
                Checklist 360º
              </button>
            </div>
          </div>

          {/* Cards de Métricas Rápidas (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              style={{
                backgroundColor: selectedTheme.colors.card,
                borderColor: selectedTheme.colors.border,
              }}
              className={`${selectedTheme.stylePreset.borderWidth} ${selectedTheme.stylePreset.rounded} ${selectedTheme.stylePreset.shadow} ${selectedTheme.stylePreset.cardPadding} space-y-1`}
            >
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: selectedTheme.colors.subtext }}>
                  Veículos em Atendimento (Pátio)
                </span>
                <Car className="w-4 h-4" style={{ color: selectedTheme.colors.accent }} />
              </div>
              <p
                style={{ fontFamily: selectedTheme.fontHeadline }}
                className="text-2xl font-bold tracking-tight"
              >
                14 Veículos
              </p>
              <p style={{ color: selectedTheme.colors.subtext }} className="text-[11px]">
                5 no Polimento • 3 na Vitrificação • 6 na Secagem
              </p>
            </div>

            <div
              style={{
                backgroundColor: selectedTheme.colors.card,
                borderColor: selectedTheme.colors.border,
              }}
              className={`${selectedTheme.stylePreset.borderWidth} ${selectedTheme.stylePreset.rounded} ${selectedTheme.stylePreset.shadow} ${selectedTheme.stylePreset.cardPadding} space-y-1`}
            >
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: selectedTheme.colors.subtext }}>
                  Faturamento do Mês
                </span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p
                style={{ fontFamily: selectedTheme.fontHeadline }}
                className="text-2xl font-bold tracking-tight"
              >
                R$ 48.750,00
              </p>
              <p style={{ color: selectedTheme.colors.subtext }} className="text-[11px]">
                +18,4% acima da meta estabelecida
              </p>
            </div>

            <div
              style={{
                backgroundColor: selectedTheme.colors.card,
                borderColor: selectedTheme.colors.border,
              }}
              className={`${selectedTheme.stylePreset.borderWidth} ${selectedTheme.stylePreset.rounded} ${selectedTheme.stylePreset.shadow} ${selectedTheme.stylePreset.cardPadding} space-y-1`}
            >
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: selectedTheme.colors.subtext }}>
                  Ticket Médio por Carro
                </span>
                <TrendingUp className="w-4 h-4" style={{ color: selectedTheme.colors.accent }} />
              </div>
              <p
                style={{ fontFamily: selectedTheme.fontHeadline }}
                className="text-2xl font-bold tracking-tight"
              >
                R$ 1.340,00
              </p>
              <p style={{ color: selectedTheme.colors.subtext }} className="text-[11px]">
                Foco em pacotes cerâmicos e PPF
              </p>
            </div>
          </div>

          {/* Exemplo de Card de OS e Atendimento no Pátio */}
          <div
            style={{
              backgroundColor: selectedTheme.colors.card,
              borderColor: selectedTheme.colors.border,
            }}
            className={`${selectedTheme.stylePreset.borderWidth} ${selectedTheme.stylePreset.rounded} ${selectedTheme.stylePreset.shadow} p-5 space-y-4`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-current/10">
              <div className="flex items-center gap-3">
                <span
                  style={{
                    backgroundColor: selectedTheme.colors.badgeBg,
                    color: selectedTheme.colors.badgeText,
                    borderColor: selectedTheme.colors.border,
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded font-mono border"
                >
                  OS #1042
                </span>

                <div className="flex items-center gap-2">
                  <span
                    style={{
                      borderColor: selectedTheme.colors.border,
                      backgroundColor: selectedTheme.id === "clean_lab" ? "#f1f5f9" : "rgba(255,255,255,0.06)",
                    }}
                    className="px-2 py-0.5 rounded font-mono font-bold text-xs border tracking-wider"
                  >
                    BRA2E19
                  </span>
                  <span className="font-bold text-sm">
                    Porsche 911 Carrera S (Preto Mythos)
                  </span>
                </div>
              </div>

              <span
                style={{
                  backgroundColor: selectedTheme.colors.badgeBg,
                  color: selectedTheme.colors.badgeText,
                }}
                className="text-xs px-3 py-1 rounded-full font-semibold self-start sm:self-center"
              >
                Em Andamento • Box 2 (Polimento)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span style={{ color: selectedTheme.colors.subtext }} className="block text-[11px] mb-0.5">
                  Cliente Responsável
                </span>
                <span className="font-semibold">Rodrigo Silveira da Cunha</span>
                <span style={{ color: selectedTheme.colors.subtext }} className="block text-[10px]">
                  (61) 98112-2091 • Cliente VIP
                </span>
              </div>

              <div>
                <span style={{ color: selectedTheme.colors.subtext }} className="block text-[11px] mb-0.5">
                  Serviços em Execução
                </span>
                <span className="font-semibold">
                  Polimento Técnico 3 Etapas + Vitrificação Gyeon 9H
                </span>
                <span style={{ color: selectedTheme.colors.subtext }} className="block text-[10px]">
                  Proteção Cerâmica de Pintura & Rodas
                </span>
              </div>

              <div className="sm:text-right">
                <span style={{ color: selectedTheme.colors.subtext }} className="block text-[11px] mb-0.5">
                  Valor Total da Proposta
                </span>
                <span
                  style={{
                    fontFamily: selectedTheme.fontHeadline,
                    color: selectedTheme.colors.accent,
                  }}
                  className="text-lg font-bold"
                >
                  R$ 3.850,00
                </span>
                <span style={{ color: selectedTheme.colors.subtext }} className="block text-[10px]">
                  Pagamento: Entrada 50% PIX + 50% na Entrega
                </span>
              </div>
            </div>

            {/* Checklist de Entrada & Avarias */}
            <div
              style={{
                backgroundColor: selectedTheme.id === "clean_lab" ? "#f8fafc" : "rgba(0,0,0,0.25)",
                borderColor: selectedTheme.colors.border,
              }}
              className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  Checklist 360º de entrada concluído com <strong>2 avarias mapeadas</strong> (Roda dianteira direita ralada na guia + Risco superficial no para-choque).
                </span>
              </div>
              <button
                style={{
                  color: selectedTheme.colors.accent,
                }}
                className="font-bold underline text-xs cursor-pointer hover:opacity-80 shrink-0"
              >
                Ver Fotos da Vistoria &rarr;
              </button>
            </div>
          </div>

          {/* Destaque das Características do Tema */}
          <div
            style={{
              borderColor: selectedTheme.colors.border,
            }}
            className="pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"
          >
            {selectedTheme.characteristics.map((char, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: selectedTheme.colors.accent }}
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                />
                <span style={{ color: selectedTheme.colors.subtext }}>{char}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guia de Seleção */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-white text-sm">Gostou de alguma dessas identidades visuais?</p>
          <p className="text-blue-300 text-xs mt-0.5">
            Você pode me dizer qual número (#1 ao #10) mais combina com seu público, ou pedir para combinar traços de duas delas (ex: a tipografia do #1 com as cores do #10).
          </p>
        </div>
      </div>
    </div>
  );
}

