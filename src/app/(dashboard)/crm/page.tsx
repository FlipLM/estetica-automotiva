"use client";

import { useState, useEffect } from "react";
import {
  CloudRain,
  Clock,
  ShieldCheck,
  Star,
  Users,
  MessageCircle,
  ExternalLink,
  Car,
  Award,
} from "lucide-react";
import {
  Button,
  Badge,
  PageHeader,
  Modal,
  EmptyState,
  LoadingState,
  Textarea,
} from "@/components/ui";

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

  const campaignCards = [
    {
      id: "RAINY_DAY" as const,
      label: "Dias de Chuva",
      value: "Campanha Ativa",
      subtitle: "Serviços de Cabine Interna",
      icon: CloudRain,
      activeBorder: "border-[#2563EB]",
      activeBg: "bg-[#EFF6FF]/60",
      iconColor: "text-[#2563EB]",
    },
    {
      id: "CHURN_RISK" as const,
      label: "Sem Retorno (45+ dias)",
      value: `${summary?.churnRiskCount ?? 0} clientes`,
      subtitle: "Risco de inatividade",
      icon: Clock,
      activeBorder: "border-[#DC4C4C]",
      activeBg: "bg-[#FEF2F2]/60",
      iconColor: "text-[#DC4C4C]",
    },
    {
      id: "COATING_WARRANTY" as const,
      label: "Garantia Vitrificação",
      value: `${summary?.coatingDueCount ?? 0} revisões`,
      subtitle: "Manutenção semestral",
      icon: ShieldCheck,
      activeBorder: "border-[#D97706]",
      activeBg: "bg-[#FFFBEB]/60",
      iconColor: "text-[#D97706]",
    },
    {
      id: "POST_SALE" as const,
      label: "Pós-Venda e Avaliação",
      value: `${summary?.postSalePendingCount ?? 0} avaliações`,
      subtitle: "Últimos 1 a 3 dias",
      icon: Star,
      activeBorder: "border-[#16A36A]",
      activeBg: "bg-[#ECFDF5]/60",
      iconColor: "text-[#16A36A]",
    },
    {
      id: "VIP" as const,
      label: "Curva ABC (VIPs)",
      value: `${summary?.vipCustomersCount ?? 0} VIPs`,
      subtitle: "70% do faturamento",
      icon: Award,
      activeBorder: "border-[#247653]",
      activeBg: "bg-[#E9F3EC]/70",
      iconColor: "text-[#247653]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM e Retenção de Clientes"
        description="Fidelização ativa, campanhas para dias de chuva, revisões de vitrificação e acompanhamento pós-venda."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab(activeTab === "ALL" ? "RAINY_DAY" : "ALL")}
          >
            {activeTab === "ALL" ? "Voltar às Campanhas" : "Ver Todos os Clientes"}
          </Button>
        }
      />

      {/* Cards de Segmentação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {campaignCards.map((card) => {
          const isActive = activeTab === card.id;
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className={`rounded-xl p-4 border cursor-pointer transition-all shadow-xs ${
                isActive
                  ? `${card.activeBg} ${card.activeBorder}`
                  : "bg-white border-[#E7EAE7] hover:border-[#247653]/40"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#737D75] font-medium mb-1.5">
                <span>{card.label}</span>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <div className="text-lg font-bold text-[#252B27]">{card.value}</div>
              <div className="text-xs text-[#737D75] mt-1">{card.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* Explicação da Estratégia Ativa */}
      <div className="bg-[#E9F3EC]/60 border border-[#247653]/20 rounded-xl p-4 flex items-center justify-between text-xs text-[#142D26]">
        <div>
          {activeTab === "RAINY_DAY" && (
            <p>
              🌧️ <strong>Campanha de Dias de Chuva:</strong> Envie ofertas de serviços internos que não dependem do clima (higienização de bancos, oxi-sanitização e cristalização de para-brisa) para manter o pátio produtivo mesmo em dias chuvosos.
            </p>
          )}
          {activeTab === "CHURN_RISK" && (
            <p>
              ⚠️ <strong>Resgate de Clientes Inativos:</strong> Clientes que não visitam a estética há mais de 45 dias recebem um convite personalizado com cortesia para agendar o retorno.
            </p>
          )}
          {activeTab === "COATING_WARRANTY" && (
            <p>
              🛡️ <strong>Manutenção de Vitrificação:</strong> Convide clientes com proteção cerâmica para a revisão semestral de repelência e renovação de garantia.
            </p>
          )}
          {activeTab === "POST_SALE" && (
            <p>
              ⭐ <strong>Pós-Venda Automático:</strong> Colete feedbacks após a entrega do veículo e convide o cliente para avaliar sua estética no Google.
            </p>
          )}
          {activeTab === "VIP" && (
            <p>
              💎 <strong>Clientes Classe A (Curva ABC):</strong> Seus maiores clientes em volume investido (LTV). Ofereça atendimento prioritário e benefícios exclusivos.
            </p>
          )}
          {activeTab === "ALL" && (
            <p>
              👥 <strong>Base Completa de Clientes:</strong> Visão geral de todos os clientes analisados pelo CRM com histórico de visitas e classificação ABC.
            </p>
          )}
        </div>
      </div>

      {/* Lista de Clientes do Segmento */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <LoadingState message="Analisando histórico de visitas e campanhas..." />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Nenhum cliente neste segmento"
            description="Não há clientes enquadrados neste filtro de campanha no momento."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Veículo Principal</th>
                  <th className="px-6 py-3 font-semibold">Classificação</th>
                  <th className="px-6 py-3 font-semibold">LTV / Total Investido</th>
                  <th className="px-6 py-3 font-semibold">Última Visita</th>
                  <th className="px-6 py-3 font-semibold text-right">Contato Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F1]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F8F6]/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-[#252B27]">{c.name}</div>
                      <div className="text-xs text-[#737D75]">{c.whatsapp || c.phone}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      {c.primaryVehicle ? (
                        <div className="text-xs">
                          <span className="font-semibold text-[#252B27] flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-[#247653]" />
                            {c.primaryVehicle.model}
                          </span>
                          <span className="text-[#737D75]">Placa: {c.primaryVehicle.plate}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9CA49E]">Sem veículo cadastrado</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        variant={
                          c.classification === "A"
                            ? "brand"
                            : c.classification === "B"
                            ? "info"
                            : "neutral"
                        }
                        size="sm"
                      >
                        Classe {c.classification}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-[#247653]">
                      R$ {c.totalSpent.toFixed(2)}
                      <div className="text-xs text-[#737D75] font-normal">
                        {c.ordersCount} atendimentos
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[#737D75]">
                      {c.daysSinceLastVisit !== null && c.daysSinceLastVisit !== undefined ? (
                        <>
                          <div className="font-medium text-[#252B27]">
                            há {c.daysSinceLastVisit} dias
                          </div>
                          {c.lastVisitDate && (
                            <div className="text-[11px] text-[#737D75]">
                              {new Date(c.lastVisitDate).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </>
                      ) : (
                        "Sem histórico"
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenMessageModal(c)}
                        leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                      >
                        Enviar WhatsApp
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Envio Personalizado WhatsApp */}
      <Modal
        isOpen={showModal && !!selectedCustomer}
        onClose={() => setShowModal(false)}
        title="Enviar Mensagem pelo WhatsApp"
        description={
          selectedCustomer
            ? `Destinatário: ${selectedCustomer.name} (${selectedCustomer.whatsapp})`
            : ""
        }
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Texto da Mensagem (você pode editar antes de enviar)"
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />

          <div className="text-xs text-[#737D75] bg-[#F7F8F6] p-3 rounded-lg border border-[#E7EAE7]">
            Ao clicar em <strong>Abrir no WhatsApp</strong>, o sistema abrirá a conversa diretamente com o cliente já com a mensagem preenchida.
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSendWhatsApp}
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Abrir no WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
