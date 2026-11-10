"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  Users,
  Car,
  Wrench,
  ClipboardList,
} from "lucide-react";

interface TenantData {
  id: string;
  name: string;
  tradingName?: string;
  document?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  _count?: {
    users: number;
    customers: number;
    vehicles: number;
    services: number;
    serviceOrders: number;
  };
}

export default function ConfiguracoesPage() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    tradingName: "",
    document: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    logoUrl: "",
  });

  const fetchTenant = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setTenant(data.tenant);
        setForm({
          name: data.tenant.name || "",
          tradingName: data.tenant.tradingName || "",
          document: data.tenant.document || "",
          phone: data.tenant.phone || "",
          whatsapp: data.tenant.whatsapp || "",
          email: data.tenant.email || "",
          address: data.tenant.address || "",
          logoUrl: data.tenant.logoUrl || "",
        });
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
        await fetchTenant();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar configurações");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com o servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Carregando dados da empresa...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-cyan-400" />
          Configurações da Empresa & Tenant
        </h1>
        <p className="text-slate-400 text-sm">
          Personalize as informações cadastrais que aparecem nos orçamentos, vistorias em PDF e mensagens aos clientes.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Configurações salvas e atualizadas com sucesso!</span>
        </div>
      )}

      {/* Métricas do Tenant */}
      {tenant?._count && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Equipe
            </div>
            <div className="text-lg font-bold text-slate-100">
              {tenant._count.users} usuários
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              Clientes
            </div>
            <div className="text-lg font-bold text-slate-100">
              {tenant._count.customers} ativos
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              Veículos
            </div>
            <div className="text-lg font-bold text-slate-100">
              {tenant._count.vehicles} frotas
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              Catálogo
            </div>
            <div className="text-lg font-bold text-slate-100">
              {tenant._count.services} serviços
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
              Total de OS
            </div>
            <div className="text-lg font-bold text-slate-100">
              {tenant._count.serviceOrders} ordens
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Configuração */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Razão Social / Nome Oficial da Empresa *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome Fantasia (Marca visível aos clientes)
              </label>
              <input
                type="text"
                value={form.tradingName}
                onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                CNPJ ou CPF
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telefone Comercial
              </label>
              <input
                type="text"
                placeholder="(11) 4002-8922"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                WhatsApp Oficial de Atendimento
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                E-mail de Contato
              </label>
              <input
                type="email"
                placeholder="contato@detailpro.com.br"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Endereço Completo da Estética
              </label>
              <input
                type="text"
                placeholder="Av. dos Bandeirantes, 1500 - São Paulo, SP"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              URL da Logo da Empresa (Cabeçalho de PDF e Vistorias)
            </label>
            <input
              type="text"
              placeholder="https://exemplo.com/logo.png"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

