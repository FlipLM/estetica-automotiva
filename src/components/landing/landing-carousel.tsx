"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

interface ModuleSlide {
  id: string;
  badge: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  highlights: string[];
}

const SLIDES: ModuleSlide[] = [
  {
    id: "vistoria-3d",
    badge: "Entrada do Carro",
    title: "Vistoria em 3D na Entrada",
    summary:
      "Gire o veículo na tela, abra portas e capô, marque riscos ou amassados com foto e envie o comprovante ao cliente antes de começar.",
    image: "/brand/screens/screen-vistoria-3d.png",
    imageAlt: "Tela real de vistoria veicular em 3D do Vulpto",
    highlights: ["Foto direto do celular", "Evita discussão na entrega"],
  },
  {
    id: "patio-visual",
    badge: "Pátio e Boxes",
    title: "Quadro Visual do Pátio",
    summary:
      "Veja em segundos quais carros estão esperando, em lavagem, finalizados ou pagos. Mova entre etapas e boxes só arrastando o cartão.",
    image: "/brand/screens/screen-patio-kanban.png",
    imageAlt: "Tela real do quadro visual do pátio e ocupação de boxes",
    highlights: ["Mostra vagas por box", "Placa destacada no card"],
  },
  {
    id: "precos-porte",
    badge: "Tabela Inteligente",
    title: "Preço Automático por Tamanho",
    summary:
      "Defina valores para Hatch, Sedã, Utilitário e Picape uma única vez. Na hora do orçamento, o sistema já calcula preço e tempo sozinho.",
    image: "/brand/screens/screen-precos-porte.png",
    imageAlt: "Tela real de cadastro de serviços e preços por tamanho de veículo",
    highlights: ["Sem erro de tabela", "Tempo estimado por serviço"],
  },
  {
    id: "lucro-caixa",
    badge: "Financeiro Real",
    title: "Lucro Limpo, Caixa do Dia e Comissões",
    summary:
      "Saiba exatamente quanto entrou em Pix, dinheiro ou cartão, desconte despesas e feche a comissão da sua equipe sem planilhas.",
    image: "/brand/screens/screen-financeiro-caixa.png",
    imageAlt: "Tela real do controle financeiro e caixa diário do Vulpto",
    highlights: ["Caixa aberto na hora", "Comissão pronta por funcionário"],
  },
  {
    id: "controle-frascos",
    badge: "Estoque e Consumo",
    title: "Controle de Frascos e Produtos",
    summary:
      "Acompanhe quantos mililitros foram usados em cada polimento ou vitrificação e receba aviso antes de acabar o produto no meio do serviço.",
    image: "/brand/screens/screen-estoque-produtos.png",
    imageAlt: "Tela real de controle de estoque de ceras, shampoos e insumos",
    highlights: ["Alerta de estoque baixo", "Custo real por atendimento"],
  },
  {
    id: "avisos-whatsapp",
    badge: "Fidelização",
    title: "Avisos no WhatsApp no Momento Certo",
    summary:
      "Chame quem não aparece há meses, lembre revisões de vitrificação ou mande promoção em dias de chuva para não deixar box vazio.",
    image: "/brand/screens/screen-clientes-whatsapp.png",
    imageAlt: "Tela real de disparos e lembretes para clientes no WhatsApp",
    highlights: ["Mensagens prontas em 1 clique", "Agenda cheia o mês todo"],
  },
];

/**
 * Carrossel horizontal escuro em estilo estúdio com capturas reais de cada tela do sistema.
 * Pausa ao passar o mouse, sem contadores numéricos e com alvos de toque acessíveis.
 */
export function LandingModulesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  function handlePrev() {
    setActiveIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }

  function handleNext() {
    setActiveIndex((prev) => (prev + 1) % SLIDES.length);
  }

  const currentSlide = SLIDES[activeIndex];

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Barra superior com navegação circular e indicador do módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {SLIDES.map((slide, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${active
                    ? "bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] border-white shadow-[0_6px_20px_rgba(255,255,255,0.12)]"
                    : "bg-[#111622] text-[#94A3B8] border-white/10 hover:border-white/25 hover:text-white"
                  }`}
              >
                {slide.badge}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? "Continuar apresentação" : "Pausar apresentação"}
            className="w-11 h-11 rounded-full bg-[#111622] border border-white/10 hover:border-white/30 text-[#CBD5E1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Tela anterior"
            className="w-11 h-11 rounded-full bg-[#111622] border border-white/10 hover:border-white/30 text-[#CBD5E1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Próxima tela"
            className="w-11 h-11 rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] hover:brightness-105 flex items-center justify-center transition-all cursor-pointer shadow-[0_6px_18px_rgba(255,255,255,0.14)]"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Palco principal do slide com captura real em moldura estúdio */}
      <div className="rounded-[28px] bg-[#0D121C] border border-white/15 shadow-[0_32px_90px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Esquerda: Captura real do módulo */}
          <div className="lg:col-span-8 bg-[#07090E] p-3 sm:p-5 border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#111622] shadow-2xl">
              {/* Barra discreta de janela */}
              <div className="px-4 py-2.5 bg-[#121824] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <span className="text-[11px] font-medium text-[#94A3B8]">
                  Tela real do sistema — {currentSlide.badge}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              </div>

              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0B0F17]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={currentSlide.id}
                  src={currentSlide.image}
                  alt={currentSlide.imageAlt}
                  className="w-full h-full object-cover object-top transition-opacity duration-500"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#07090E]/75 to-transparent"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Direita: Explicação direta ao dono */}
          <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-[#111622] to-[#0B0F17]">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-[11px] font-semibold text-[#CBD5E1]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                <span>{currentSlide.badge}</span>
              </span>

              <h3 className="font-heading text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight mt-4">
                {currentSlide.title}
              </h3>

              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mt-3">
                {currentSlide.summary}
              </p>

              <ul className="mt-6 space-y-2.5">
                {currentSlide.highlights.map((hl) => (
                  <li
                    key={hl}
                    className="flex items-center gap-2.5 text-sm font-medium text-[#E2E8F0]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center text-[11px] font-bold shrink-0">
                      ✓
                    </span>
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pílulas de progresso */}
            <div className="mt-8 pt-5 border-t border-white/10 flex items-center gap-2">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Ver ${s.title}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${idx === activeIndex
                      ? "w-8 bg-gradient-to-r from-white to-[#94A3B8]"
                      : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
