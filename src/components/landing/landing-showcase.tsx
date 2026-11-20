"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pause, Play, Sparkles } from "lucide-react";
import { AnimatedSectionIcon } from "./mini-vulpto";

interface RoutineTab {
  id: string;
  label: string;
  heading: string;
  description: string;
  image: string;
  imageAlt: string;
  points: string[];
}

const ROUTINE_TABS: RoutineTab[] = [
  {
    id: "entrada",
    label: "1. Entrada e Vistoria",
    heading: "Receba o carro com ficha visual em 3D e fotos",
    description:
      "Marque riscos, amassados, quilometragem e combustível direto no carro em 3D. Tudo vai para a ficha do atendimento e protege sua loja de qualquer cobrança injusta na entrega.",
    image: "/brand/screens/screen-vistoria-3d.png",
    imageAlt: "Tela de vistoria em 3D do sistema Vulpto",
    points: [
      "Gira o veículo em 360 graus e abre portas e capô",
      "Registra fotos das avarias antes de iniciar o serviço",
      "Comprovante pronto para enviar no WhatsApp do cliente",
    ],
  },
  {
    id: "patio",
    label: "2. Controle dos Boxes",
    heading: "Todo o pátio organizado por etapa e box ocupado",
    description:
      "Chega de gritar no pátio perguntando qual carro já saiu da lavagem. Cada atendimento aparece como um cartão com placa, cliente, responsável e box em uso.",
    image: "/brand/screens/screen-patio-kanban.png",
    imageAlt: "Tela do quadro do pátio e vagas por box",
    points: [
      "Veja quais boxes estão livres ou lotados na hora",
      "Arraste o cartão para mudar a etapa do atendimento",
      "Avisa se o pagamento ainda está pendente na retirada",
    ],
  },
  {
    id: "caixa",
    label: "3. Caixa e Comissões",
    heading: "Faturamento, despesas e lucro real sempre à vista",
    description:
      "Assim que o serviço é pago, o valor entra no caixa do dia por forma de pagamento e calcula automaticamente a comissão de quem executou o trabalho.",
    image: "/brand/screens/screen-financeiro-caixa.png",
    imageAlt: "Tela de resumo financeiro, caixa diário e lucros",
    points: [
      "Separa Pix, cartão, dinheiro e contas a pagar",
      "Mostra quanto sobrou de lucro no fim do mês",
      "Fecha comissões da equipe sem precisar fazer conta manual",
    ],
  },
  {
    id: "retorno",
    label: "4. Retorno no WhatsApp",
    heading: "Clientes voltam sozinhos com lembretes automáticos",
    description:
      "O sistema encontra clientes que não voltam há meses, manutenções de vitrificação vencendo e permite chamar todo mundo num dia fraco de chuva.",
    image: "/brand/screens/screen-clientes-whatsapp.png",
    imageAlt: "Tela de listas e avisos para clientes no WhatsApp",
    points: [
      "Lista pronta de clientes sumidos para chamar no WhatsApp",
      "Lembrete de revisão periódica após polimento e proteção",
      "Aniversariantes e envio do link de avaliação no Google",
    ],
  },
];

/**
 * Demonstração real em vídeo do Quadro Visual do Pátio + guia interativo em 4 etapas do estúdio.
 */
export function LandingShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.play().catch(() => {});
  }, []);

  const currentTab = ROUTINE_TABS[activeTab];

  function toggleVideo() {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setVideoPlaying(true);
    } else {
      vid.pause();
      setVideoPlaying(false);
    }
  }

  return (
    <div className="space-y-20">
      {/* BLOCO 1: VÍDEO REAL DO QUADRO DO PÁTIO (ARRASTAR E SOLTAR) */}
      <div
        id="patio-video"
        className="scroll-mt-24 rounded-[32px] bg-gradient-to-b from-[#131926] to-[#0B0F17] border border-white/15 p-5 sm:p-8 lg:p-10 shadow-[0_32px_100px_rgba(0,0,0,0.65)] relative overflow-hidden"
      >
        <div
          className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[560px] h-[220px] bg-white/[0.06] blur-3xl rounded-full"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Esquerda: Texto claro sobre o recurso de arrastar e soltar */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs font-semibold text-[#E2E8F0] mb-5">
              <AnimatedSectionIcon kind="patio" className="w-5 h-5" />
              <span>Quadro Visual em Tempo Real</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Arraste o cartão do carro entre etapas e boxes
            </h2>

            <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              Cada serviço aparece organizado da chegada à entrega. Mudou o carro de vaga ou terminou a lavagem? É só pegar o cartão e soltar na próxima coluna.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Veja quantos boxes estão ocupados agora sem ir até o pátio",
                "Identifique na hora o carro parado ou aguardando pagamento",
                "Funciona no computador da recepção, tablet ou celular",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-[#E2E8F0]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleVideo}
                className="min-h-[44px] px-5 rounded-full bg-[#161D2B] hover:bg-[#1E293B] border border-white/15 text-xs font-bold text-white inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                {videoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Pausar Demonstração</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Reproduzir Demonstração</span>
                  </>
                )}
              </button>
              <span className="text-xs text-[#94A3B8]">
                Gravação real do sistema em uso
              </span>
            </div>
          </div>

          {/* Direita: Player do vídeo gravado do /patio */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/15 bg-[#07090E] p-2 sm:p-3 shadow-2xl">
              <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/10 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#CBD5E1]">
                    Pátio da Estética — Arrastar e Soltar Cartões
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#94A3B8]">
                  Boxes e Etapas
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-[#0B0F17] aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  poster="/brand/screens/screen-patio-kanban.png"
                  aria-label="Vídeo real do quadro do pátio movendo carros entre colunas e boxes"
                  className="w-full h-full object-cover"
                >
                  <source src="/brand/patio-drag-drop.webm" type="video/webm" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: AS 4 ETAPAS DO DIA NA SUA ESTÉTICA */}
      <div id="visao-geral" className="scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-xs font-semibold text-[#CBD5E1] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Do Orçamento à Entrega</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Veja o que o Vulpto faz em cada etapa do dia
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#94A3B8]">
            Clique nas etapas abaixo para enxergar as telas reais que você e sua equipe usam na rotina da loja.
          </p>
        </div>

        {/* Botões de abas com alvo tátil mínimo 48px */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7"
          role="tablist"
          aria-label="Etapas do atendimento"
        >
          {ROUTINE_TABS.map((tab, idx) => {
            const selected = idx === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(idx)}
                className={`min-h-[52px] px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-left transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                  selected
                    ? "bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] border-white shadow-[0_12px_30px_rgba(255,255,255,0.12)]"
                    : "bg-[#111622] text-[#CBD5E1] border-white/10 hover:border-white/25 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    selected ? "bg-[#07090E]" : "bg-white/25"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-[28px] bg-[#111622] border border-white/15 p-5 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
              <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-white/15 bg-[#07090E]">
                <div className="aspect-[16/10] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentTab.image}
                    alt={currentTab.imageAlt}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              <div className="lg:col-span-5">
                <h3 className="font-heading text-2xl sm:text-[28px] font-extrabold text-white leading-tight">
                  {currentTab.heading}
                </h3>
                <p className="mt-3 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                  {currentTab.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {currentTab.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-2.5 text-sm text-[#E2E8F0]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
