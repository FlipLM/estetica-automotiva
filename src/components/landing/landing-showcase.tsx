"use client";

import React, { useState } from "react";
import { Check, ClipboardCheck, CloudRain, DollarSign, Gauge } from "lucide-react";
import { INITIAL_HERO_PINS, MiniVulpto, VehicleTopBlueprint } from "./mini-vulpto";

export type ShowcaseTab = "vistoria" | "patio" | "financeiro" | "crm";

const SHOWCASE_TABS: Array<{
  key: ShowcaseTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "vistoria", label: "Vistoria Digital 360°", icon: ClipboardCheck },
  { key: "patio", label: "Pátio Kanban & Porte", icon: Gauge },
  { key: "financeiro", label: "DRE & Comissões", icon: DollarSign },
  { key: "crm", label: "Estoque & CRM Retenção", icon: CloudRain },
];

/**
 * Showcase Operacional sem numeração artificial (1., 2., 3., 4.) e sem balões aninhados.
 */
export function LandingShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("vistoria");
  const [selectedShowcasePin, setSelectedShowcasePin] = useState<string>("front");

  const activePin =
    INITIAL_HERO_PINS.find((p) => p.id === selectedShowcasePin) || INITIAL_HERO_PINS[0];

  return (
    <section id="showcase" className="py-20 bg-white border-y border-[#E7EAE7]">
      <div className="max-w-[1536px] mx-auto px-5 sm:px-10 lg:px-16 xl:px-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block mb-2">
            Arquitetura Operacional Completa
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#142D26] tracking-tight">
            Do check-in no pátio ao lucro líquido
          </h2>
          <p className="mt-3 font-editorial text-sm sm:text-base text-[#737D75] leading-relaxed">
            Navegue pelas quatro frentes do Vulpto para ver como a plataforma elimina controles manuais e protege a rentabilidade da estética.
          </p>
        </div>

        {/* Abas em Pílula Limpa (Sem Numeração Artificial) */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap mb-10">
          {SHOWCASE_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`min-h-[46px] px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === key
                  ? "bg-[#247653] text-white shadow-xs"
                  : "bg-[#F7F8F6] text-[#343C36] border border-[#E7EAE7] hover:bg-[#E9F3EC] hover:text-[#142D26]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Painel do Showcase (Zero Balões Aninhados) */}
        <div className="bg-[#F7F8F6] rounded-3xl border border-[#E7EAE7] p-6 sm:p-10 shadow-xs">
          {activeTab === "vistoria" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-5 space-y-4 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block">
                  Segurança na Recepção
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#142D26] leading-tight">
                  Vistoria Digital 360° com Silhueta Interativa
                </h3>
                <p className="font-editorial text-sm text-[#737D75] leading-relaxed">
                  Evite conflitos na entrega documentando cada avaria prévia no ato da entrada com coordenadas exatas e fotos organizadas por peça.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#252B27] font-medium pt-1">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Marcação de riscos, amassados, trincas e queimaduras de verniz</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Registro de combustível (0–100%) e pertences deixados no carro</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Laudo em PDF vetorial pronto para compartilhar via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E7EAE7] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7EAE7] pb-3.5 mb-5">
                  <span className="text-xs sm:text-sm font-bold text-[#142D26] flex items-center gap-2">
                    <MiniVulpto className="w-4 h-4 text-[#247653]" />
                    <span>Clique nos pinos da silhueta para inspecionar</span>
                  </span>
                  <span className="mercosul-plate text-xs">BRA2E19</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-6 bg-[#F7F8F6] rounded-2xl border border-[#E7EAE7] p-4 flex justify-center">
                    <VehicleTopBlueprint
                      pins={INITIAL_HERO_PINS}
                      selectedPinId={selectedShowcasePin}
                      onSelectPin={setSelectedShowcasePin}
                      compact
                    />
                  </div>
                  <div className="sm:col-span-6 space-y-3 text-left">
                    <div className="p-4 rounded-2xl bg-[#F7F8F6] border border-[#E7EAE7]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#247653] block mb-1">
                        Ponto Selecionado
                      </span>
                      <div className="font-heading font-bold text-base text-[#142D26]">
                        {activePin.areaLabel}
                      </div>
                      <div className="text-xs font-semibold text-[#343C36] mt-1">
                        {activePin.damageLabel}
                      </div>
                      <p className="text-xs text-[#737D75] mt-1.5 leading-relaxed">
                        {activePin.detail}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {INITIAL_HERO_PINS.map((pin, idx) => (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => setSelectedShowcasePin(pin.id)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-2xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                            selectedShowcasePin === pin.id
                              ? "bg-[#E9F3EC] border-[#247653]/40 text-[#142D26] font-bold"
                              : "bg-white border-[#E7EAE7] text-[#343C36] hover:bg-[#F7F8F6]"
                          }`}
                        >
                          <span>
                            {idx + 1}. {pin.areaLabel}
                          </span>
                          <span className="text-[11px] text-[#737D75] font-medium">
                            {pin.damageLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "patio" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-5 space-y-4 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block">
                  Operação de Pátio em Tempo Real
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#142D26] leading-tight">
                  Kanban Drag &amp; Drop, Boxes e Preço por Porte
                </h3>
                <p className="font-editorial text-sm text-[#737D75] leading-relaxed">
                  Transforme orçamentos aprovados em Ordens de Serviço com 1 clique, congelando valores históricos e distribuindo veículos entre boxes e operadores.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#252B27] font-medium pt-1">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Matriz automática: Hatch, Sedan, SUV/Picape, Moto e Utilitário</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Colunas Kanban: A Fazer, Em Andamento, Concluído e Entregue/Pago</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Controle real de vagas simultâneas e transferência entre baias</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    col: "A FAZER",
                    plate: "DFT9C21",
                    vehicle: "Hatch · Polimento Técnico",
                    box: "Recepção · Vistoria 360º",
                    tone: "text-[#D97706]",
                  },
                  {
                    col: "EM ANDAMENTO",
                    plate: "BRA2E19",
                    vehicle: "SUV · Vitrificação Cerâmica 9H",
                    box: "Box 01 · Cura UV em curso",
                    tone: "text-[#2563EB]",
                  },
                  {
                    col: "CONCLUÍDO",
                    plate: "VLP4A88",
                    vehicle: "Sedan · Higienização + Ozônio",
                    box: "Box 02 · Aguardando retirada",
                    tone: "text-[#16A36A]",
                  },
                  {
                    col: "ENTREGUE / PAGO",
                    plate: "JKL7H04",
                    vehicle: "Utilitário · Lavagem Detalhada",
                    box: "Pix liquidado · Comissão lançada",
                    tone: "text-[#247653]",
                  },
                ].map((card) => (
                  <div
                    key={card.col}
                    className="bg-white rounded-3xl border border-[#E7EAE7] p-5 space-y-2.5 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold tracking-wider ${card.tone}`}>
                        {card.col}
                      </span>
                      <span className="mercosul-plate text-[11px]">{card.plate}</span>
                    </div>
                    <div className="font-heading text-base font-bold text-[#142D26]">
                      {card.vehicle}
                    </div>
                    <div className="text-xs text-[#737D75]">{card.box}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "financeiro" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-5 space-y-4 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block">
                  Gestão Financeira de Verdade
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#142D26] leading-tight">
                  DRE Gerencial em Caixa &amp; Comissões
                </h3>
                <p className="font-editorial text-sm text-[#737D75] leading-relaxed">
                  Faturamento alto sem controle de custos mascara prejuízo. O Vulpto calcula seu DRE deduzindo taxas de maquininha, insumos químicos, comissões e fixos.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#252B27] font-medium pt-1">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Dedução automática de taxas de débito e parcelamento no cartão</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Liquidação de comissões em lote gerando despesa no caixa</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Caixa do Dia (dinheiro na gaveta vs digital) exclusivo para Admin</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E7EAE7] p-6 space-y-2.5 text-xs sm:text-sm">
                {[
                  ["(+) Receita Bruta Recebida (Caixa)", "R$ 28.800,00", "text-[#252B27] font-semibold"],
                  ["(-) Descontos & Taxas de Maquininha", "- R$ 1.240,00", "text-[#737D75]"],
                  ["(=) Receita Operacional Líquida", "R$ 27.560,00", "text-[#142D26] font-bold"],
                  ["(-) Custos Variáveis (Insumos + Comissões)", "- R$ 9.640,00", "text-[#D97706] font-semibold"],
                  ["(-) Despesas Fixas Pagas no Período", "- R$ 6.500,00", "text-[#DC4C4C] font-semibold"],
                  ["(=) Lucro Líquido Operacional Real", "R$ 11.420,00 (39,6%)", "text-[#16A36A] font-extrabold"],
                ].map(([label, value, cls]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-2.5 border-b border-[#E7EAE7] last:border-b-0"
                  >
                    <span className="text-[#343C36] text-left">{label}</span>
                    <span className={`font-mono tabular-nums whitespace-nowrap ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "crm" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-5 space-y-4 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#247653] block">
                  Retenção &amp; Controle Químico
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#142D26] leading-tight">
                  CRM Inteligente &amp; Estoque Auditável
                </h3>
                <p className="font-editorial text-sm text-[#737D75] leading-relaxed">
                  Evite pátio vazio em dias chuvosos, traga clientes sumidos de volta sem spam e monitore o consumo real de vitrificadores e shampoos.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#252B27] font-medium pt-1">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Fila Para Chamar Hoje com adiamento 15d e proteção anti-spam</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Alerta de sumidos 45d+, garantia de vitrificação e Curva ABC</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#247653] shrink-0 mt-0.5" />
                    <span>Custo Médio Móvel, validade de frasco aberto e baixa por ficha técnica</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {[
                  {
                    title: "Gatilho Dias de Chuva",
                    desc: "Disparo direcionado via WhatsApp ofertando higienização interna e cristalização de vidros que independem do sol.",
                  },
                  {
                    title: "Curva ABC & Sumidos 45d+",
                    desc: "Classifica clientes que geram 70% do faturamento e sinaliza retornos em atraso com atribuição de receita recuperada.",
                  },
                  {
                    title: "Manutenção de Vitrificação",
                    desc: "Lembrete no ciclo programado do serviço para preservar a garantia do coating e fidelizar recorrentes de alto ticket.",
                  },
                  {
                    title: "Lista de Compras Automática",
                    desc: "Alerta imediato quando um químico atinge o estoque mínimo ou se aproxima do vencimento após abertura do frasco.",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="bg-white rounded-3xl border border-[#E7EAE7] p-5 space-y-1.5"
                  >
                    <div className="font-heading text-base font-bold text-[#142D26]">
                      {card.title}
                    </div>
                    <p className="text-xs text-[#737D75] leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
