"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  Search,
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  Car,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Card, Button, Input, Modal, Badge } from "@/components/ui";

interface TenantOwner {
  name: string;
  email: string;
  phone?: string;
}

interface TenantItem {
  id: string;
  name: string;
  tradingName?: string;
  document?: string;
  phone?: string;
  plan: "TRIAL" | "ACTIVE" | "EXPIRED" | "BLOCKED";
  isCustomPlan: boolean;
  trialExpiresAt?: string | null;
  isExpired: boolean;
  remainingHours: number;
  createdAt: string;
  owner: TenantOwner | null;
  stats: {
    vehiclesCount: number;
    ordersCount: number;
    usersCount: number;
  };
}

export default function AdminSaaSPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");

  // Modal de Criação de Acesso Temporário
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formCompany, setFormCompany] = useState("");
  const [formAdminName, setFormAdminName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("teste123");
  const [formDays, setFormDays] = useState(3);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal de Acesso Gerado com Sucesso
  const [createdLead, setCreatedLead] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Ações nos Tenants existentes
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadTenants() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      if (res.ok) {
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error("Erro ao carregar tenants:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formCompany,
          tradingName: formCompany,
          adminName: formAdminName,
          email: formEmail,
          phone: formPhone,
          password: formPassword,
          trialDays: Number(formDays) || 3,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar acesso.");

      setCreateModalOpen(false);
      setCreatedLead(data.lead);
      resetCreateForm();
      loadTenants();
    } catch (err: any) {
      setCreateError(err.message || "Falha na conexão.");
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setFormCompany("");
    setFormAdminName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("teste123");
    setFormDays(3);
    setCreateError(null);
  }

  async function handleUpdateTenant(tenantId: string, updates: any) {
    try {
      setActionLoadingId(tenantId);
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao atualizar empresa.");
        return;
      }

      await loadTenants();
    } catch (err) {
      console.error(err);
      alert("Erro na conexão com o servidor.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.tradingName && t.tradingName.toLowerCase().includes(search.toLowerCase())) ||
        (t.owner && t.owner.name.toLowerCase().includes(search.toLowerCase())) ||
        (t.owner && t.owner.email.toLowerCase().includes(search.toLowerCase())) ||
        (t.phone && t.phone.includes(search));

      if (!matchesSearch) return false;

      if (filterPlan === "TRIAL_ACTIVE") return t.plan === "TRIAL" && !t.isExpired;
      if (filterPlan === "TRIAL_EXPIRED") return t.plan === "TRIAL" && t.isExpired;
      if (filterPlan === "ACTIVE") return t.plan === "ACTIVE";
      if (filterPlan === "BLOCKED") return t.plan === "BLOCKED";

      return true;
    });
  }, [tenants, search, filterPlan]);

  // Contadores para o Dashboard
  const totalTenants = tenants.length;
  const trialActiveCount = tenants.filter((t) => t.plan === "TRIAL" && !t.isExpired).length;
  const trialExpiredCount = tenants.filter((t) => t.plan === "TRIAL" && t.isExpired).length;
  const activeCount = tenants.filter((t) => t.plan === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Topo do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-white border border-[#E7EAE7] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#142D26] flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-6 h-6 text-[#E9F3EC]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#142D26]">
                Painel do Administrador SaaS
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#16A36A] text-white text-[10px] font-bold uppercase">
                Master Admin
              </span>
            </div>
            <p className="text-xs text-[#737D75] mt-0.5">
              Gestão de empresas, geração de acessos temporários para leads e controle de assinaturas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadTenants}
            className="p-2.5 rounded-xl border border-[#E7EAE7] bg-[#F7F8F6] hover:bg-[#E9F3EC] text-[#252B27] transition cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#247653] hover:bg-[#1E6346] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Acesso Temporário</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas SaaS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#E7EAE7] space-y-1 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737D75]">
            Total de Empresas
          </span>
          <p className="text-2xl font-extrabold text-[#142D26]">{totalTenants}</p>
          <span className="text-[11px] text-[#737D75]">Cadastradas no sistema</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
              Leads em Teste Ativo
            </span>
            <Clock className="w-4 h-4 text-[#D97706] animate-pulse" />
          </div>
          <p className="text-2xl font-extrabold text-[#92400E]">{trialActiveCount}</p>
          <span className="text-[11px] text-[#B45309]">Avaliando nos 3 dias</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#DC4C4C]">
              Leads Expirados
            </span>
            <AlertTriangle className="w-4 h-4 text-[#DC4C4C]" />
          </div>
          <p className="text-2xl font-extrabold text-[#DC4C4C]">{trialExpiredCount}</p>
          <span className="text-[11px] text-[#DC4C4C]">Oportunidades de Venda</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#065F46]">
              Clientes Ativos (PRO)
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />
          </div>
          <p className="text-2xl font-extrabold text-[#065F46]">{activeCount}</p>
          <span className="text-[11px] text-[#065F46]">Acesso ilimitado liberado</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E7EAE7]">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-[#737D75] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por estética, dono ou e-mail..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-[#737D75] mr-1">Filtrar:</span>
          {[
            { id: "ALL", label: "Todos" },
            { id: "TRIAL_ACTIVE", label: "Em Teste" },
            { id: "TRIAL_EXPIRED", label: "Expirados" },
            { id: "ACTIVE", label: "Plano Ativo" },
            { id: "BLOCKED", label: "Bloqueados" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterPlan(f.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterPlan === f.id
                  ? "bg-[#142D26] text-white"
                  : "bg-[#F7F8F6] hover:bg-[#E9F3EC] text-[#343C36] border border-[#E7EAE7]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Empresas / Leads */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8F6] text-[#737D75] font-bold uppercase tracking-wider text-[10px] border-b border-[#E7EAE7]">
              <tr>
                <th className="py-3 px-4">Empresa / Estética</th>
                <th className="py-3 px-4">Responsável / Contato</th>
                <th className="py-3 px-4">Status & Prazo</th>
                <th className="py-3 px-4 text-center">Uso da Plataforma</th>
                <th className="py-3 px-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAE7]">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#737D75] text-xs">
                    Nenhuma empresa encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isLoadingThis = actionLoadingId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-[#F7F8F6]/60 transition-colors">
                      {/* Empresa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#E9F3EC] text-[#142D26] font-bold flex items-center justify-center shrink-0">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#252B27] truncate max-w-[180px]">
                              {t.tradingName || t.name}
                            </p>
                            <p className="text-[11px] text-[#737D75] truncate max-w-[180px]">
                              {t.name}
                            </p>
                            {t.isCustomPlan && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[9px] font-bold">
                                Sistema Próprio
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="py-3.5 px-4 text-[#343C36]">
                        {t.owner ? (
                          <div>
                            <p className="font-semibold text-[#252B27]">{t.owner.name}</p>
                            <p className="text-[11px] text-[#737D75]">{t.owner.email}</p>
                            {t.owner.phone && (
                              <a
                                href={`https://wa.me/${t.owner.phone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#16A36A] hover:underline flex items-center gap-1 font-semibold mt-0.5"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>{t.owner.phone}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#737D75] italic">Sem usuário vinculado</span>
                        )}
                      </td>

                      {/* Status & Prazo */}
                      <td className="py-3.5 px-4">
                        {t.plan === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] font-bold text-[11px] border border-[#A7F3D0]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                            <span>Ativo Permanente</span>
                          </span>
                        ) : t.plan === "BLOCKED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC4C4C] font-bold text-[11px] border border-[#FECACA]">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Acesso Bloqueado</span>
                          </span>
                        ) : t.isExpired ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC4C4C] font-bold text-[11px] border border-[#FECACA]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Teste Expirado</span>
                            </span>
                            <p className="text-[10px] text-[#737D75] mt-1">Lead aguardando conversão</p>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#92400E] font-bold text-[11px] border border-[#FDE68A]">
                              <Clock className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
                              <span>{Math.ceil(t.remainingHours / 24)} dias restantes</span>
                            </span>
                            <p className="text-[10px] text-[#737D75] mt-1">
                              {t.remainingHours}h de avaliação
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Uso da Plataforma */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2 text-[11px] bg-[#F7F8F6] px-2.5 py-1 rounded-lg border border-[#E7EAE7]">
                          <span title="Ordens de Serviço">
                            📋 <strong>{t.stats.ordersCount}</strong> OS
                          </span>
                          <span>•</span>
                          <span title="Veículos Cadastrados">
                            🚗 <strong>{t.stats.vehiclesCount}</strong> carros
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.plan !== "ACTIVE" && (
                            <button
                              type="button"
                              disabled={isLoadingThis}
                              onClick={() => handleUpdateTenant(t.id, { plan: "ACTIVE" })}
                              className="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] font-bold text-[11px] border border-[#A7F3D0] transition cursor-pointer"
                              title="Liberar acesso vitalício / ilimitado (Plano PRO)"
                            >
                              Liberar PRO
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isLoadingThis}
                            onClick={() => handleUpdateTenant(t.id, { extendDays: 3 })}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] font-bold text-[11px] border border-[#FDE68A] transition cursor-pointer"
                            title="Adicionar mais 3 dias de teste para o lead"
                          >
                            +3 dias
                          </button>

                          {t.plan !== "BLOCKED" && (
                            <button
                              type="button"
                              disabled={isLoadingThis}
                              onClick={() => handleUpdateTenant(t.id, { plan: "BLOCKED" })}
                              className="p-1.5 rounded-lg text-[#737D75] hover:text-[#DC4C4C] hover:bg-[#FEF2F2] transition cursor-pointer"
                              title="Bloquear acesso desta oficina"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================================
          MODAL: GERAR ACESSO TEMPORÁRIO PARA NOVO LEAD
         ========================================================== */}
      {createModalOpen && (
        <div
          onClick={() => setCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl border border-[#E7EAE7] shadow-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#247653] text-white flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#142D26]">
                    Gerar Acesso Temporário para Lead
                  </h3>
                  <p className="text-xs text-[#737D75]">
                    Crie um acesso instantâneo para seu potencial cliente testar o sistema.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[#737D75] hover:text-[#252B27] p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#DC4C4C]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#343C36] mb-1">
                  Nome da Estética Automotiva *
                </label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Ex: Studio Auto Brilho Detailing"
                  className="w-full h-9 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#343C36] mb-1">
                    Nome do Dono / Contato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAdminName}
                    onChange={(e) => setFormAdminName(e.target.value)}
                    placeholder="Ex: Rodrigo Albuquerque"
                    className="w-full h-9 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#343C36] mb-1">
                    WhatsApp do Dono
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full h-9 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#343C36] mb-1">
                    E-mail de Acesso do Lead *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="rodrigo@autobrilho.com.br"
                    className="w-full h-9 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#343C36] mb-1">
                    Senha Temporária
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="teste123"
                    className="w-full h-9 px-3 text-xs font-mono bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#343C36] mb-1">
                  Tempo de Demonstração Liberado
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 15].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormDays(d)}
                      className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                        formDays === d
                          ? "bg-[#247653] text-white border-[#247653]"
                          : "bg-[#F7F8F6] text-[#343C36] border-[#E7EAE7] hover:bg-[#E9F3EC]"
                      }`}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E7EAE7] text-[#737D75] font-semibold text-xs hover:bg-[#F1F3F1] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-[#247653] hover:bg-[#1E6346] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {creating ? "Gerando..." : "Gerar Acesso e Mensagem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: ACESSO GERADO COM SUCESSO (COPIAR WHATSAPP)
         ========================================================== */}
      {createdLead && (
        <div
          onClick={() => setCreatedLead(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl border border-[#E7EAE7] shadow-2xl p-6 sm:p-8 space-y-5"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#16A36A] border border-[#A7F3D0] mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#142D26]">
                Acesso Temporário Criado com Sucesso!
              </h3>
              <p className="text-xs text-[#737D75]">
                A empresa <strong className="text-[#252B27]">{createdLead.companyName}</strong> já foi provisionada no SaaS com {createdLead.trialDays} dias de avaliação.
              </p>
            </div>

            {/* Mensagem Formatada para WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[#737D75] flex items-center justify-between">
                <span>Mensagem Pronta para WhatsApp:</span>
                <span className="text-[10px] text-[#16A36A]">Pronta para envio</span>
              </label>
              <textarea
                rows={7}
                readOnly
                value={createdLead.whatsappMessage}
                className="w-full p-3.5 text-xs font-mono bg-[#F7F8F6] border border-[#E7EAE7] rounded-2xl text-[#252B27] focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(createdLead.whatsappMessage)}
                className="flex-1 py-3 px-4 rounded-xl border border-[#247653] bg-white hover:bg-[#E9F3EC] text-[#247653] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#16A36A]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Mensagem Copiada!" : "Copiar Mensagem"}</span>
              </button>

              {createdLead.phone && (
                <a
                  href={`https://wa.me/${createdLead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    createdLead.whatsappMessage
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#16A36A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Abrir no WhatsApp</span>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCreatedLead(null)}
              className="w-full text-center text-xs text-[#737D75] hover:text-[#252B27] font-semibold pt-1 cursor-pointer"
            >
              Fechar e Voltar ao Painel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
