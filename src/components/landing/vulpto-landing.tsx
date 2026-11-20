"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Car,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Eye,
  Layers,
  Menu,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  FAQ_ITEMS,
  INITIAL_HERO_PINS,
  LandingDamagePin,
  MiniVulpto,
  PORT_PRICING_DEMO,
  VehicleTopBlueprint,
} from "./mini-vulpto";
import { LandingModulesCarousel } from "./landing-carousel";
import { LandingShowcase } from "./landing-showcase";
import {
  LandingLegalModal,
  LandingMobileDrawer,
  LandingRegisterModal,
} from "./landing-modals";

export interface VulptoSessionUser {
  name: string;
  role: "ADMIN" | "OPERATOR";
  tenantName?: string;
}

interface VulptoLandingProps {
  sessionUser: VulptoSessionUser | null;
}

const IMPACT_METRICS = [
  {
    id: "vistoria",
    target: 360,
    suffix: "°",
    title: "Vistoria Digital & 3D",
    subtitle: "Silhueta interativa e laudo PDF",
    footer: "Recepção Segura",
    bgImage: "/brand/bg-vistoria-360.svg",
    icon: ClipboardCheck,
  },
  {
    id: "portes",
    target: 5,
    suffix: " Portes",
    title: "Matriz de Precificação",
    subtitle: "Preços congelados por veículo na OS",
    footer: "Zero Achismo",
    bgImage: "/brand/bg-patio-detailing.svg",
    icon: Car,
  },
  {
    id: "modulos",
    target: 19,
    suffix: " Módulos",
    title: "Operação & DRE Real",
    subtitle: "Do pátio Kanban ao lucro líquido",
    footer: "Regime de Caixa",
    bgImage: "/brand/bg-dre-financeiro.svg",
    icon: Layers,
  },
  {
    id: "trial",
    target: 72,
    suffix: " Horas",
    title: "Trial Sem Cartão",
    subtitle: "Acesso completo para testar no pátio",
    footer: "Onboarding Guiado",
    bgImage: "/brand/bg-estoque-quimico.svg",
    icon: Clock,
  },
];

export function VulptoLanding({ sessionUser }: VulptoLandingProps) {
  // Estado do Hero Interativo (Vistoria ao vivo + Seletor de Porte)
  const [heroPins, setHeroPins] = useState<LandingDamagePin[]>(INITIAL_HERO_PINS);
  const [selectedHeroPinId, setSelectedHeroPinId] = useState<string>("front");
  const [selectedPort, setSelectedPort] = useState<"HATCH" | "SEDAN" | "SUV">("SUV");
  const [heroParallax, setHeroParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estado dos Contadores Animados no Scroll
  const metricsRef = useRef<HTMLElement>(null);
  const [metricValues, setMetricValues] = useState<number[]>(
    IMPACT_METRICS.map((m) => m.target)
  );
  const hasAnimatedMetricsRef = useRef(false);

  // Estado do Simulador Operacional, Planos, FAQ e Modais/Drawer
  const [vehiclesPerMonth, setVehiclesPerMonth] = useState<number>(90);
  const [averageTicket, setAverageTicket] = useState<number>(320);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<"TERMS" | "PRIVACY" | null>(null);

  const dashboardHref =
    sessionUser?.role === "OPERATOR" ? "/patio" : "/dashboard";

  // Contadores animados ao entrar na seção de métricas (mantendo fallback imediato em reduced-motion)
  useEffect(() => {
    const node = metricsRef.current;
    if (!node || typeof window === "undefined") return undefined;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || hasAnimatedMetricsRef.current) return;
        hasAnimatedMetricsRef.current = true;

        const duration = 900;
        const start = performance.now();

        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setMetricValues(
            IMPACT_METRICS.map((item) => Math.max(1, Math.round(item.target * eased)))
          );
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            setMetricValues(IMPACT_METRICS.map((item) => item.target));
          }
        };

        requestAnimationFrame(step);
        observer.disconnect();
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function handleHeroMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroParallax({ x: nx * 10, y: ny * 8 });
  }

  function handleHeroMouseLeave() {
    setHeroParallax({ x: 0, y: 0 });
  }

  function handleAddHeroPin(xPercent: number, yPercent: number) {
    if (heroPins.length >= 6) return;
    const nextIndex = heroPins.length + 1;
    const areaLabel =
      yPercent < 25
        ? "Região Dianteira"
        : yPercent > 75
          ? "Região Traseira"
          : xPercent < 34
            ? "Lateral Esquerda"
            : xPercent > 66
              ? "Lateral Direita"
              : "Teto / Capô";
    const newPin: LandingDamagePin = {
      id: `custom-${nextIndex}-${Date.now()}`,
      areaLabel,
      damageLabel: "Ponto registrado na vistoria",
      detail: `Coordenada ${xPercent}% × ${yPercent}% pronta para anexar foto`,
      x: xPercent,
      y: yPercent,
      tone: "amber",
    };
    setHeroPins((prev) => [...prev, newPin]);
    setSelectedHeroPinId(newPin.id);
  }

  function handleResetHeroPins() {
    setHeroPins(INITIAL_HERO_PINS);
    setSelectedHeroPinId(INITIAL_HERO_PINS[0].id);
  }

  const activeHeroPin =
    heroPins.find((p) => p.id === selectedHeroPinId) || heroPins[0];
  const activePortInfo =
    PORT_PRICING_DEMO.find((p) => p.key === selectedPort) || PORT_PRICING_DEMO[2];

  // Cálculos transparentes do simulador operacional
  const estimatedMonthlyRevenue = vehiclesPerMonth * averageTicket;
  const estimatedCrmRecovery = Math.round(estimatedMonthlyRevenue * 0.1);
  const hoursSavedPerMonth = Math.round((vehiclesPerMonth * 15) / 60);

  function scrollToTop() {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }

  return (
    <div className="min-h-screen w-full max-w-full bg-[#F7F8F6] text-[#252B27] font-editorial antialiased overflow-x-clip">
      {/* 1. NAVBAR EDITORIAL LIMPA (SEM BARRA EXTRA ACIMA DO HEADER) */}
      <header className="sticky top-0 z-40 bg-[#F7F8F6]/90 backdrop-blur-md border-b border-[#E7EAE7]">
        <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between gap-4">
          <a
            href="#"
            className="flex items-center gap-3 min-w-0 focus:outline-none focus:ring-2 focus:ring-[#247653] rounded-2xl p-1"
            aria-label="Vulpto — Página Inicial"
          >
            <div className="w-11 h-11 rounded-xl bg-[#0B0F0D] border border-[#247653]/40 flex items-center justify-center p-1 shadow-xs shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vulpto_logo.png"
                alt="Vulpto Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <span className="font-heading text-xl font-extrabold tracking-tight text-[#142D26] block leading-none">
                VULPTO
              </span>
              <span className="block text-[11px] font-semibold text-[#737D75] mt-0.5 truncate">
                Estética Automotiva &amp; Detailing
              </span>
            </div>
          </a>

          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-2"
            aria-label="Navegação principal"
          >
            {[
              { href: "#diferenciais", label: "Diferenciais" },
              { href: "#metrics-panel", label: "Impacto" },
              { href: "#showcase", label: "Módulos" },
              { href: "#roi", label: "Simulador" },
              { href: "#planos", label: "Planos" },
              { href: "#faq", label: "Dúvidas" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3.5 py-1.5 text-sm font-semibold tracking-tight text-[#252B27] hover:text-[#247653] hover:bg-[#E9F3EC]/70 rounded-full transition-all"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href={sessionUser ? dashboardHref : "/login"}
              className="px-4 py-2 text-sm font-semibold text-[#252B27] hover:text-[#247653] hover:bg-[#E9F3EC]/60 rounded-full transition-colors"
            >
              {sessionUser ? "Acessar Painel" : "Entrar"}
            </Link>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="min-h-[44px] px-6 rounded-full bg-[#247653] hover:bg-[#142D26] text-white text-sm font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <MiniVulpto className="w-4 h-4 text-[#A8D1B8]" />
              <span>Testar 3 Dias Grátis</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-12 h-12 rounded-full bg-white border border-[#E7EAE7] text-[#252B27] flex items-center justify-center cursor-pointer"
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <LandingMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        dashboardHref={dashboardHref}
        isAuthenticated={Boolean(sessionUser)}
      />

      {/* 2. HERO EDITORIAL ASSIMÉTRICO (7 COL + 5 COL) COM VISTORIA 360º AO VIVO */}
      <section className="relative pt-10 pb-14 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24 border-b border-[#E7EAE7] bg-gradient-to-b from-[#F7F8F6] via-[#E9F3EC]/45 to-[#F7F8F6]">
        <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Coluna Esquerda: Hierarquia Editorial Limpa + 4 Cards de Impacto Direto */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left min-w-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold uppercase tracking-wider border border-[#247653]/20 max-w-full">
                <MiniVulpto className="w-4 h-4 text-[#247653] shrink-0" />
                <span className="truncate">
                  Gestão Automotiva &amp; Detailing
                </span>
              </div>

              <h1 className="font-heading text-3xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-extrabold text-[#142D26] tracking-tight leading-[1.1] [text-wrap:balance]">
                Controle o pátio com{" "}
                <span className="text-[#247653]">vistoria 360°</span> e lucro real.
              </h1>

              <p className="font-editorial text-base sm:text-lg text-[#343C36]/85 leading-relaxed max-w-xl">
                Silhueta interativa de avarias na recepção, matriz automática de preços por porte, Kanban em tempo real, DRE em regime de caixa, estoque químico e CRM de retenção.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full sm:w-auto min-h-[50px] sm:min-h-[52px] px-7 rounded-full bg-[#247653] hover:bg-[#142D26] text-white text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
                >
                  <MiniVulpto className="w-4 h-4 text-[#A8D1B8] shrink-0" />
                  <span>Testar 3 Dias Grátis</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <a
                  href="#showcase"
                  className="w-full sm:w-auto min-h-[50px] sm:min-h-[52px] px-7 rounded-full bg-white hover:bg-[#E9F3EC] text-[#142D26] text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2.5 border border-[#247653]/30 shadow-xs transition-all"
                >
                  <Eye className="w-4 h-4 text-[#247653] shrink-0" />
                  <span>Explorar Módulos</span>
                </a>
              </div>

              {/* 4 Cards Diretos na Base da Coluna Esquerda (como na Cia do Lacre) */}
              <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: "360° + 3D", label: "Vistoria & Laudo PDF" },
                  { value: "5 Portes", label: "Hatch a Utilitário" },
                  { value: "19 Módulos", label: "Pátio, DRE e CRM" },
                  { value: "72 Horas", label: "Trial Sem Cartão" },
                ].map((stat) => (
                  <div
                    key={stat.value}
                    className="bg-white rounded-2xl border border-[#E7EAE7] p-3.5 sm:p-4 text-left"
                  >
                    <div className="font-heading font-extrabold text-lg sm:text-xl text-[#142D26] tracking-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs text-[#737D75] mt-0.5 leading-snug">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Direita: Protagonismo Visual Interativo (Vistoria 360º + Preço por Porte) */}
            <div className="lg:col-span-5 relative min-w-0">
              <div
                onMouseMove={handleHeroMouseMove}
                onMouseLeave={handleHeroMouseLeave}
                style={{
                  transform: `translate3d(${heroParallax.x}px, ${heroParallax.y}px, 0)`,
                }}
                className="bg-white rounded-3xl border border-[#E7EAE7] p-5 sm:p-6 shadow-card-hover transition-transform duration-300 ease-out"
              >
                {/* Cabeçalho do Cartão Interativo */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E7EAE7]">
                  <div className="flex items-center gap-2.5">
                    <span className="mercosul-plate text-xs">BRA2E19</span>
                    <span className="text-xs font-semibold text-[#737D75]">
                      Box 01 · Recepção
                    </span>
                  </div>
                  {heroPins.length > INITIAL_HERO_PINS.length && (
                    <button
                      type="button"
                      onClick={handleResetHeroPins}
                      className="text-xs font-semibold text-[#247653] hover:text-[#142D26] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                {/* Seletor de Porte ao Vivo (Mostra Matriz de Preço Congelado na OS) */}
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#737D75]">
                      Porte do Veículo
                    </span>
                    <span className="font-mono text-xs font-bold text-[#247653] tabular-nums">
                      {activePortInfo.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}{" "}
                      · {activePortInfo.estimatedHours}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#F7F8F6] p-1 rounded-full border border-[#E7EAE7]">
                    {PORT_PRICING_DEMO.map((port) => (
                      <button
                        key={port.key}
                        type="button"
                        onClick={() => setSelectedPort(port.key)}
                        className={`min-h-[38px] rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selectedPort === port.key
                            ? "bg-[#247653] text-white shadow-xs"
                            : "text-[#343C36] hover:text-[#142D26]"
                        }`}
                      >
                        {port.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Silhueta Automotiva Real Clicável */}
                <div className="mt-4 bg-[#F7F8F6] rounded-2xl border border-[#E7EAE7] py-4 px-3">
                  <VehicleTopBlueprint
                    pins={heroPins}
                    selectedPinId={selectedHeroPinId}
                    onSelectPin={setSelectedHeroPinId}
                    onAddPin={handleAddHeroPin}
                    compact
                  />
                  <p className="text-[11px] text-[#737D75] text-center mt-2">
                    Toque nos pinos ou na carroceria para marcar uma avaria
                  </p>
                </div>

                {/* Detalhe da Avaria Selecionada */}
                {activeHeroPin && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-[#E9F3EC] border border-[#247653]/20 text-left flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#142D26] truncate">
                        {activeHeroPin.areaLabel} · {activeHeroPin.damageLabel}
                      </div>
                      <div className="text-[11px] text-[#343C36] truncate mt-0.5">
                        {activeHeroPin.detail}
                      </div>
                    </div>
                    <a
                      href="#showcase"
                      className="shrink-0 text-xs font-bold text-[#247653] hover:text-[#142D26] inline-flex items-center gap-1"
                    >
                      <span>Detalhes</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARROSSEL EDITORIAL DE MÓDULOS & DIFERENCIAIS COM AUTOPLAY */}
      <LandingModulesCarousel onStartTrial={() => setIsRegisterOpen(true)} />

      {/* 4. PAINEL DE MÉTRICAS VIVAS COM BACKGROUNDS E OVERLAY VERDE-ESMERALDA */}
      <section
        ref={metricsRef}
        id="metrics-panel"
        className="py-20 bg-white border-y border-[#E7EAE7]"
      >
        <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block mb-2">
              Controle Operacional &amp; Financeiro
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#142D26] tracking-tight">
              Impacto real em cada box
            </h2>
            <p className="mt-3 font-editorial text-base text-[#737D75] leading-relaxed">
              Do check-in blindado à apuração do lucro líquido no caixa, todos os indicadores da estética conversam entre si em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {IMPACT_METRICS.map((metric, idx) => {
              const IconComp = metric.icon;
              const currentValue = metricValues[idx] ?? metric.target;
              return (
                <div
                  key={metric.id}
                  className="relative overflow-hidden rounded-3xl border border-[#1D5E42]/40 p-8 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group text-left min-h-[270px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={metric.bgImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0B1915]/92 via-[#142D26]/86 to-[#247653]/78" />

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs text-[#A8D1B8] border border-white/15 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                      <IconComp className="w-7 h-7" />
                    </div>
                    <p className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight tabular-nums">
                      {currentValue}
                      {metric.suffix}
                    </p>
                    <h3 className="font-heading font-bold text-lg text-white mt-2 mb-1">
                      {metric.title}
                    </h3>
                    <p className="text-xs text-[#E9F3EC]/90 leading-relaxed">
                      {metric.subtitle}
                    </p>
                  </div>

                  <div className="relative z-10 pt-4 mt-6 border-t border-white/15 flex items-center gap-2 text-[11px] font-bold text-[#A8D1B8]">
                    <span className="w-2 h-2 rounded-full bg-[#A8D1B8]" />
                    <span>{metric.footer}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SHOWCASE OPERACIONAL PROFUNDO */}
      <LandingShowcase />

      {/* 6. SIMULADOR OPERACIONAL DE RETORNO */}
      <section id="roi" className="py-20 bg-[#F7F8F6]">
        <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block mb-2">
                Simulador Operacional
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#142D26] tracking-tight">
                Estime o retorno no seu pátio
              </h2>
              <p className="mt-3 font-editorial text-sm sm:text-base text-[#737D75] leading-relaxed">
                Ajuste o volume mensal da sua estética para projetar faturamento sob gestão, potencial de reativação CRM e horas poupadas na recepção.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E7EAE7] shadow-card grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
              <div className="md:col-span-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <span className="font-semibold text-[#343C36]">
                      Veículos atendidos por mês:
                    </span>
                    <span className="font-bold font-mono tabular-nums text-[#142D26] bg-[#F7F8F6] px-3 py-1 rounded-full border border-[#E7EAE7]">
                      {vehiclesPerMonth} veículos
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={400}
                    step={10}
                    value={vehiclesPerMonth}
                    onChange={(e) => setVehiclesPerMonth(Number(e.target.value))}
                    aria-label="Veículos atendidos por mês"
                    className="w-full accent-[#247653] cursor-pointer h-2.5 bg-[#E7EAE7] rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-[#737D75] mt-1.5">
                    <span>20 veículos</span>
                    <span>200 veículos</span>
                    <span>400 veículos</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <span className="font-semibold text-[#343C36]">
                      Ticket médio por serviço:
                    </span>
                    <span className="font-bold font-mono tabular-nums text-[#142D26] bg-[#F7F8F6] px-3 py-1 rounded-full border border-[#E7EAE7]">
                      R$ {averageTicket},00
                    </span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={1200}
                    step={20}
                    value={averageTicket}
                    onChange={(e) => setAverageTicket(Number(e.target.value))}
                    aria-label="Ticket médio por serviço"
                    className="w-full accent-[#247653] cursor-pointer h-2.5 bg-[#E7EAE7] rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-[#737D75] mt-1.5">
                    <span>R$ 80</span>
                    <span>R$ 600</span>
                    <span>R$ 1.200</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#E9F3EC] border border-[#247653]/20 text-xs sm:text-sm text-[#142D26] leading-relaxed">
                  Com <strong>{vehiclesPerMonth} veículos/mês</strong> em controle estruturado, sua equipe ganha agilidade na recepção, histórico completo por placa e clareza na apuração do DRE.
                </div>
              </div>

              <div className="md:col-span-6 bg-[#142D26] text-white p-7 sm:p-8 rounded-3xl border border-[#247653]/50 space-y-5 shadow-lg">
                <div>
                  <span className="text-[11px] text-[#A8D1B8] font-bold uppercase tracking-wider block">
                    Receita Sob Gestão + Reativação CRM (10%)
                  </span>
                  <div className="font-heading text-3xl sm:text-4xl font-extrabold text-white mt-1.5 tabular-nums">
                    {estimatedMonthlyRevenue.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                    <span className="text-sm font-normal text-[#A8D1B8] ml-1">/mês</span>
                  </div>
                  <div className="text-xs sm:text-sm text-[#7AB894] font-semibold mt-1 tabular-nums">
                    +{" "}
                    {estimatedCrmRecovery.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    em potencial de retorno (sumidos 45d+ &amp; revisão)
                  </div>
                </div>

                <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[11px] text-[#D2E7D9]">
                      Tempo Poupado
                    </div>
                    <div className="font-heading text-xl font-extrabold text-white mt-0.5 tabular-nums">
                      {hoursSavedPerMonth}h/mês
                    </div>
                  </div>
                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[11px] text-[#D2E7D9]">
                      Trial Sem Risco
                    </div>
                    <div className="font-heading text-xl font-extrabold text-[#A8D1B8] mt-0.5">
                      72 horas
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full min-h-[48px] bg-[#247653] hover:bg-[#318B63] text-white font-bold text-sm rounded-full transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Começar Teste Grátis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLANOS & ACESSO */}
      <section id="planos" className="py-20 bg-white border-y border-[#E7EAE7]">
        <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block mb-2">
            Comece Sem Burocracia
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#142D26] tracking-tight">
            Avaliação imediata por 3 dias
          </h2>
          <p className="mt-3 font-editorial text-sm sm:text-base text-[#737D75] max-w-xl mx-auto leading-relaxed">
            Configure os boxes, serviços e operadores da sua empresa no onboarding guiado e avalie todo o sistema em operação real.
          </p>

          <div className="mt-7 inline-flex p-1 bg-[#F7F8F6] rounded-full border border-[#E7EAE7] gap-1">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`min-h-[40px] px-5 text-xs font-bold rounded-full transition cursor-pointer ${
                billingCycle === "MONTHLY"
                  ? "bg-[#247653] text-white"
                  : "text-[#737D75] hover:text-[#142D26]"
              }`}
            >
              Ciclo Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("YEARLY")}
              className={`min-h-[40px] px-5 text-xs font-bold rounded-full transition cursor-pointer ${
                billingCycle === "YEARLY"
                  ? "bg-[#247653] text-white"
                  : "text-[#737D75] hover:text-[#142D26]"
              }`}
            >
              Ciclo Anual (Sob Consulta)
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="p-8 rounded-3xl bg-[#F7F8F6] border border-[#E7EAE7] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#247653]">
                    Sem Cartão de Crédito
                  </span>
                </div>
                <h3 className="font-heading text-2xl font-extrabold text-[#142D26] mb-2">
                  Avaliação Completa (Trial 72h)
                </h3>
                <p className="font-editorial text-sm text-[#737D75] mb-6 leading-relaxed">
                  Ambiente isolado e configurado do zero para testar recepção, pátio e finanças com a sua equipe.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#343C36] mb-8">
                  {[
                    "Onboarding guiado da empresa e boxes",
                    "Vistoria digital 360º com SVG + upload de fotos",
                    "Orçamentos em PDF e Kanban do pátio",
                    "Perfis separados Administrador e Operador",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full min-h-[48px] rounded-full bg-[#247653] hover:bg-[#142D26] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Criar Conta Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-[#142D26] text-white border-2 border-[#247653] shadow-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8D1B8]">
                    {billingCycle === "YEARLY" ? "Plano Anual" : "Operação em Produção"}
                  </span>
                </div>
                <h3 className="font-heading text-2xl font-extrabold text-white mb-2">
                  Operação Profissional &amp; Sob Medida
                </h3>
                <p className="font-editorial text-sm text-[#D2E7D9] mb-6 leading-relaxed">
                  Implantação completa para estéticas em crescimento, multi-boxes e customizações dedicadas.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#E9F3EC] mb-8">
                  {[
                    "DRE gerencial real + controle de taxas de cartão",
                    "Gestão completa de estoque químico e Curva ABC",
                    "CRM inteligente (dias de chuva, churn 45d+ e vitrificação)",
                    "Suporte à configuração de armazenamento em nuvem (BYOS)",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#A8D1B8] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full min-h-[48px] rounded-full bg-[#247653] hover:bg-[#318B63] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Iniciar Agora e Avaliar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACORDEÃO */}
      <section id="faq" className="py-20 bg-[#F7F8F6]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block mb-2">
              Perguntas Frequentes
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#142D26] tracking-tight">
              Dúvidas sobre implantação
            </h2>
          </div>

          <div className="space-y-3 text-left">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={faq.q}
                className="rounded-2xl bg-white border border-[#E7EAE7] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full min-h-[54px] px-5 py-4 text-left flex items-center justify-between gap-3 font-heading font-bold text-sm sm:text-base text-[#142D26] hover:text-[#247653] transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#737D75] transition-transform shrink-0 ${
                      openFaq === idx ? "rotate-180 text-[#247653]" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-3 text-xs sm:text-sm text-[#343C36] leading-relaxed border-t border-[#E7EAE7] bg-[#F7F8F6]/60">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. BANNER FINAL EDITORIAL */}
      <section className="py-16 bg-white border-t border-[#E7EAE7]">
        <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20">
          <div className="bg-[#142D26] text-white rounded-3xl p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 text-left max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A8D1B8] block">
                Ambiente Multi-tenant Pronto em Segundos
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Profissionalize cada atendimento do seu estúdio.
              </h2>
              <p className="font-editorial text-sm sm:text-base text-[#D2E7D9] leading-relaxed">
                Crie sua conta gratuitamente, configure boxes e equipe e gerencie recepção, pátio e finanças com clareza total.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="min-h-[50px] px-7 rounded-full bg-[#247653] hover:bg-[#318B63] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Cadastrar Minha Empresa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/login"
                className="min-h-[50px] px-7 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm inline-flex items-center justify-center transition"
              >
                Já Possuo Conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER EDITORIAL NOBRE (ESTRUTURADO COMO NA CIA DO LACRE) */}
      <footer className="bg-[#142D26] text-white border-t-4 border-[#247653]">
        {/* Faixa Superior: Segurança Multi-Tenant, RBAC & BYOS */}
        <div className="border-b border-[#247653]/40 bg-[#0F241E] py-8">
          <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#247653] flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading text-sm sm:text-base font-bold text-white">
                  Isolamento Multi-Tenant, RBAC &amp; Criptografia AES-256-GCM
                </p>
                <p className="text-xs text-[#D2E7D9] mt-0.5">
                  Sessões protegidas por Cookies HttpOnly, separação Admin vs Operador e nuvem corporativa própria (BYOS).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="min-h-[44px] px-6 rounded-full bg-[#247653] hover:bg-[#318B63] text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-[#A8D1B8]" />
                <span>Criar Conta Trial</span>
              </button>

              <button
                type="button"
                onClick={scrollToTop}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-[#247653] text-white flex items-center justify-center transition border border-white/15 cursor-pointer"
                title="Voltar ao Topo"
                aria-label="Voltar ao topo da página"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid Principal de 4 Colunas */}
        <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20 py-14 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B0F0D] border border-[#247653]/50 flex items-center justify-center p-1 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/vulpto_logo.png"
                    alt="Vulpto"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <span className="font-heading font-extrabold text-lg text-white block leading-none">
                    VULPTO
                  </span>
                  <span className="text-[11px] text-[#A8D1B8]">
                    Gestão Automotiva &amp; Detailing
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#D2E7D9]/85 leading-relaxed">
                Plataforma SaaS multi-tenant para estéticas automotivas, estúdios de detailing, centros de vitrificação e lava-jatos especializados.
              </p>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-heading font-bold text-sm text-white border-b border-[#247653]/40 pb-2">
                Plataforma
              </h4>
              <ul className="space-y-2 text-xs text-[#D2E7D9]/85">
                <li>
                  <a href="#diferenciais" className="hover:text-white transition-colors">
                    Diferenciais
                  </a>
                </li>
                <li>
                  <a href="#metrics-panel" className="hover:text-white transition-colors">
                    Impacto no Pátio
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-white transition-colors">
                    Módulos do Sistema
                  </a>
                </li>
                <li>
                  <a href="#roi" className="hover:text-white transition-colors">
                    Simulador de Retorno
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Dúvidas Frequentes
                  </a>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-heading font-bold text-sm text-white border-b border-[#247653]/40 pb-2">
                Operação &amp; Gestão
              </h4>
              <ul className="space-y-2 text-xs text-[#D2E7D9]/85">
                <li>Vistoria Digital 360º (2D &amp; 3D)</li>
                <li>Matriz de Preço por Porte (5 Categorias)</li>
                <li>Pátio Kanban Drag &amp; Drop em Tempo Real</li>
                <li>DRE em Regime de Caixa &amp; Comissões</li>
                <li>Estoque Químico &amp; CRM Curva ABC</li>
              </ul>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-heading font-bold text-sm text-white border-b border-[#247653]/40 pb-2">
                Acesso &amp; Conformidade
              </h4>
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-3">
                <div className="text-xs font-bold text-[#A8D1B8]">
                  Teste Completo de 72 Horas
                </div>
                <p className="text-xs text-[#E9F3EC]/85 leading-relaxed">
                  Configure sua estética agora sem exigir cartão de crédito.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-full bg-[#247653] hover:bg-[#318B63] text-white text-xs font-bold transition"
                  >
                    Login
                  </Link>
                  <button
                    type="button"
                    onClick={() => setLegalModal("TERMS")}
                    className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Termos
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegalModal("PRIVACY")}
                    className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    LGPD
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[#247653]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#D2E7D9]/75">
            <span>VULPTO · Sistema SaaS Multi-tenant para Estética Automotiva</span>
            <span>Segurança HttpOnly + RBAC Estrito + AES-256-GCM</span>
          </div>
        </div>
      </footer>

      <LandingRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      <LandingLegalModal
        mode={legalModal}
        onClose={() => setLegalModal(null)}
      />
    </div>
  );
}
