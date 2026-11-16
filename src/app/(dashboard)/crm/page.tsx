"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  FileText,
  ShieldCheck,
  UserX,
  HeartHandshake,
  CloudRain,
  Cake,
  Crown,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  PageHeader,
  Alert,
  LoadingState,
  EmptyState,
  SearchInput,
  Pagination,
  Button,
  Badge,
} from "@/components/ui";
import { CrmSummaryCards } from "@/components/modules/crm/crm-summary-cards";
import { CrmCustomerTable } from "@/components/modules/crm/crm-customer-table";
import { CrmWhatsAppModal } from "@/components/modules/crm/crm-whatsapp-modal";
import {
  type CrmCustomer,
  type CrmPagination,
  type CrmSegment,
  type CrmSummary,
  type CrmTenantInfo,
  resolveEffectiveCampaign,
} from "@/components/modules/crm/types";

interface SegmentTabConfig {
  id: CrmSegment;
  label: string;
  countKey: keyof CrmSummary;
  icon: React.ReactNode;
}

const SEGMENT_TABS: SegmentTabConfig[] = [
  {
    id: "TODAY",
    label: "Para Chamar Hoje",
    countKey: "todayCount",
    icon: <BellRing className="w-3.5 h-3.5" />,
  },
  {
    id: "BUDGET_RECOVERY",
    label: "Orçamentos em Aberto",
    countKey: "budgetRecoveryCount",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  {
    id: "COATING_WARRANTY",
    label: "Manutenção / Garantia",
    countKey: "coatingDueCount",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
  {
    id: "CHURN_RISK",
    label: "Sumidos (+45d)",
    countKey: "churnRiskCount",
    icon: <UserX className="w-3.5 h-3.5" />,
  },
  {
    id: "POST_SALE",
    label: "Pós-Venda",
    countKey: "postSaleCount",
    icon: <HeartHandshake className="w-3.5 h-3.5" />,
  },
  {
    id: "RAINY_DAY",
    label: "Dia de Chuva",
    countKey: "rainyDayCount",
    icon: <CloudRain className="w-3.5 h-3.5" />,
  },
  {
    id: "BIRTHDAY",
    label: "Aniversariantes",
    countKey: "birthdayCount",
    icon: <Cake className="w-3.5 h-3.5" />,
  },
  {
    id: "VIP",
    label: "Clientes Ouro",
    countKey: "vipCount",
    icon: <Crown className="w-3.5 h-3.5" />,
  },
  {
    id: "ALL",
    label: "Todos",
    countKey: "allCount",
    icon: <Users className="w-3.5 h-3.5" />,
  },
];

const INITIAL_SUMMARY: CrmSummary = {
  totalCustomers: 0,
  totalRevenue: 0,
  todayCount: 0,
  budgetRecoveryCount: 0,
  coatingDueCount: 0,
  churnRiskCount: 0,
  postSaleCount: 0,
  rainyDayCount: 0,
  birthdayCount: 0,
  vipCount: 0,
  allCount: 0,
  contactedLast30Days: 0,
  roi30dRevenue: 0,
  roi30dOrdersCount: 0,
};

export default function CrmRetentionPage() {
  const [activeTab, setActiveTab] = useState<CrmSegment>("TODAY");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [hideContacted, setHideContacted] = useState(true);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenantInfo, setTenantInfo] = useState<CrmTenantInfo>({
    name: "Sua Estética",
    googleReviewUrl: null,
  });
  const [summary, setSummary] = useState<CrmSummary>(INITIAL_SUMMARY);
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [pagination, setPagination] = useState<CrmPagination>({
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 1,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomer | null>(
    null
  );

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadCrmData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        filter: activeTab,
        page: String(page),
        limit: "25",
        hideContacted: String(hideContacted),
      });
      if (debouncedQuery) {
        params.set("q", debouncedQuery);
      }

      const res = await fetch(`/api/crm?${params.toString()}`);

      if (res.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar CRM & Retenção.");
      }

      setForbidden(false);
      setTenantInfo(
        data.tenant || { name: "Sua Estética", googleReviewUrl: null }
      );
      setSummary(data.summary || INITIAL_SUMMARY);
      setCustomers(data.customers || []);
      setPagination(
        data.pagination || { page: 1, limit: 25, totalItems: 0, totalPages: 1 }
      );
    } catch (err: any) {
      setError(err.message || "Falha ao carregar os dados de retenção.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedQuery, hideContacted, page]);

  useEffect(() => {
    loadCrmData();
  }, [loadCrmData]);

  function handleSelectTab(tab: CrmSegment) {
    setActiveTab(tab);
    setPage(1);
    // Nas abas de histórico completo, mostra todos por padrão; nas filas de ação, aplica anti-spam
    if (tab === "VIP" || tab === "ALL") {
      setHideContacted(false);
    } else {
      setHideContacted(true);
    }
  }

  if (forbidden) {
    return (
      <div className="space-y-6 max-w-3xl">
        <PageHeader
          title="CRM & Retenção"
          description="Central de relacionamento e reativação de clientes."
        />
        <Alert
          variant="error"
          title="Acesso restrito a administradores"
          description="O módulo de CRM exibe faturamento acumulado por cliente e listas de contato comercial, disponíveis apenas para usuários com perfil Administrador."
        />
        <div>
          <Link href="/patio">
            <Button variant="outline">Voltar para o Pátio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const effectiveModalCampaign = selectedCustomer
    ? resolveEffectiveCampaign(selectedCustomer, activeTab)
    : "MANUAL";

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM & Retenção de Clientes"
        description="Descubra quem chamar hoje no WhatsApp para recuperar orçamentos, evitar clientes sumidos e gerar retorno recorrente."
        badge={
          <Badge variant="success" size="sm">
            {summary.totalCustomers} clientes na base
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadCrmData}
            disabled={loading}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            }
          >
            Atualizar fila
          </Button>
        }
      />

      {error && (
        <Alert
          variant="error"
          title="Não foi possível carregar o CRM"
          description={error}
        />
      )}

      {/* KPIs acionáveis e ROI dos últimos 30 dias */}
      <CrmSummaryCards
        summary={summary}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Abas de Segmentação */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {SEGMENT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const countValue = summary[tab.countKey] ?? 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#142D26] text-white shadow-2xs"
                    : "bg-[#F7F8F6] text-[#5B655D] hover:bg-[#E9F3EC] hover:text-[#142D26]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-[#247653] text-white"
                      : "bg-white text-[#252B27] border border-[#E7EAE7]"
                  }`}
                >
                  {countValue}
                </span>
              </button>
            );
          })}
        </div>

        {/* Busca + Anti-spam */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E7EAE7]">
          <div className="w-full sm:max-w-sm">
            <SearchInput
              placeholder="Buscar por nome, telefone, placa ou carro..."
              value={searchInput}
              onChange={(val) => setSearchInput(val)}
              onClear={() => setSearchInput("")}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-[#343C36] font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideContacted}
              onChange={(e) => {
                setHideContacted(e.target.checked);
                setPage(1);
              }}
              className="rounded accent-[#247653]"
            />
            <span>Ocultar clientes já chamados recentemente ou adiados</span>
          </label>
        </div>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <LoadingState message="Analisando histórico de ordens pagas e oportunidades..." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<BellRing className="w-6 h-6 text-[#247653]" />}
          title="Nenhum cliente pendente nesta lista"
          description={
            hideContacted
              ? "Todos os clientes deste filtro já foram atendidos recentemente ou não há pendências no momento."
              : "Não encontramos clientes correspondentes a este filtro ou pesquisa."
          }
          action={
            hideContacted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHideContacted(false);
                  setPage(1);
                }}
              >
                Mostrar inclusive já contatados
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <CrmCustomerTable
            customers={customers}
            activeTab={activeTab}
            onOpenWhatsAppModal={(c) => setSelectedCustomer(c)}
          />

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Modal de Disparo + Log Anti-spam */}
      <CrmWhatsAppModal
        customer={selectedCustomer}
        campaign={effectiveModalCampaign}
        tenant={tenantInfo}
        onClose={() => setSelectedCustomer(null)}
        onSuccess={loadCrmData}
      />
    </div>
  );
}
