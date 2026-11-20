"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { MiniVulpto } from "./mini-vulpto";

export interface CarouselModuleItem {
  id: string;
  category: string;
  title: string;
  description: string;
  actionLabel: string;
  targetHref: string;
  bgImage: string;
  visualFocus: string;
  visualDetail: string;
}

const CAROUSEL_MODULES: CarouselModuleItem[] = [
  {
    id: "vistoria",
    category: "Recepção Blindada",
    title: "Vistoria 360° com Laudo PDF",
    description:
      "Check-in com silhueta 2D/3D interativa e fotos organizadas por peça que protegem a estética contra contestações na entrega.",
    actionLabel: "Ver Vistoria no Sistema",
    targetHref: "#showcase",
    bgImage: "/brand/bg-vistoria-360.svg",
    visualFocus: "3D + Silhueta 2D",
    visualDetail: "Marcação por coordenadas + envio em PDF no WhatsApp",
  },
  {
    id: "porte",
    category: "Precificação Dinâmica",
    title: "Matriz Automática por Porte",
    description:
      "Escalonamento de valores para Hatch, Sedan, SUV/Picape, Moto e Utilitário com congelamento histórico dentro de cada OS.",
    actionLabel: "Explorar Matriz de Portes",
    targetHref: "#showcase",
    bgImage: "/brand/bg-patio-detailing.svg",
    visualFocus: "5 Categorias",
    visualDetail: "Hatch · Sedan · SUV/Picape · Moto · Utilitário",
  },
  {
    id: "rbac",
    category: "Governança & Segurança",
    title: "RBAC Estrito Admin vs Operador",
    description:
      "Lucro líquido do DRE, contas a pagar e custo de insumos ficam isolados no servidor apenas para perfis administradores.",
    actionLabel: "Entender Permissões",
    targetHref: "#planos",
    bgImage: "/brand/bg-dre-financeiro.svg",
    visualFocus: "Cookies HttpOnly",
    visualDetail: "Operador acessa apenas pátio, vistoria e próprio extrato",
  },
  {
    id: "estoque",
    category: "Controle de Insumos",
    title: "Estoque Químico & Custo Médio",
    description:
      "Monitore shampoos, boinas, compostos e vitrificadores 9H com baixa atômica por OS, validade de frasco aberto e lista de compras.",
    actionLabel: "Ver Gestão Química",
    targetHref: "#showcase",
    bgImage: "/brand/bg-estoque-quimico.svg",
    visualFocus: "Ficha Técnica",
    visualDetail: "Diluição configurável + alerta de reposição mínima",
  },
  {
    id: "crm",
    category: "Retenção Automotiva",
    title: "CRM Curva ABC & Dias de Chuva",
    description:
      "Reative clientes Classe A inativos há mais de 45 dias, dispare lembretes de revisão de vitrificação e preencha boxes na chuva.",
    actionLabel: "Simular Retorno CRM",
    targetHref: "#roi",
    bgImage: "/brand/bg-patio-detailing.svg",
    visualFocus: "Anti-Spam Nativo",
    visualDetail: "Fila Para Chamar Hoje + atribuição de retorno gerado",
  },
  {
    id: "byos",
    category: "Nuvem Corporativa",
    title: "Armazenamento Próprio (BYOS)",
    description:
      "Conecte Google Drive, OneDrive, Dropbox, Telegram Cloud ou Cloudflare R2 com credenciais cifradas em AES-256-GCM.",
    actionLabel: "Iniciar Teste de 72h",
    targetHref: "#planos",
    bgImage: "/brand/bg-vistoria-360.svg",
    visualFocus: "AES-256-GCM",
    visualDetail: "Fotos da equipe fora do celular pessoal sem custo extra",
  },
];

interface LandingModulesCarouselProps {
  onStartTrial: () => void;
}

/**
 * Carrossel editorial inspirado no padrão CollectionsCarousel/CoursesCarousel da Cia do Lacre:
 * autoplay 3.5s, pausa em hover/touch, setas circulares limpas, sem contador numérico e sem balões internos.
 */
export function LandingModulesCarousel({ onStartTrial }: LandingModulesCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollToSlide = (index: number) => {
    const container = trackRef.current;
    if (!container) return;
    const normalized = (index + CAROUSEL_MODULES.length) % CAROUSEL_MODULES.length;
    const children = container.children;
    const target = children[normalized] as HTMLElement | undefined;
    if (target) {
      container.scrollTo({
        left: target.offsetLeft - container.offsetLeft,
        behavior: "smooth",
      });
      setActiveIndex(normalized);
    }
  };

  useEffect(() => {
    if (isPaused) return undefined;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % CAROUSEL_MODULES.length;
        const container = trackRef.current;
        const target = container?.children[next] as HTMLElement | undefined;
        if (container && target) {
          container.scrollTo({
            left: target.offsetLeft - container.offsetLeft,
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  function handleScrollSync() {
    const container = trackRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    let closestIdx = 0;
    let minDiff = Infinity;
    Array.from(container.children).forEach((child, idx) => {
      const el = child as HTMLElement;
      const diff = Math.abs(el.offsetLeft - container.offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setActiveIndex(closestIdx);
  }

  return (
    <section
      id="diferenciais"
      className="py-20 bg-[#F7F8F6] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20">
        {/* Cabeçalho Editorial Alinhado à Esquerda + Setas à Direita (Zero Contador) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E9F3EC] text-[#247653] text-xs font-bold uppercase tracking-wider mb-3">
              <MiniVulpto className="w-4 h-4 text-[#247653]" />
              <span>Engenharia Sob Medida</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#142D26] tracking-tight">
              Por que estéticas escolhem o Vulpto
            </h2>

            <p className="mt-2 font-editorial text-base text-[#737D75] max-w-2xl leading-relaxed">
              Cada rotina crítica do estúdio conectada em uma única plataforma, sem planilhas paralelas nem retrabalho na recepção.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollToSlide(activeIndex - 1)}
              className="w-11 h-11 rounded-full bg-white hover:bg-[#247653] text-[#142D26] hover:text-white border border-[#E7EAE7] shadow-xs flex items-center justify-center transition-all duration-200 cursor-pointer"
              aria-label="Diferencial anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSlide(activeIndex + 1)}
              className="w-11 h-11 rounded-full bg-[#247653] hover:bg-[#142D26] text-white shadow-xs flex items-center justify-center transition-all duration-200 cursor-pointer"
              aria-label="Próximo diferencial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Faixa do Carrossel com Scroll Snap Tátil */}
        <div
          ref={trackRef}
          onScroll={handleScrollSync}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-3 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CAROUSEL_MODULES.map((item) => (
            <div
              key={item.id}
              className="snap-start flex-none w-[88%] sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)] select-none"
            >
              <article className="group bg-white rounded-3xl border border-[#E7EAE7] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col h-full overflow-hidden">
                {/* Topo Visual Amplo com Zoom Suave (Zero Balões Aninhados) */}
                <div className="aspect-[16/10] relative overflow-hidden bg-[#142D26]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.bgImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1915]/90 via-[#142D26]/45 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 text-white text-left">
                    <span className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight block">
                      {item.visualFocus}
                    </span>
                    <span className="text-xs text-[#D2E7D9] leading-snug block mt-0.5">
                      {item.visualDetail}
                    </span>
                  </div>
                </div>

                {/* Corpo Limpo e Arejado */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#247653] block mb-1.5">
                      {item.category}
                    </span>

                    <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#142D26] group-hover:text-[#247653] transition-colors leading-snug mb-3">
                      {item.title}
                    </h3>

                    <p className="font-editorial text-sm text-[#737D75] leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>

                  {item.targetHref === "#planos" ? (
                    <button
                      type="button"
                      onClick={onStartTrial}
                      className="w-full min-h-[46px] rounded-full bg-[#E9F3EC] hover:bg-[#247653] text-[#142D26] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <a
                      href={item.targetHref}
                      className="w-full min-h-[46px] rounded-full bg-[#E9F3EC] hover:bg-[#247653] text-[#142D26] hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </article>
            </div>
          ))}
        </div>

        {/* Indicadores de Paginação em Pílula */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {CAROUSEL_MODULES.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === idx
                  ? "w-8 bg-[#247653]"
                  : "w-2 bg-[#D5DBD5] hover:bg-[#247653]/45"
              }`}
              aria-label={`Ir para ${item.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
