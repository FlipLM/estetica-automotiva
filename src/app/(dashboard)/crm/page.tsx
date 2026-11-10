"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  CloudRain,
  Clock,
  ShieldCheck,
  Star,
  Users,
  MessageCircle,
  ExternalLink,
  Car,
  TrendingUp,
  Award,
  Filter,
} from "lucide-react";

interface AnalyzedCustomer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email?: string;
  totalSpent: number;
  ordersCount: number;
  lastVisitDate?: string;
  daysSinceLastVisit?: number;
  primaryVehicle?: {
    plate: string;
    model: string;
    category: string;
  };
  lastServiceName: string;
  hasCoating: boolean;
  hasInteriorClean: boolean;
  isChurnRisk: boolean;
  isPostSaleReady: boolean;
  isCoatingDue: boolean;
  classification: "A" | "B" | "C";
}

interface CRMSummary {
  totalCustomers: number;
  vipCustomersCount: number;
  churnRiskCount: number;
  coatingDueCount: number;
  postSalePendingCount: number;
  averageLTV: number;
}

export default function CRMPage() {
  const [customers, setCustomers] = useState<AnalyzedCustomer[]>([]);
  const [summary, setSummary] = useState<CRMSummary | null>(null);
  const [activeTab, setActiveTab] = useState<
    "RAINY_DAY" | "CHURN_RISK" | "COATING_WARRANTY" | "POST_SALE" | "VIP" | "ALL"
  >("RAINY_DAY");
  const [loading, setLoading] = useState(true);

  // Modal WhatsApp Message
  const [selectedCustomer, setSelectedCustomer] = useState<AnalyzedCustomer | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm?filter=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do CRM:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, [activeTab]);

  const generateMessage = (customer: AnalyzedCustomer, type: string) => {
    const vehicleName = customer.primaryVehicle
      ? `${customer.primaryVehicle.model}`
      : "seu veículo";

    if (type === "RAINY_DAY") {
      return `Olá, ${customer.name}! Tudo bem?\n\nNotamos o tempo chuvoso hoje e preparamos uma condição especial para cuidar do seu ${vehicleName} na nossa cabine interna:\n\n🌧️ *Cristalização de Para-brisa* (repelência imediata de água e máxima visibilidade);\n✨ *Higienização de Bancos & Oxi-Sanitização do Ar-Condicionado*.\n\nPodemos reservar um horário para você hoje?`;
    }

    if (type === "CHURN_RISK") {
      return `Olá, ${customer.name}! Já faz algum tempo desde a última visita do seu ${vehicleName}.\n\nPara mantermos a pintura e a proteção sempre impecáveis, queremos te presentear com uma *Descontaminação dos Vidros de Cortesia* na sua próxima lavagem técnica.\n\nQual o melhor dia desta semana para você nos visitar?`;
    }

    if (type === "COATING_WARRANTY") {
      return `Olá, ${customer.name}! Esperamos que esteja tudo ótimo.\n\nConstatamos que o seu ${vehicleName} está no período ideal para a *Revisão Preventiva da Vitrificação Cerâmica*. Essa manutenção é essencial para renovar o brilho e assegurar a garantia da proteção da pintura.\n\nPodemos agendar a sua vistoria sem custo esta semana?`;
    }

    if (type === "POST_SALE") {
      return `Olá, ${customer.name}! Como está o ${vehicleName} após o atendimento conosco?\n\nSua satisfação é a nossa maior prioridade. Se puder dedicar 30 segundos para nos avaliar no link abaixo, ficaríamos muito gratos:\nhttps://g.page/review/detail-pro-auto\n\nQualquer dúvida ou detalhe, estamos à disposição!`;
    }

    return `Olá, ${customer.name}! Como cliente VIP da nossa estética, estamos passando para agradecer sua fidelidade e apresentar novos cuidados exclusivos para o seu ${vehicleName}.`;
  };

  const handleOpenMessageModal = (customer: AnalyzedCustomer) => {
    setSelectedCustomer(customer);
    const msg = generateMessage(customer, activeTab);
    setCustomMessage(msg);
    setShowModal(true);
  };

  const handleSendWhatsApp = () => {
    if (!selectedCustomer) return;
    const cleanPhone = selectedCustomer.whatsapp.replace(/\D/g, "");
    const encoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/55${cleanPhone}?text=${encoded}`;
    window.open(url, "_blank");
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-cyan-400" />
            CRM Inteligente & Campanhas de Retenção
          </h1>
          <p className="text-slate-400 text-sm">
            Fidelização ativa, campanhas expressas de dias de chuva, garantia de vitrificação e pós-venda.
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div
            onClick={() => setActiveTab("RAINY_DAY")}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              activeTab === "RAINY_DAY"
                ? "bg-cyan-950/40 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Dias de Chuva</span>
              <CloudRain className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-slate-100">Campanha Ativa</div>
            <div className="text-[11px] text-slate-500 mt-1">Serviços de Cabine Interna</div>
          </div>

          <div
            onClick={() => setActiveTab("CHURN_RISK")}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              activeTab === "CHURN_RISK"
                ? "bg-rose-950/40 border-rose-500 text-rose-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Sem Retorno (45+ dias)</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-400">
              {summary.churnRiskCount} clientes
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Risco de perda / Churn</div>
          </div>

          <div
            onClick={() => setActiveTab("COATING_WARRANTY")}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              activeTab === "COATING_WARRANTY"
                ? "bg-amber-950/40 border-amber-500 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Garantia Vitrificação</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400">
              {summary.coatingDueCount} revisões
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Garantia e manutenção</div>
          </div>

          <div
            onClick={() => setActiveTab("POST_SALE")}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              activeTab === "POST_SALE"
                ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Pós-Venda & NPS</span>
              <Star className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {summary.postSalePendingCount} avaliações
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Últimos 1 a 3 dias</div>
          </div>

          <div
            onClick={() => setActiveTab("VIP")}
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              activeTab === "VIP"
                ? "bg-purple-950/40 border-purple-500 text-purple-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Curva ABC (VIPs)</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-400">
              {summary.vipCustomersCount} VIPs
            </div>
            <div className="text-[11px] text-slate-500 mt-1">70% do faturamento</div>
          </div>
        </div>
      )}

      {/* Explicação da Estratégia Ativa */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="text-xs text-slate-300">
          {activeTab === "RAINY_DAY" && (
            <p>
              🌧️ <span className="font-semibold text-cyan-300">Gatilho de Dias de Chuva:</span> Dispare
              mensagens com ofertas de serviços internos que não dependem do clima (higienização de
              estofados, oxi-sanitização e repelente de para-brisa) para manter o pátio faturando mesmo
              com chuva.
            </p>
          )}
          {activeTab === "CHURN_RISK" && (
            <p>
              ⚠️ <span className="font-semibold text-rose-300">Resgate de Clientes Inativos:</span> Clientes
              que não realizam serviços há mais de 45 dias recebem uma oferta especial para retornar à
              estética.
            </p>
          )}
          {activeTab === "COATING_WARRANTY" && (
            <p>
              🛡️ <span className="font-semibold text-amber-300">Manutenção de Vitrificação:</span> Revise a
              repelência da pintura e certifique a garantia dos clientes com cerâmica/grafeno a cada 6
              meses.
            </p>
          )}
          {activeTab === "POST_SALE" && (
            <p>
              ⭐ <span className="font-semibold text-emerald-300">Pós-Venda Automático:</span> Colete
              feedbacks 24h a 48h após a conclusão do serviço e direcione para avaliações 5 estrelas no
              Google Meu Negócio.
            </p>
          )}
          {activeTab === "VIP" && (
            <p>
              💎 <span className="font-semibold text-purple-300">Clientes Classe A (Curva ABC):</span> Seus
              maiores clientes em LTV (Lifetime Value). Trate com condições e prioridade diferenciada.
            </p>
          )}
          {activeTab === "ALL" && (
            <p>
              👥 <span className="font-semibold text-slate-200">Base Completa de Clientes:</span> Visão
              geral de todos os clientes cadastrados e métricas financeiras acumuladas.
            </p>
          )}
        </div>
        <button
          onClick={() => setActiveTab(activeTab === "ALL" ? "RAINY_DAY" : "ALL")}
          className="text-xs text-cyan-400 hover:underline shrink-0 ml-4"
        >
          {activeTab === "ALL" ? "Voltar às Campanhas" : "Ver Todos os Clientes"}
        </button>
      </div>

      {/* Lista de Clientes do Segmento */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Veículo Principal</th>
                <th className="px-6 py-3">Classificação</th>
                <th className="px-6 py-3">LTV / Total Pago</th>
                <th className="px-6 py-3">Última Visita</th>
                <th className="px-6 py-3 text-right">Ação WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhum cliente no momento para este filtro de retenção.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-100">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.whatsapp || c.phone}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      {c.primaryVehicle ? (
                        <div className="text-xs">
                          <span className="font-semibold text-slate-200 flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-slate-400" />
                            {c.primaryVehicle.model}
                          </span>
                          <span className="text-slate-500">Placa: {c.primaryVehicle.plate}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Sem veículo cadastrado</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          c.classification === "A"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : c.classification === "B"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        Classe {c.classification}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-400">
                      R$ {c.totalSpent.toFixed(2)}
                      <div className="text-[11px] text-slate-500 font-normal">
                        {c.ordersCount} atendimentos
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {c.daysSinceLastVisit !== null ? (
                        <>
                          <div>há {c.daysSinceLastVisit} dias</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(c.lastVisitDate!).toLocaleDateString("pt-BR")}
                          </div>
                        </>
                      ) : (
                        "Sem histórico"
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenMessageModal(c)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Disparar WhatsApp
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Envio Personalizado WhatsApp */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              Enviar Mensagem via WhatsApp
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Destinatário:{" "}
              <span className="font-semibold text-slate-200">{selectedCustomer.name}</span> (
              {selectedCustomer.whatsapp})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Texto da Mensagem (pode ser editado antes de enviar):
                </label>
                <textarea
                  rows={7}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-cyan-500 font-mono leading-relaxed resize-none"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                💡 Ao clicar em "Abrir no WhatsApp", o sistema abrirá o aplicativo ou WhatsApp Web
                diretamente na conversa com o cliente já com o texto preenchido.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

