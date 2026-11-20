"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CloudRain,
  DollarSign,
  Eye,
  FileText,
  Gauge,
  Layers,
  Loader2,
  Lock,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wrench,
  X,
  AlertCircle,
} from "lucide-react";

export interface VulptoSessionUser {
  name: string;
  role: "ADMIN" | "OPERATOR";
  tenantName?: string;
}

interface VulptoLandingProps {
  sessionUser: VulptoSessionUser | null;
}

type ShowcaseTab = "vistoria" | "patio" | "financeiro" | "crm";

const SHOWCASE_TABS: Array<{
  key: ShowcaseTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "vistoria", label: "1. Vistoria Digital 360º", icon: ClipboardCheck },
  { key: "patio", label: "2. Pátio Kanban & Porte", icon: Gauge },
  { key: "financeiro", label: "3. DRE & Comissões", icon: DollarSign },
  { key: "crm", label: "4. Estoque & CRM Retenção", icon: CloudRain },
];

const DIFFERENTIALS: Array<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}> = [
  {
    icon: ClipboardCheck,
    title: "Vistoria 360º com Laudo PDF",
    desc: "Check-in fotográfico e silhueta SVG interativa de avarias que protege a estética contra contestações injustas na devolução do veículo.",
  },
  {
    icon: Layers,
    title: "Preços Escalonados por Porte",
    desc: "Matriz configurável para Hatch, Sedan, SUV/Picape, Moto e Utilitário com congelamento do valor acordado dentro de cada OS.",
  },
  {
    icon: Lock,
    title: "RBAC Estrito Admin vs Operador",
    desc: "Dados financeiros, lucro líquido do DRE, folha e custos de insumos ficam protegidos no servidor apenas para perfis administradores.",
  },
  {
    icon: Package,
    title: "Estoque Químico & Fichas Técnicas",
    desc: "Controle entradas, perdas e consumo médio ponderado de shampoos, polidores, boinas e vitrificadores sem surpresas de falta no box.",
  },
  {
    icon: Users,
    title: "CRM com Curva ABC & Churn",
    desc: "Identifique rapidamente clientes Classe A inativos há mais de 45 dias, revisões de vitrificação e campanhas de dias de chuva.",
  },
  {
    icon: Wrench,
    title: "Armazenamento Próprio (BYOS)",
    desc: "Conecte seu próprio bucket ou drive corporativo com credenciais criptografadas (AES-256-GCM) para guardar todas as fotos da equipe.",
  },
];

const FAQ_ITEMS = [
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
    a: "A equipe marca diretamente na silhueta veicular as áreas com riscos, amassados, trincas ou queimaduras de verniz, registra nível de combustível, pertences deixados no interior e anexa fotos — gerando um comprovante em PDF compartilhável via WhatsApp.",
  },
  {
    q: "Posso definir preços diferentes conforme o porte do veículo?",
    a: "Sim. O catálogo possui matriz automática para Hatch/Pequeno, Sedan/Médio, SUV/Picape, Moto e Utilitário Especial. Ao aprovar um orçamento e converter em Ordem de Serviço, os preços negociados são congelados historicamente.",
  },
  {
    q: "Como funciona o armazenamento de fotos em nuvem da empresa?",
    a: "As imagens de vistoria podem ser conectadas ao repositório em nuvem configurado pelo administrador da estética (com credenciais protegidas por criptografia AES-256-GCM), evitando lotar celulares pessoais da equipe.",
  },
  {
    q: "O cálculo do DRE e das comissões é automático?",
    a: "Sim. Cada Ordem de Serviço concluída alimenta o fluxo de receitas, apura os custos variáveis de insumos e comissões por colaborador e consolida despesas fixas e taxas de pagamento para mostrar o lucro líquido operacional real.",
  },
];

export function VulptoLanding({ sessionUser }: VulptoLandingProps) {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("vistoria");
  const [vehiclesPerMonth, setVehiclesPerMonth] = useState<number>(90);
  const [averageTicket, setAverageTicket] = useState<number>(320);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [legalModal, setLegalModal] = useState<"TERMS" | "PRIVACY" | null>(null);

  // Modal de Cadastro Rápido (integrado diretamente a POST /api/auth/register)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    tradingName: "",
    document: "",
    phone: "",
    adminName: "",
    email: "",
    password: "",
    website: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Cálculos dinâmicos transparentes para a calculadora operacional
  const estimatedMonthlyRevenue = vehiclesPerMonth * averageTicket;
  // Estimativa conservadora de 10% de ganho adicional com reativação CRM (45+ dias + dias de chuva)
  const estimatedCrmRecovery = Math.round(estimatedMonthlyRevenue * 0.1);
  // Economia de ~15 min por veículo entre orçamento PDF, vistoria e conferência de comissão
  const hoursSavedPerMonth = Math.round((vehiclesPerMonth * 15) / 60);

  const dashboardHref =
    sessionUser?.role === "OPERATOR" ? "/patio" : "/dashboard";

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);

    if (formData.password.length < 8) {
      setRegisterError("A senha de acesso deve ter no mínimo 8 caracteres.");
      setRegisterLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao registrar empresa.");
      }

      window.location.href = data.redirect || "/onboarding";
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Falha na conexão com o servidor.";
      setRegisterError(msg);
      setRegisterLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#252B27] font-sans antialiased overflow-x-hidden pb-16 md:pb-0">
      {/* 1. BARRA SUPERIOR PARA USUÁRIOS JÁ CONECTADOS */}
      {sessionUser && (
        <div className="bg-[#142D26] text-[#E9F3EC] px-4 py-2.5 text-xs border-b border-[#1D5E42]">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse" />
              <span>
                Conectado como <strong>{sessionUser.name}</strong>
                {sessionUser.tenantName ? ` • ${sessionUser.tenantName}` : ""}
              </span>
            </span>
            <Link
              href={dashboardHref}
              className="font-bold underline hover:text-white flex items-center gap-1 transition"
            >
              <span>Acessar Meu Painel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. NAVBAR FIXA VULPTO */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7EAE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0B0F0D] border border-[#247653]/40 flex items-center justify-center p-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vulpto_logo.png"
                alt="Vulpto Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#142D26]">
                VULPTO
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-[#737D75] font-semibold -mt-0.5">
                Gestão Automotiva &amp; Detailing
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#343C36]">
            <a href="#showcase" className="hover:text-[#247653] transition">
              Módulos
            </a>
            <a href="#diferenciais" className="hover:text-[#247653] transition">
              Diferenciais
            </a>
            <a href="#roi" className="hover:text-[#247653] transition">
              Simulador de Retorno
            </a>
            <a href="#planos" className="hover:text-[#247653] transition">
              Planos &amp; Trial
            </a>
            <a href="#faq" className="hover:text-[#247653] transition">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={sessionUser ? dashboardHref : "/login"}
              className="px-3.5 py-2 text-xs font-semibold text-[#343C36] hover:text-[#142D26] transition"
            >
              {sessionUser ? "Ir para o Painel" : "Entrar"}
            </Link>
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="dp-btn-primary text-xs px-4 py-2.5"
            >
              <span>Testar 3 Dias Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION + PREVIEW DO PAINEL */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-[#E9F3EC]/70 via-[#FFFFFF] to-[#F7F8F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E9F3EC] border border-[#A8D1B8] text-[#142D26] text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#247653]" />
            <span>
              Desenvolvido para Estéticas Automotivas, Estúdios de Detailing &amp; Vitrificação
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#142D26] max-w-4xl mx-auto leading-[1.14]">
            Controle seu pátio, blinde a recepção com{" "}
            <span className="text-[#247653]">vistoria digital 360º</span> e veja o
            lucro real de cada box
          </h1>

          <p className="mt-5 text-sm sm:text-base text-[#737D75] max-w-2xl mx-auto leading-relaxed">
            Receba veículos com silhueta SVG interativa de avarias, precifique por porte automaticamente, acompanhe boxes em tempo real no Kanban e gerencie DRE, estoque químico, comissões e CRM de retorno em um único sistema multi-tenant.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#247653] hover:bg-[#318B63] text-white font-semibold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Cadastrar Minha Estética • 3 Dias Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#showcase"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-[#F1F3F1] border border-[#D5DBD5] text-[#252B27] font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Eye className="w-4 h-4 text-[#247653]" />
              <span>Explorar Módulos do Sistema</span>
            </a>
          </div>

          {/* 4 Selos de Engenharia / Domínio */}
          <div className="mt-12 pt-6 border-t border-[#E7EAE7] grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-xs text-[#343C36] font-medium">
            <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-[#E7EAE7]">
              <ClipboardCheck className="w-4 h-4 text-[#247653] shrink-0" />
              <span>Vistoria 360º + Fotos</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-[#E7EAE7]">
              <Car className="w-4 h-4 text-[#247653] shrink-0" />
              <span>Matriz de Preço por Porte</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-[#E7EAE7]">
              <TrendingUp className="w-4 h-4 text-[#247653] shrink-0" />
              <span>DRE Gerencial &amp; Comissões</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-[#E7EAE7]">
              <ShieldCheck className="w-4 h-4 text-[#247653] shrink-0" />
              <span>RBAC Admin &amp; Operador</span>
            </div>
          </div>

          {/* Moldura Demonstrativa do Cockpit Vulpto */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl p-3 bg-white border border-[#E7EAE7] shadow-card-hover text-left">
            <div className="bg-[#F1F3F1] rounded-t-xl px-4 py-2.5 flex items-center justify-between border-b border-[#E7EAE7] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC4C4C]/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]/80 inline-block" />
                <span className="text-[#737D75] text-[11px] font-mono ml-2">
                  vulpto.duckdns.org/dashboard
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#142D26] font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                <span>Visão Demonstrativa · Ambiente Multi-tenant</span>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-[#F7F8F6] rounded-b-xl border-x border-b border-[#E7EAE7] space-y-5">
              {/* Header simulado do painel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#247653] font-semibold">
                    Exemplo ilustrativo de operação
                  </span>
                  <h2 className="text-lg font-bold text-[#142D26]">
                    Cockpit Executivo da Estética
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-[#E7EAE7] text-[11px] font-semibold text-[#343C36]">
                    Pátio: 4 Boxes Ativos
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-[#E9F3EC] border border-[#A8D1B8] text-[11px] font-semibold text-[#142D26]">
                    Vistoria 360º Pronta
                  </span>
                </div>
              </div>

              {/* 4 KPIs ilustrativos */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-[#E7EAE7]">
                  <div className="text-[11px] font-medium text-[#737D75]">
                    Faturamento Mensal (Exemplo)
                  </div>
                  <div className="text-xl font-bold text-[#252B27] mt-1 font-mono">
                    R$ 28.800
                  </div>
                  <div className="text-[11px] text-[#16A36A] font-medium mt-1">
                    Receitas liquidadas &amp; OS pagas
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E7EAE7]">
                  <div className="text-[11px] font-medium text-[#737D75]">
                    Lucro Líquido (DRE Real)
                  </div>
                  <div className="text-xl font-bold text-[#142D26] mt-1 font-mono">
                    R$ 11.420
                  </div>
                  <div className="text-[11px] text-[#247653] font-medium mt-1">
                    Após insumos, comissões e fixos
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E7EAE7]">
                  <div className="text-[11px] font-medium text-[#737D75]">
                    Veículos em Execução
                  </div>
                  <div className="text-xl font-bold text-[#2563EB] mt-1 font-mono">
                    4 no pátio
                  </div>
                  <div className="text-[11px] text-[#737D75] mt-1">
                    Kanban Drag &amp; Drop por box
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E7EAE7]">
                  <div className="text-[11px] font-medium text-[#737D75]">
                    Alertas de Estoque &amp; CRM
                  </div>
                  <div className="text-xl font-bold text-[#D97706] mt-1 font-mono">
                    12 ações
                  </div>
                  <div className="text-[11px] text-[#737D75] mt-1">
                    Reposição mínima + retorno 45d
                  </div>
                </div>
              </div>

              {/* Mini Kanban + Placa Mercosul */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-white p-3.5 rounded-xl border border-[#E7EAE7] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#343C36]">
                    <span>Box 01 · Em Andamento</span>
                    <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[10px]">
                      POLIMENTO
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="mercosul-plate text-xs">BRA2E19</span>
                    <span className="text-xs font-medium text-[#737D75]">
                      SUV / Médio
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737D75]">
                    Vitrificação cerâmica 9H · Vistoria com 3 avarias prévias registradas.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E7EAE7] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#343C36]">
                    <span>Box 02 · Concluído</span>
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A36A] text-[10px]">
                      PRONTO
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="mercosul-plate text-xs">VLP4A88</span>
                    <span className="text-xs font-medium text-[#737D75]">
                      Sedan / Médio
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737D75]">
                    Higienização interna + Oxi-sanitização · Pós-venda agendado 24h.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-[#E7EAE7] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#343C36]">
                    <span>Recepção · Vistoria 360º</span>
                    <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] text-[10px]">
                      A FAZER
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="mercosul-plate text-xs">DFT9C21</span>
                    <span className="text-xs font-medium text-[#737D75]">
                      Hatch / Pequeno
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737D75]">
                    Orçamento PDF aprovado e convertido em OS com preços congelados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE INTERATIVO DOS 4 PILARES DO SISTEMA */}
      <section id="showcase" className="py-20 bg-white border-y border-[#E7EAE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#247653] bg-[#E9F3EC] px-3 py-1 rounded-full border border-[#A8D1B8]">
              Arquitetura Operacional Completa
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#142D26] mt-3">
              Do Check-in no Pátio ao Lucro Líquido no DRE
            </h2>
            <p className="text-xs sm:text-sm text-[#737D75] mt-2">
              Navegue pelas quatro frentes do Vulpto para ver como a plataforma elimina controles manuais e protege a rentabilidade da estética.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
            {SHOWCASE_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 cursor-pointer ${
                  activeTab === key
                    ? "bg-[#247653] text-white shadow-sm"
                    : "bg-[#F1F3F1] text-[#343C36] hover:bg-[#E7EAE7]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="bg-[#F7F8F6] rounded-2xl border border-[#E7EAE7] p-6 sm:p-8 shadow-card">
            {activeTab === "vistoria" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <span className="px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-semibold border border-[#A8D1B8]">
                    Segurança na Recepção
                  </span>
                  <h3 className="text-2xl font-bold text-[#142D26]">
                    Vistoria Digital 360º com Silhueta Interativa
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737D75] leading-relaxed">
                    Evite conflitos na entrega documentando cada avaria prévia no ato da entrada com coordenadas exatas em SVG e fotos organizadas por peça.
                  </p>
                  <ul className="space-y-2.5 text-xs text-[#252B27] font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Marcação de Riscos, Amassados, Trincas e Queimaduras de verniz</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Registro de nível de combustível (0–100%) e pertences de valor</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Geração de laudo PDF vetorial pronto para enviar via WhatsApp</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E7EAE7] p-5">
                  <div className="flex items-center justify-between border-b border-[#E7EAE7] pb-3 mb-4">
                    <span className="text-xs font-semibold text-[#142D26]">
                      Mapa Interativo de Avarias (Diagrama Ilustrativo)
                    </span>
                    <span className="text-[11px] font-mono text-[#247653] bg-[#E9F3EC] px-2 py-0.5 rounded">
                      3 pontos marcados
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 600 240"
                    className="w-full h-auto rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]"
                    role="img"
                    aria-label="Diagrama esquemático de vistoria 360 graus"
                  >
                    <rect
                      x="110"
                      y="55"
                      width="380"
                      height="130"
                      rx="42"
                      fill="#FFFFFF"
                      stroke="#343C36"
                      strokeWidth="2.5"
                    />
                    <rect
                      x="185"
                      y="72"
                      width="210"
                      height="96"
                      rx="18"
                      fill="#E9F3EC"
                      stroke="#247653"
                      strokeWidth="1.5"
                    />
                    <line x1="255" y1="55" x2="255" y2="185" stroke="#D5DBD5" strokeWidth="1.5" />
                    <line x1="345" y1="55" x2="345" y2="185" stroke="#D5DBD5" strokeWidth="1.5" />
                    {/* Pins de avaria */}
                    <circle cx="145" cy="120" r="10" fill="#DC4C4C" opacity="0.25" />
                    <circle cx="145" cy="120" r="5" fill="#DC4C4C" />
                    <circle cx="295" cy="63" r="10" fill="#D97706" opacity="0.25" />
                    <circle cx="295" cy="63" r="5" fill="#D97706" />
                    <circle cx="448" cy="155" r="10" fill="#2563EB" opacity="0.25" />
                    <circle cx="448" cy="155" r="5" fill="#2563EB" />
                    <text x="24" y="218" fill="#737D75" fontSize="11" fontFamily="monospace">
                      FRONT_BUMPER: Risco leve · LEFT_SIDE: Amassado porta · REAR_BUMPER: Ralado
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {activeTab === "patio" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <span className="px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-semibold border border-[#A8D1B8]">
                    Operação de Pátio em Tempo Real
                  </span>
                  <h3 className="text-2xl font-bold text-[#142D26]">
                    Pátio Kanban Drag &amp; Drop, Boxes e Precificação por Porte
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737D75] leading-relaxed">
                    Transforme orçamentos aprovados em Ordens de Serviço com 1 clique, congelando valores históricos e distribuindo veículos entre boxes e operadores.
                  </p>
                  <ul className="space-y-2.5 text-xs text-[#252B27] font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Matriz automática: Hatch, Sedan, SUV/Picape, Moto e Utilitário</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Colunas Kanban: A Fazer, Em Andamento, Concluído e Entregue/Pago</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Controle de ocupação de boxes e atribuição de técnicos</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ["A FAZER", "#D97706", "SUV · Polimento", "Checklist aberto"],
                    ["EM ANDAMENTO", "#2563EB", "Box 01 · Vitrificação", "Cura UV em curso"],
                    ["CONCLUÍDO", "#16A36A", "Box 02 · Higienização", "Aguardando retirada"],
                    ["ENTREGUE/PAGO", "#247653", "Pix / Cartão", "Comissão lançada"],
                  ].map(([col, color, title, desc]) => (
                    <div key={col} className="bg-white rounded-xl border border-[#E7EAE7] p-3.5 space-y-2">
                      <div className="text-[10px] font-bold font-mono" style={{ color }}>
                        {col}
                      </div>
                      <div className="text-xs font-bold text-[#142D26]">{title}</div>
                      <div className="text-[11px] text-[#737D75]">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "financeiro" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <span className="px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-semibold border border-[#A8D1B8]">
                    Gestão Financeira de Verdade
                  </span>
                  <h3 className="text-2xl font-bold text-[#142D26]">
                    DRE Gerencial em Tempo Real &amp; Liquidação de Comissões
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737D75] leading-relaxed">
                    Faturamento alto sem controle de custos mascara prejuízo. O Vulpto calcula seu DRE gerencial deduzindo insumos químicos, comissões e despesas fixas automaticamente.
                  </p>
                  <ul className="space-y-2.5 text-xs text-[#252B27] font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Dedução automática de taxas de débito e parcelamento no cartão</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Liquidação de comissões em lote gerando despesa no caixa</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Contas a pagar e fluxo de caixa visíveis apenas para o Administrador</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E7EAE7] p-5 space-y-2.5 text-xs">
                  {[
                    ["(+) Receita Bruta de Serviços", "R$ 28.800,00", "text-[#252B27] font-semibold"],
                    ["(-) Descontos & Taxas de Maquininha", "- R$ 1.240,00", "text-[#737D75]"],
                    ["(=) Receita Operacional Líquida", "R$ 27.560,00", "text-[#142D26] font-bold"],
                    ["(-) Custos Variáveis (Insumos + Comissões)", "- R$ 9.640,00", "text-[#D97706]"],
                    ["(-) Despesas Fixas (Aluguel, Energia, Fixos)", "- R$ 6.500,00", "text-[#DC4C4C]"],
                    ["(=) Lucro Líquido Operacional Real", "R$ 11.420,00 (39,6%)", "text-[#16A36A] font-bold"],
                  ].map(([label, value, cls]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2 border-b border-[#E7EAE7] last:border-b-0"
                    >
                      <span className="text-[#343C36]">{label}</span>
                      <span className={`font-mono ${cls}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "crm" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                  <span className="px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-semibold border border-[#A8D1B8]">
                    Retenção &amp; Controle de Insumos
                  </span>
                  <h3 className="text-2xl font-bold text-[#142D26]">
                    CRM Inteligente de Retorno &amp; Estoque Químico Auditável
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737D75] leading-relaxed">
                    Evite pátio vazio em dias chuvosos, traga clientes sumidos de volta e monitore o consumo real de vitrificadores, compostos e shampoos.
                  </p>
                  <ul className="space-y-2.5 text-xs text-[#252B27] font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Campanha de Dias de Chuva (higienização interna &amp; cristalização)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Alerta de Churn 45+ dias, revisão semestral de vitrificação e Curva ABC</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>Estoque mínimo crítico e movimentação atômica por Ordem de Serviço</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="bg-white rounded-xl border border-[#E7EAE7] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#142D26]">
                      Gatilho Dias de Chuva
                    </div>
                    <p className="text-[11px] text-[#737D75]">
                      Disparo direcionado via WhatsApp ofertando serviços cobertos que independem do sol.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E7EAE7] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#142D26]">
                      Curva ABC &amp; Sumidos 45d+
                    </div>
                    <p className="text-[11px] text-[#737D75]">
                      Classifica clientes que geram 70% do faturamento e sinaliza retornos em atraso.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E7EAE7] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#142D26]">
                      Manutenção de Vitrificação
                    </div>
                    <p className="text-[11px] text-[#737D75]">
                      Lembrete semestral para manter a garantia e fidelizar serviços de alto ticket.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E7EAE7] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-[#142D26]">
                      Lista de Compras Automática
                    </div>
                    <p className="text-[11px] text-[#737D75]">
                      Alerta visual imediato quando um químico atinge o estoque mínimo configurado.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. GRADE DE 6 DIFERENCIAIS */}
      <section id="diferenciais" className="py-20 bg-[#F7F8F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#247653] bg-[#E9F3EC] px-3 py-1 rounded-full border border-[#A8D1B8]">
            Engenharia Sob Medida
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#142D26] mt-3">
            Por Que Estéticas Profissionais Escolhem o Vulpto
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {DIFFERENTIALS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-white border border-[#E7EAE7] hover:border-[#247653] transition shadow-card"
              >
                <div className="w-11 h-11 rounded-xl bg-[#E9F3EC] text-[#247653] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#142D26] mb-1.5">
                  {title}
                </h3>
                <p className="text-xs text-[#737D75] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SIMULADOR INTERATIVO DE RETORNO */}
      <section id="roi" className="py-20 bg-white border-y border-[#E7EAE7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#247653] bg-[#E9F3EC] px-3 py-1 rounded-full border border-[#A8D1B8]">
              Simulador Operacional
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#142D26] mt-3">
              Estime o Impacto de Organização no Seu Pátio
            </h2>
            <p className="text-xs sm:text-sm text-[#737D75] mt-2">
              Ajuste o volume mensal da sua estética para projetar faturamento sob gestão, potencial de reativação CRM e horas operacionais poupadas.
            </p>
          </div>

          <div className="bg-[#F7F8F6] p-6 sm:p-10 rounded-3xl border border-[#E7EAE7] shadow-card grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#343C36]">
                    Veículos atendidos por mês:
                  </span>
                  <span className="font-bold font-mono text-[#142D26] text-sm bg-white px-2.5 py-1 rounded-lg border border-[#E7EAE7]">
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
                  className="w-full accent-[#247653] cursor-pointer h-2.5 bg-[#E7EAE7] rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#737D75] mt-1">
                  <span>20 veículos</span>
                  <span>200 veículos</span>
                  <span>400 veículos</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#343C36]">
                    Ticket médio por serviço:
                  </span>
                  <span className="font-bold font-mono text-[#142D26] text-sm bg-white px-2.5 py-1 rounded-lg border border-[#E7EAE7]">
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
                  className="w-full accent-[#247653] cursor-pointer h-2.5 bg-[#E7EAE7] rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#737D75] mt-1">
                  <span>R$ 80</span>
                  <span>R$ 600</span>
                  <span>R$ 1.200</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#E9F3EC] border border-[#A8D1B8] text-xs text-[#142D26] leading-relaxed">
                Com{" "}
                <strong>{vehiclesPerMonth} veículos/mês</strong> em controle
                estruturado, a sua equipe ganha agilidade na recepção, histórico
                completo por placa e clareza na apuração real do DRE sem
                depender de planilhas paralelas.
              </div>
            </div>

            <div className="md:col-span-6 bg-[#142D26] text-white p-7 rounded-2xl border border-[#247653]/50 space-y-5 shadow-lg">
              <div>
                <span className="text-[11px] text-[#A8D1B8] font-bold uppercase tracking-wider block">
                  Receita Sob Gestão + Reativação Estimada (10%)
                </span>
                <div className="text-3xl font-bold font-mono text-white mt-1">
                  {estimatedMonthlyRevenue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  <span className="text-sm font-normal text-[#A8D1B8]">/mês</span>
                </div>
                <div className="text-xs text-[#34D399] font-semibold mt-1">
                  +{" "}
                  {estimatedCrmRecovery.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}{" "}
                  em potencial de retorno CRM (sumidos 45d+ &amp; revisão)
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[11px] text-[#D2E7D9]">
                    Tempo Administrativo Poupado
                  </div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {hoursSavedPerMonth}h/mês
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[11px] text-[#D2E7D9]">
                    Trial Sem Risco
                  </div>
                  <div className="text-xl font-bold font-mono text-[#34D399] mt-0.5">
                    72 horas
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-3.5 bg-[#247653] hover:bg-[#318B63] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Começar Teste Grátis Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLANOS & ACESSO */}
      <section id="planos" className="py-20 bg-[#F7F8F6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#247653] bg-[#E9F3EC] px-3 py-1 rounded-full border border-[#A8D1B8]">
            Comece Sem Burocracia
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#142D26] mt-3">
            Acesso Imediato com 3 Dias de Teste Gratuito
          </h2>
          <p className="text-xs sm:text-sm text-[#737D75] mt-2 max-w-xl mx-auto">
            Configure os boxes, serviços e operadores da sua empresa no onboarding guiado e avalie todo o sistema em operação real.
          </p>

          <div className="mt-7 inline-flex p-1 bg-white rounded-xl border border-[#E7EAE7] gap-1">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                billingCycle === "MONTHLY"
                  ? "bg-[#247653] text-white"
                  : "text-[#737D75] hover:text-[#252B27]"
              }`}
            >
              Ciclo Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                billingCycle === "YEARLY"
                  ? "bg-[#247653] text-white"
                  : "text-[#737D75] hover:text-[#252B27]"
              }`}
            >
              Ciclo Anual (Sob Consulta)
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="p-8 rounded-2xl bg-white border border-[#E7EAE7] shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-[#142D26]">
                    Avaliação Completa (Trial 72h)
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-[#E9F3EC] text-[#247653]">
                    Sem Cartão
                  </span>
                </div>
                <p className="text-xs text-[#737D75] mb-6">
                  Ambiente isolado e configurado do zero para testar recepção, pátio e finanças com a sua equipe.
                </p>
                <ul className="space-y-2.5 text-xs text-[#343C36] mb-8">
                  {[
                    "Onboarding guiado da empresa e boxes",
                    "Vistoria digital 360º com SVG + upload de fotos",
                    "Orçamentos em PDF e Kanban do pátio",
                    "Perfis separados Administrador e Operador",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#247653] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="dp-btn-primary w-full py-3"
              >
                <span>Criar Conta Trial (3 Dias)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 rounded-2xl bg-[#142D26] text-white border-2 border-[#247653] shadow-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">
                    Operação Profissional &amp; Sob Medida
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-[#247653] text-white">
                    {billingCycle === "YEARLY" ? "Plano Anual" : "Produção"}
                  </span>
                </div>
                <p className="text-xs text-[#D2E7D9] mb-6">
                  Implantação completa para estéticas em crescimento, multi-boxes e customizações dedicadas.
                </p>
                <ul className="space-y-2.5 text-xs text-[#E9F3EC] mb-8">
                  {[
                    "DRE gerencial real + controle de taxas de cartão",
                    "Gestão completa de estoque químico e Curva ABC",
                    "CRM inteligente (dias de chuva, churn 45d+ e vitrificação)",
                    "Suporte à configuração de armazenamento em nuvem (BYOS)",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-3 rounded-lg bg-[#247653] hover:bg-[#318B63] text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Iniciar Agora e Avaliar no Pátio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACORDEÃO */}
      <section id="faq" className="py-20 bg-white border-t border-[#E7EAE7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#247653] bg-[#E9F3EC] px-3 py-1 rounded-full border border-[#A8D1B8]">
              Perguntas Frequentes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#142D26] mt-3">
              Dúvidas sobre Implantação e Uso
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={faq.q}
                className="rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-bold text-[#142D26] hover:text-[#247653] transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#737D75] transition-transform shrink-0 ml-2 ${
                      openFaq === idx ? "rotate-180 text-[#247653]" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-3 text-[#343C36] leading-relaxed border-t border-[#E7EAE7] bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. BANNER FINAL */}
      <section className="py-16 bg-[#142D26] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Pronto para Profissionalizar Cada Atendimento do Seu Estúdio?
          </h2>
          <p className="text-xs sm:text-sm text-[#D2E7D9] max-w-xl mx-auto">
            Crie sua conta em segundos, configure sua equipe e gerencie recepção, pátio e finanças com clareza total.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#247653] hover:bg-[#318B63] text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Cadastrar Minha Empresa Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition flex items-center justify-center"
            >
              Já Possuo Conta
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-white border-t border-[#E7EAE7] py-10 text-xs text-[#737D75]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[#142D26]">VULPTO</span>
            <span>&middot;</span>
            <span>Sistema SaaS Multi-tenant para Estética Automotiva &amp; Detailing</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#showcase" className="hover:text-[#142D26]">
              Módulos
            </a>
            <Link href="/login" className="hover:text-[#142D26]">
              Login
            </Link>
            <button
              type="button"
              onClick={() => setLegalModal("TERMS")}
              className="hover:text-[#142D26] underline cursor-pointer"
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => setLegalModal("PRIVACY")}
              className="hover:text-[#142D26] underline cursor-pointer"
            >
              Privacidade &amp; LGPD
            </button>
          </div>
        </div>
      </footer>

      {/* BARRA STICKY MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#142D26] border-t border-[#247653] px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-[11px] font-bold text-white">
            Vulpto &middot; 3 Dias Grátis
          </div>
          <p className="text-[10px] text-[#A8D1B8]">Sem cartão de crédito</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRegisterOpen(true)}
          className="px-4 py-2 bg-[#247653] hover:bg-[#318B63] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          <span>Testar Grátis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MODAL DE CADASTRO RÁPIDO (POST /api/auth/register) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E7EAE7] shadow-modal p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7EAE7]">
              <div>
                <h3 className="text-lg font-bold text-[#142D26]">
                  Cadastre Sua Estética Automotiva
                </h3>
                <p className="text-xs text-[#737D75]">
                  Liberação instantânea do ambiente de avaliação por 3 dias
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#F1F3F1] hover:bg-[#E7EAE7] text-[#343C36] flex items-center justify-center cursor-pointer"
                aria-label="Fechar cadastro"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {registerError && (
              <div className="mt-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3.5">
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleFormChange}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="dp-label flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Nome da Empresa *</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    minLength={3}
                    placeholder="Ex: Prime Detailing Ltda"
                    value={formData.companyName}
                    onChange={handleFormChange}
                    className="dp-input w-full"
                  />
                </div>
                <div>
                  <label className="dp-label">Nome Fantasia</label>
                  <input
                    type="text"
                    name="tradingName"
                    placeholder="Ex: Prime Car Care"
                    value={formData.tradingName}
                    onChange={handleFormChange}
                    className="dp-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="dp-label">CNPJ ou CPF (Opcional)</label>
                  <input
                    type="text"
                    name="document"
                    placeholder="00.000.000/0001-00"
                    value={formData.document}
                    onChange={handleFormChange}
                    className="dp-input w-full"
                  />
                </div>
                <div>
                  <label className="dp-label flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#247653]" />
                    <span>WhatsApp / Telefone</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="dp-input w-full"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E7EAE7] space-y-3">
                <div>
                  <label className="dp-label flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Nome do Administrador *</span>
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    required
                    minLength={3}
                    placeholder="Seu nome completo"
                    value={formData.adminName}
                    onChange={handleFormChange}
                    className="dp-input w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="dp-label flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#247653]" />
                      <span>E-mail de Acesso *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="admin@empresa.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="dp-input w-full"
                    />
                  </div>
                  <div>
                    <label className="dp-label flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#247653]" />
                      <span>Senha (mín. 8 dígitos) *</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={handleFormChange}
                      className="dp-input w-full"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="dp-btn-primary w-full py-2.5 mt-2"
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando ambiente...</span>
                  </>
                ) : (
                  <>
                    <span>Criar Conta e Iniciar Onboarding</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#737D75] pt-1">
                Já tem cadastro?{" "}
                <Link
                  href="/login"
                  className="text-[#247653] font-semibold underline"
                >
                  Fazer login no sistema
                </Link>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TERMOS / PRIVACIDADE LGPD */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E7EAE7] shadow-modal overflow-hidden">
            <div className="p-5 border-b border-[#E7EAE7] flex items-center justify-between bg-[#F7F8F6]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#142D26]">
                <FileText className="w-4 h-4 text-[#247653]" />
                <span>
                  {legalModal === "TERMS"
                    ? "Termos de Uso — Vulpto"
                    : "Privacidade & Proteção de Dados (LGPD)"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-8 h-8 rounded-lg bg-white border border-[#E7EAE7] flex items-center justify-center cursor-pointer"
                aria-label="Fechar modal legal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-[#343C36] leading-relaxed space-y-3">
              {legalModal === "TERMS" ? (
                <>
                  <p>
                    O Vulpto fornece plataforma web multi-tenant para gestão operacional, vistorias veiculares, ordens de serviço, estoque químico e financeiro de estéticas automotivas.
                  </p>
                  <p>
                    O período inicial de avaliação tem duração de 3 dias (72 horas) sem exigência prévia de cartão de crédito.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Cada empresa cadastrada opera em ambiente multi-tenant isolado por identificador próprio no banco relacional, com sessões em Cookies HttpOnly e controle de acesso baseado em papéis (RBAC).
                  </p>
                  <p>
                    Credenciais opcionais de armazenamento em nuvem corporativa são protegidas com criptografia AES-256-GCM.
                  </p>
                </>
              )}
            </div>
            <div className="p-4 border-t border-[#E7EAE7] bg-[#F7F8F6] flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="dp-btn-primary text-xs px-4 py-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
