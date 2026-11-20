"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Inspection3D } from "@/components/modules/inspection/inspection-3d";
import type { DamagePin } from "@/components/modules/vehicle-silhouette-360";
import {
  AnimatedSectionIcon,
  AnimatedStudioBeams,
  FAQ_ITEMS,
  MiniVulpto,
} from "./mini-vulpto";
import { LandingShowcase } from "./landing-showcase";
import { LandingModulesCarousel } from "./landing-carousel";
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

const INITIAL_HERO_DAMAGES: DamagePin[] = [
  {
    id: "demo-pin-1",
    area: "HOOD",
    damageType: "SCRATCH",
    description: "Risco superficial na ponta direita do capô — registrado na entrada",
    anchor3D: {
      position: [0.42, 0.78, 1.38],
      normal: [0, 0.96, 0.25],
      partName: "hood",
    },
  },
];

const HERO_BENEFITS = [
  {
    title: "Vistoria em 3D na Entrada",
    desc: "Gire o carro na tela e marque riscos antes de lavar.",
  },
  {
    title: "Quadro Visual do Pátio",
    desc: "Arraste os veículos entre fila, box e entrega pronto.",
  },
  {
    title: "Preço por Tamanho de Carro",
    desc: "Hatch, sedã, utilitário e picape já vêm calculados.",
  },
  {
    title: "Caixa, Lucro e Comissões",
    desc: "Saiba quanto sobrou no dia sem depender de planilhas.",
  },
];

const BENTO_CARDS = [
  {
    id: "bento-vistoria",
    iconKind: "3d" as const,
    eyebrow: "Proteção na Entrada",
    title: "Vistoria em 3D com fotos do carro",
    desc: "Evite reclamações injustas na entrega. Marque arranhões ou amassados com fotos direto no veículo em 3D e envie no WhatsApp do cliente antes de começar.",
    bullets: ["Marca direto na peça do carro", "Guarda fotos na ficha do veículo"],
    bgImage: "/brand/screens/screen-vistoria-3d.png",
    bgAlt: "Tela real de vistoria em 3D do Vulpto",
  },
  {
    id: "bento-precos",
    iconKind: "patio" as const,
    eyebrow: "Orçamento Sem Erro",
    title: "Tabela automática por tamanho e quadro do pátio",
    desc: "Cadastre valores diferentes por porte uma vez só. Quando o carro entra, o preço certo vai para a ficha e toda a equipe vê em qual box ele está.",
    bullets: ["Mostra vagas livres por box", "Tempo estimado para cada serviço"],
    bgImage: "/brand/screens/screen-precos-porte.png",
    bgAlt: "Tela real de preços por porte de veículo",
  },
  {
    id: "bento-financeiro",
    iconKind: "caixa" as const,
    eyebrow: "Controle Financeiro",
    title: "Lucro limpo e acesso separado para dono e equipe",
    desc: "Você acompanha entradas, despesas, frascos usados e repasse da equipe com clareza. Seus colaboradores veem só os carros e vistorias — o caixa fica só com você.",
    bullets: ["Separa visão do dono e da equipe", "Comissão calculada ao receber"],
    bgImage: "/brand/screens/screen-financeiro-caixa.png",
    bgAlt: "Tela real de resumo financeiro e lucro do mês",
  },
  {
    id: "bento-whatsapp",
    iconKind: "whatsapp" as const,
    eyebrow: "Mais Movimento no Mês",
    title: "Avisos no WhatsApp para clientes sumidos e dias de chuva",
    desc: "Não deixe seus boxes vazios quando chove ou esfria. O sistema separa quem não volta há meses e quem precisa renovar a proteção para você chamar em um clique.",
    bullets: ["Lembrete automático de retorno", "Puxa avaliação no Google na entrega"],
    bgImage: "/brand/screens/screen-clientes-whatsapp.png",
    bgAlt: "Tela real de lembretes e retorno de clientes no WhatsApp",
  },
];

const SINGLE_TRIAL_INCLUDES = [
  "Vistoria em 3D ilimitada com marcação de avarias e fotos",
  "Quadro visual do pátio para mover carros entre etapas e boxes",
  "Tabela automática de preços por tamanho do veículo",
  "Caixa do dia, despesas, lucro limpo e comissões da equipe",
  "Controle de frascos, consumo por serviço e estoque mínimo",
  "Acesso separado entre dono e funcionários + listas de WhatsApp",
];

/**
 * Página inicial oficial do Vulpto em identidade escura metálica (Obsidian & Cromo)
 * voltada exclusivamente para donos de estéticas automotivas e lava-rápidos.
 */
export function VulptoLanding({
  sessionUser,
}: {
  sessionUser: VulptoSessionUser | null;
}) {
  const [heroDamages, setHeroDamages] =
    useState<DamagePin[]>(INITIAL_HERO_DAMAGES);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [legalModalMode, setLegalModalMode] = useState<
    "TERMS" | "PRIVACY" | null
  >(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isAuthenticated = Boolean(sessionUser);
  const dashboardHref =
    sessionUser?.role === "OPERATOR" ? "/patio" : "/dashboard";

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F8FAFC] selection:bg-[#38BDF8]/30 selection:text-white overflow-x-hidden font-editorial">
      {/* ------------------------------------------------------------ */}
      {/* 1. CABEÇALHO SUPERIOR FIXO EM ESTILO ESTÚDIO                 */}
      {/* ------------------------------------------------------------ */}
      <header className="sticky top-0 z-40 w-full bg-[#07090E]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          <a
            href="#"
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="Vulpto - Página inicial"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0B0F17] border border-white/15 p-1 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.06)] group-hover:border-white/35 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vulpto_logo.png"
                alt="Logotipo Vulpto"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-extrabold tracking-tight text-white leading-none">
                VULPTO
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-[#94A3B8] tracking-wide mt-0.5">
                Gestão de Estética Automotiva
              </span>
            </div>
          </a>

          <nav
            className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#CBD5E1]"
            aria-label="Navegação principal"
          >
            <a
              href="#patio-video"
              className="hover:text-white transition-colors"
            >
              Pátio ao Vivo
            </a>
            <a
              href="#visao-geral"
              className="hover:text-white transition-colors"
            >
              Como Funciona
            </a>
            <a href="#modulos" className="hover:text-white transition-colors">
              Telas do Sistema
            </a>
            <a
              href="#diferenciais"
              className="hover:text-white transition-colors"
            >
              Para Donos de Loja
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Teste Grátis
            </a>
            <a href="#duvidas" className="hover:text-white transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href={isAuthenticated ? dashboardHref : "/login"}
              className="hidden sm:inline-flex min-h-[42px] px-4 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-bold text-[#E2E8F0] hover:text-white items-center transition-colors"
            >
              {isAuthenticated ? "Abrir Meu Painel" : "Entrar"}
            </Link>

            <button
              type="button"
              onClick={() => setRegisterModalOpen(true)}
              className="min-h-[42px] px-3.5 sm:px-5 rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-[0_8px_24px_rgba(255,255,255,0.14)] hover:brightness-105 transition-all cursor-pointer"
            >
              <span className="sm:hidden">Testar Grátis</span>
              <span className="hidden sm:inline">Testar 3 Dias Grátis</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden w-12 h-12 rounded-xl bg-white/[0.05] border border-white/15 text-white flex items-center justify-center cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------ */}
        {/* 2. ABERTURA ESTÚDIO COM FEIXES ANIMADOS E CARRO 3D REAL     */}
        {/* ------------------------------------------------------------ */}
        <section className="relative overflow-hidden border-b border-white/10 pt-10 pb-16 sm:pt-14 sm:pb-24">
          {/* Luz de teto estilo estúdio automotivo */}
          <div
            className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[920px] h-[360px] rounded-full bg-gradient-to-b from-white/[0.11] via-[#38BDF8]/[0.06] to-transparent blur-3xl"
            aria-hidden="true"
          />
          <AnimatedStudioBeams />

          {/* Textura sutil do emblema oficial Vulpto no fundo */}
          <div
            className="pointer-events-none absolute top-4 right-[-80px] w-[420px] h-[420px] opacity-[0.07] select-none hidden xl:block"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vulpto_full_logo.png"
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Esquerda: Promessa clara para donos de estéticas */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="lg:col-span-5 pt-2"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111622] border border-white/15 text-xs font-semibold text-[#E2E8F0]">
                  <MiniVulpto className="w-4 h-4 shrink-0" />
                  <span>Para Estéticas Automotivas e Lava-Rápidos</span>
                </div>

                <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] mt-5 text-white">
                  Chega de comandar{" "}
                  <span className="bg-gradient-to-r from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent">
                    sua estética
                  </span>{" "}
                  no caderninho ou no improviso
                </h1>

                <p className="mt-5 text-base sm:text-lg text-[#94A3B8] leading-relaxed">
                  Receba cada veículo com vistoria em 3D e fotos, organize seus boxes sem correria, feche o caixa do dia com precisão e faça o cliente voltar pelo WhatsApp.
                </p>

                <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterModalOpen(true)}
                    className="min-h-[52px] px-7 rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_14px_38px_rgba(255,255,255,0.16)] hover:brightness-105 transition-all cursor-pointer"
                  >
                    <span>Começar 3 Dias Grátis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href="#patio-video"
                    className="min-h-[52px] px-6 rounded-full bg-[#111622] hover:bg-[#161D2B] border border-white/15 text-sm font-bold text-white inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Ver Pátio em Movimento</span>
                  </a>
                </div>

                <p className="mt-3.5 text-xs font-medium text-[#94A3B8] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span>
                    Teste sem cadastrar cartão • Funciona no celular, tablet e computador
                  </span>
                </p>

                {/* 4 benefícios objetivos no dia a dia */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HERO_BENEFITS.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl bg-[#111622]/90 border border-white/10 hover:border-white/20 p-4 transition-colors"
                    >
                      <h3 className="text-xs font-extrabold text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed mt-1">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Direita: MODELO 3D INTERATIVO REAL DO SISTEMA */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="lg:col-span-7"
              >
                <div className="rounded-[28px] bg-[#0B0F17] border border-white/15 p-3.5 sm:p-5 shadow-[0_32px_100px_rgba(0,0,0,0.75)] relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 mb-3.5 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-xs font-bold text-white">
                          Teste Agora: Vistoria em 3D da Entrada
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        Arraste para girar o veículo, abra as portas acima e clique na lataria para marcar um risco.
                      </p>
                    </div>

                    <span className="mercosul-plate self-start sm:self-auto shrink-0">
                      VLP2026
                    </span>
                  </div>

                  {/* Componente 3D real usado dentro do sistema */}
                  <Inspection3D
                    damages={heroDamages}
                    onChange={setHeroDamages}
                    demoMode={true}
                    studioDark={true}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 3. VÍDEO REAL DO PÁTIO + COMO FUNCIONA NA ROTINA             */}
        {/* ------------------------------------------------------------ */}
        <section className="py-16 sm:py-24 border-b border-white/10 bg-[#080B11] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LandingShowcase />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 4. CARROSSEL COM TELAS REAIS DO SISTEMA                       */}
        {/* ------------------------------------------------------------ */}
        <section
          id="modulos"
          className="scroll-mt-20 py-16 sm:py-24 border-b border-white/10 bg-[#07090E] relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111622] border border-white/15 text-xs font-semibold text-[#E2E8F0] mb-4">
                  <AnimatedSectionIcon kind="caixa" className="w-5 h-5" />
                  <span>Por Dentro do Sistema</span>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Tudo o que sua estética usa da recepção ao fechamento do mês
                </h2>
              </div>
              <p className="text-sm text-[#94A3B8] max-w-md">
                Capturas reais de quem já deixou o papel e as planilhas soltas para trás. Passe o dedo ou clique nas abas para ver cada tela.
              </p>
            </div>

            <LandingModulesCarousel />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 5. CARDS COM FUNDO CONDIZENTE AO SISTEMA REAL                */}
        {/* ------------------------------------------------------------ */}
        <section
          id="diferenciais"
          className="scroll-mt-20 py-16 sm:py-24 border-b border-white/10 bg-[#090D14] relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111622] border border-white/15 text-xs font-semibold text-[#CBD5E1] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Feito Para Quem Coloca a Mão na Massa</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Simples para sua equipe, transparente no seu bolso
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#94A3B8]">
                Cada card abaixo mostra exatamente a tela real que resolve aquele problema dentro da sua loja.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BENTO_CARDS.map((card) => (
                <div
                  key={card.id}
                  className="group relative rounded-[28px] overflow-hidden border border-white/15 hover:border-white/30 bg-[#0D121C] min-h-[340px] flex flex-col justify-between p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.55)] transition-all"
                >
                  {/* Imagem real do módulo correspondente ao fundo */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.bgImage}
                      alt={card.bgAlt}
                      className="w-full h-full object-cover object-top opacity-25 group-hover:opacity-35 group-hover:scale-[1.03] transition-all duration-700"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-[#090D15]/90 to-[#0B0F17]/75"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 text-[11px] font-bold text-[#E2E8F0] backdrop-blur-xs">
                      {card.eyebrow}
                    </span>
                    <div className="w-11 h-11 rounded-2xl bg-[#111622]/90 border border-white/15 flex items-center justify-center shadow-lg">
                      <AnimatedSectionIcon
                        kind={card.iconKind}
                        className="w-7 h-7"
                      />
                    </div>
                  </div>

                  <div className="relative z-10 mt-10">
                    <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-white leading-snug">
                      {card.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-[#CBD5E1] leading-relaxed">
                      {card.desc}
                    </p>

                    <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-2.5">
                      {card.bullets.map((bullet) => (
                        <span
                          key={bullet}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-white"
                        >
                          <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>{bullet}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 6. CARD ÚNICO DE TESTE GRÁTIS POR 3 DIAS                     */}
        {/* ------------------------------------------------------------ */}
        <section
          id="planos"
          className="scroll-mt-20 py-16 sm:py-24 border-b border-white/10 bg-[#07090E] relative overflow-hidden"
        >
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[280px] rounded-full bg-white/[0.06] blur-3xl"
            aria-hidden="true"
          />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111622] border border-white/15 text-xs font-semibold text-[#E2E8F0] mb-4">
                <UserCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Comece Sem Risco</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Coloque o Vulpto para rodar hoje mesmo na sua estética
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#94A3B8]">
                Você cria sua conta em menos de um minuto e testa todas as ferramentas com a sua equipe por 3 dias sem pagar nada.
              </p>
            </div>

            {/* APENAS UM ÚNICO CARD */}
            <div className="rounded-[32px] bg-gradient-to-b from-[#141B29] via-[#101521] to-[#0B0F17] border border-white/20 p-6 sm:p-10 shadow-[0_32px_100px_rgba(0,0,0,0.7)] relative overflow-hidden">
              <div
                className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
                aria-hidden="true"
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/35 text-[#34D399] text-xs font-bold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>3 Dias Completos de Teste Grátis</span>
                  </span>
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                    Acesso Completo Para Sua Loja
                  </h3>
                  <p className="text-sm text-[#94A3B8] mt-1.5">
                    Tudo liberado na hora — sem pedir cartão de crédito no cadastro.
                  </p>
                </div>

                <div className="md:text-right shrink-0">
                  <div className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
                    R$ 0 agora
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-1">
                    Experimente por 72 horas na prática
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-8">
                {SINGLE_TRIAL_INCLUDES.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[#E2E8F0]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <ShieldCheck className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <span>
                    Você escolhe continuar só se gostar de usar no seu dia a dia.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(true)}
                  className="w-full sm:w-auto min-h-[52px] px-8 rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_14px_38px_rgba(255,255,255,0.16)] hover:brightness-105 transition-all cursor-pointer shrink-0"
                >
                  <span>Iniciar Meu Teste Grátis Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 7. DÚVIDAS FREQUENTES                                        */}
        {/* ------------------------------------------------------------ */}
        <section
          id="duvidas"
          className="scroll-mt-20 py-16 sm:py-24 bg-[#090D14]"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Perguntas de quem está avaliando o Vulpto
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#94A3B8]">
                Respostas diretas sobre como funciona no pátio da sua loja.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.q}
                    className="rounded-2xl bg-[#111622] border border-white/10 overflow-hidden transition-colors hover:border-white/20"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full min-h-[56px] px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-bold text-white">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-[#94A3B8] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-white" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 text-sm text-[#94A3B8] leading-relaxed border-t border-white/5 pt-3.5">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------ */}
      {/* 8. RODAPÉ LIMPO EM IDENTIDADE ESCURA                         */}
      {/* ------------------------------------------------------------ */}
      <footer className="border-t border-white/10 bg-[#07090E] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B0F17] border border-white/15 p-1 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/vulpto_logo.png"
                  alt="Vulpto"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <div className="font-heading text-base font-extrabold text-white">
                  VULPTO
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Gestão simples e completa para estéticas automotivas e lava-rápidos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#94A3B8]">
              <a href="#patio-video" className="hover:text-white transition-colors">
                Pátio ao Vivo
              </a>
              <a href="#visao-geral" className="hover:text-white transition-colors">
                Como Funciona
              </a>
              <a href="#modulos" className="hover:text-white transition-colors">
                Telas do Sistema
              </a>
              <a href="#planos" className="hover:text-white transition-colors">
                Teste Grátis
              </a>
              <button
                type="button"
                onClick={() => setLegalModalMode("TERMS")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Termos de Uso
              </button>
              <button
                type="button"
                onClick={() => setLegalModalMode("PRIVACY")}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacidade
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#64748B]">
            <span>© 2026 Vulpto. Feito para quem cuida de carros todos os dias.</span>
            <span>Suporte direto e implantação rápida para sua loja.</span>
          </div>
        </div>
      </footer>

      <LandingMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenRegister={() => setRegisterModalOpen(true)}
        dashboardHref={dashboardHref}
        isAuthenticated={isAuthenticated}
      />

      <LandingRegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />

      <LandingLegalModal
        mode={legalModalMode}
        onClose={() => setLegalModalMode(null)}
      />
    </div>
  );
}
