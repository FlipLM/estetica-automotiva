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
  KeyRound,
  Eye,
  LogOut,
  Sliders,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface TenantOwner {
  id?: string;
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

export default function GestorMasterPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Estados do Console SaaS
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");

  // Modal de Criação de Acesso Temporário
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formCompany, setFormCompany] = useState("");
  const [formAdminName, setFormAdminName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("123456");
  const [formDays, setFormDays] = useState(3);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal de Acesso Gerado com Sucesso
  const [createdLead, setCreatedLead] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Ações nos Tenants existentes
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // 1. Checa se o usuário já tem cookie master autenticado ou sessão ADMIN ativa
  async function checkAuth() {
    try {
      const res = await fetch("/api/master-saas/auth");
      const data = await res.json();
      if (data.authenticated === true) {
        setIsAuthenticated(true);
        setAdminUser(data.user);
        loadTenants();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function handleLoginMaster(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/master-saas/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Credenciais de administrador incorretas.");
        setAuthLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setAdminUser(data.user);
      loadTenants();
    } catch {
      setAuthError("Falha de conexão com o servidor.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogoutMaster() {
    await fetch("/api/master-saas/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setAdminUser(null);
    setAdminPassword("");
  }

  async function loadTenants() {
    try {
      setLoading(true);
      const res = await fetch("/api/master-saas/tenants");
      const data = await res.json();
      if (res.ok) {
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error("Erro ao carregar oficinas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/master-saas/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formCompany,
          tradingName: formCompany,
          adminName: formAdminName,
          email: formEmail,
          password: formPassword || "123456",
          phone: formPhone,
          trialDays: Number(formDays) || 3,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Erro ao gerar acesso temporário.");
        return;
      }

      setCreatedLead(data.lead);
      setCreateModalOpen(false);

      // Limpa formulário
      setFormCompany("");
      setFormAdminName("");
      setFormEmail("");
      setFormPhone("");
      setFormPassword("123456");
      setFormDays(3);

      await loadTenants();
    } catch (err: any) {
      setCreateError(err.message || "Falha na conexão.");
    } finally {
      setCreating(false);
    }
  }

  async function handleTenantAction(tenantId: string, action: string, additionalDays?: number) {
    try {
      setActionLoadingId(tenantId);
      const res = await fetch(`/api/master-saas/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, additionalDays }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao processar ação.");
        return;
      }

      await loadTenants();
    } catch {
      alert("Falha na comunicação com o servidor.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleImpersonate(tenantId: string) {
    try {
      setActionLoadingId(tenantId);
      const res = await fetch("/api/master-saas/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao acessar a oficina.");
        return;
      }

      window.open(data.redirectUrl || "/patio", "_blank");
    } catch {
      alert("Falha na autenticação em modo suporte.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function handleCopyMessage() {
    if (!createdLead?.whatsappMessage) return;
    navigator.clipboard.writeText(createdLead.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleOpenWhatsApp() {
    if (!createdLead) return;
    const phone = (createdLead.phone || formPhone || "").replace(/\D/g, "");
    const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(createdLead.whatsappMessage)}`;
    window.open(url, "_blank");
  }

  // Métricas do SaaS
  const metrics = useMemo(() => {
    const total = tenants.length;
    const trialsActive = tenants.filter((t) => t.plan === "TRIAL" && !t.isExpired).length;
    const trialsExpired = tenants.filter((t) => t.plan === "TRIAL" && t.isExpired).length;
    const activePro = tenants.filter((t) => t.plan === "ACTIVE").length;

    return { total, trialsActive, trialsExpired, activePro };
  }, [tenants]);

  // Lista Filtrada
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.owner?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.owner?.email || "").toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filterPlan === "TRIAL_ACTIVE") return t.plan === "TRIAL" && !t.isExpired;
      if (filterPlan === "TRIAL_EXPIRED") return t.plan === "TRIAL" && t.isExpired;
      if (filterPlan === "ACTIVE") return t.plan === "ACTIVE";
      if (filterPlan === "BLOCKED") return t.plan === "BLOCKED";

      return true;
    });
  }, [tenants, search, filterPlan]);

  // ---------------------------------------------------------------------------
  // TELA 1: CARREGANDO VERIFICAÇÃO DE SESSÃO
  // ---------------------------------------------------------------------------
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TELA 2: LOGIN DO ADMINISTRADOR GESTOR (E-mail e Senha)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="w-full max-w-md bg-[#131B2E] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Login do Gestor SaaS</h1>
              <p className="text-xs text-slate-400 mt-1">
                Acesse o painel restrito de gerenciamento de licenças e clientes
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginMaster} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>E-mail do Administrador</span>
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="seu-email@administrador.com"
                className="w-full h-11 px-3.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Senha de Acesso</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Sua senha de administrador..."
                  className="w-full h-11 pl-3.5 pr-10 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Entrar no Painel Master</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-500 mt-6">
            DetailPro SaaS Platform • Acesso exclusivo ao Administrador da Plataforma
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TELA 3: CONSOLE MASTER EXCLUSIVO DO DONO DO SAAS
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 antialiased p-4 sm:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* CABEÇALHO DO PAINEL MASTER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Console Gestor SaaS</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Proprietário
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestão comercial de leads, períodos de teste de 3 dias e liberação de clientes PRO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Acesso Temporário (Lead)</span>
            </button>

            {adminUser && (
              <div className="hidden sm:flex flex-col text-right px-2">
                <span className="text-xs font-bold text-white">{adminUser.name}</span>
                <span className="text-[10px] text-emerald-400 font-mono">{adminUser.email}</span>
              </div>
            )}

            <button
              onClick={handleLogoutMaster}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Encerrar Sessão Master"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARDS DE MÉTRICAS DO NEGÓCIO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Total de Oficinas
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white">{metrics.total}</p>
            <p className="text-[11px] text-slate-500">Cadastradas na base</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Testes em Andamento
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-300">{metrics.trialsActive}</p>
            <p className="text-[11px] text-amber-500/70">Leads avaliando no prazo</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Testes Expirados
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-400">{metrics.trialsExpired}</p>
            <p className="text-[11px] text-rose-500/70">Oportunidades p/ fechar venda</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Clientes Ativos PRO
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">{metrics.activePro}</p>
            <p className="text-[11px] text-emerald-500/70">Assinaturas liberadas</p>
          </div>
        </div>

        {/* TABELA DE OFICINAS / LEADS */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">Empresas e Oficinas na Plataforma</h2>
              <p className="text-xs text-slate-400">
                Acompanhe o tempo de uso de cada lead e libere o acesso após o pagamento
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar oficina ou proprietário..."
                  className="h-9 pl-9 pr-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-52 sm:w-64"
                />
              </div>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="h-9 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Planos</option>
                <option value="TRIAL_ACTIVE">Testes Ativos (No prazo)</option>
                <option value="TRIAL_EXPIRED">Testes Expirados</option>
                <option value="ACTIVE">Clientes PRO</option>
                <option value="BLOCKED">Bloqueados</option>
              </select>

              <button
                onClick={loadTenants}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                title="Recarregar Lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Tabela de Tenants */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-3 pl-2">Oficina / Estética</th>
                  <th className="pb-3">Responsável & Contato</th>
                  <th className="pb-3">Status do Acesso</th>
                  <th className="pb-3 text-center">Uso (OS / Veículos)</th>
                  <th className="pb-3 text-right pr-2">Ações Comerciais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((t) => {
                    const isTrialActive = t.plan === "TRIAL" && !t.isExpired;
                    const isTrialExpired = t.plan === "TRIAL" && t.isExpired;
                    const isPro = t.plan === "ACTIVE";
                    const isBlocked = t.plan === "BLOCKED";

                    return (
                      <tr key={t.id} className="hover:bg-slate-900/40 transition">
                        {/* 1. Nome da Oficina */}
                        <td className="py-4 pl-2">
                          <p className="font-bold text-white text-sm">{t.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {t.tradingName && t.tradingName !== t.name ? `${t.tradingName} • ` : ""}
                            ID: <span className="font-mono text-slate-500">{t.id.slice(0, 8)}</span>
                          </p>
                        </td>

                        {/* 2. Responsável & Contato */}
                        <td className="py-4">
                          <p className="font-semibold text-slate-200">{t.owner?.name || "Sem contato"}</p>
                          <p className="text-[11px] text-slate-400">{t.owner?.email || "-"}</p>
                          {t.phone && <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{t.phone}</p>}
                        </td>

                        {/* 3. Status do Acesso */}
                        <td className="py-4">
                          {isTrialActive && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              <span>Teste: Restam {t.remainingHours}h</span>
                            </span>
                          )}

                          {isTrialExpired && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <Lock className="w-3 h-3" />
                              <span>Teste Expirado</span>
                            </span>
                          )}

                          {isPro && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Cliente PRO (Ativo)</span>
                            </span>
                          )}

                          {isBlocked && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              <span>Acesso Bloqueado</span>
                            </span>
                          )}
                        </td>

                        {/* 4. Uso */}
                        <td className="py-4 text-center">
                          <p className="font-bold text-slate-200">
                            {t.stats.ordersCount} OS • {t.stats.vehiclesCount} Veículos
                          </p>
                          <p className="text-[10px] text-slate-500">{t.stats.usersCount} colaboradores</p>
                        </td>

                        {/* 5. Ações Comerciais */}
                        <td className="py-4 text-right pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Prorrogar Teste (+3 dias) */}
                            {t.plan === "TRIAL" && (
                              <button
                                onClick={() => handleTenantAction(t.id, "EXTEND_TRIAL", 3)}
                                disabled={actionLoadingId === t.id}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition cursor-pointer"
                                title="Conceder mais 3 dias de avaliação gratuita"
                              >
                                +3 Dias
                              </button>
                            )}

                            {/* Liberar PRO */}
                            {t.plan !== "ACTIVE" ? (
                              <button
                                onClick={() => handleTenantAction(t.id, "ACTIVATE_PRO")}
                                disabled={actionLoadingId === t.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                                title="Liberar plano permanente após pagamento"
                              >
                                Liberar PRO
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTenantAction(t.id, "BLOCK")}
                                disabled={actionLoadingId === t.id}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold transition cursor-pointer"
                                title="Bloquear acesso temporariamente"
                              >
                                Bloquear
                              </button>
                            )}

                            {/* Modo Suporte: Acessar a Oficina */}
                            <button
                              onClick={() => handleImpersonate(t.id)}
                              disabled={actionLoadingId === t.id}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Acessar o sistema como esta oficina para dar suporte técnico ao vivo"
                            >
                              <ExternalLink className="w-3 h-3 text-emerald-400" />
                              <span className="hidden sm:inline">Oficina</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Nenhuma oficina encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: CRIAR ACESSO TEMPORÁRIO PARA NOVO LEAD */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div>
              <h3 className="text-lg font-bold text-white">Gerar Acesso Temporário para Lead</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cria uma nova oficina com prazo de teste e monta o convite pronto para envio no WhatsApp.
              </p>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nome da Estética Automotiva *
                </label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Ex: Studio Detail Car"
                  className="w-full h-9 px-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nome do Proprietário / Contato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAdminName}
                    onChange={(e) => setFormAdminName(e.target.value)}
                    placeholder="Ex: Marcelo Silva"
                    className="w-full h-9 px-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    WhatsApp do Proprietário
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full h-9 px-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="marcelo@estetica.com"
                    className="w-full h-9 px-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Senha Provisória
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-mono bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Duração do Período de Teste Gratuito
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 15].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setFormDays(d)}
                      className={`h-9 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        formDays === d
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                      }`}
                    >
                      {d} Dias
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 h-10 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando oficina...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Criar Acesso & Mensagem</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AVISO E TEXTO PRONTO DO WHATSAPP APÓS GERAÇÃO */}
      {createdLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Acesso do Lead Gerado com Sucesso!</h3>
                <p className="text-xs text-slate-400">
                  {createdLead.companyName} • Período de {createdLead.trialDays} dias de teste
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300">
                Mensagem Formatada Pronta para o WhatsApp:
              </label>
              <textarea
                readOnly
                value={createdLead.whatsappMessage}
                rows={9}
                className="w-full p-3.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-sans leading-relaxed focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
              <button
                onClick={handleCopyMessage}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copiado para a Área de Transferência!" : "Copiar Mensagem"}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleOpenWhatsApp}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>

                <button
                  onClick={() => setCreatedLead(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RODAPÉ DO PAINEL MASTER */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-slate-600 pt-8">
        DetailPro SaaS Platform Engine • Console Restrito do Proprietário da Software House
      </div>
    </div>
  );
}

