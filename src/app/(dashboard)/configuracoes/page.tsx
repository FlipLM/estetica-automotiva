"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Save,
  Users,
  Car,
  Wrench,
  ClipboardList,
} from "lucide-react";
import {
  Button,
  StatCard,
  PageHeader,
  Alert,
  LoadingState,
  Input,
} from "@/components/ui";

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
    return <LoadingState message="Carregando dados da empresa..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Configurações da Empresa"
        description="Personalize os dados cadastrais exibidos em orçamentos, laudos de vistoria em PDF e comunicações com clientes."
      />

      {savedSuccess && (
        <Alert
          variant="success"
          title="Informações salvas com sucesso!"
          description="Os dados da sua estética foram atualizados em todo o sistema."
        />
      )}

      {/* Métricas do Tenant */}
      {tenant?._count && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <StatCard
            label="Equipe"
            value={`${tenant._count.users} usuários`}
            icon={<Users className="w-4 h-4" />}
            variant="brand"
          />
          <StatCard
            label="Clientes"
            value={`${tenant._count.customers} ativos`}
            icon={<Building2 className="w-4 h-4" />}
            variant="info"
          />
          <StatCard
            label="Veículos"
            value={`${tenant._count.vehicles} cadastrados`}
            icon={<Car className="w-4 h-4" />}
            variant="warning"
          />
          <StatCard
            label="Catálogo"
            value={`${tenant._count.services} serviços`}
            icon={<Wrench className="w-4 h-4" />}
            variant="success"
          />
          <StatCard
            label="Total de OS"
            value={`${tenant._count.serviceOrders} ordens`}
            icon={<ClipboardList className="w-4 h-4" />}
            variant="default"
          />
        </div>
      )}

      {/* Formulário de Configuração */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Razão Social / Nome Oficial da Empresa"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Input
              label="Nome Fantasia (Marca visível aos clientes)"
              value={form.tradingName}
              onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="CNPJ ou CPF"
              placeholder="00.000.000/0001-00"
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
            />

            <Input
              label="Telefone Comercial"
              placeholder="(11) 4002-8922"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <Input
              label="WhatsApp Oficial de Atendimento"
              placeholder="(11) 98765-4321"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-mail de Contato"
              type="email"
              placeholder="contato@detailpro.com.br"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Endereço Completo da Estética"
              placeholder="Av. dos Bandeirantes, 1500 - São Paulo, SP"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <Input
            label="URL da Logo da Empresa (Cabeçalho de PDF e Vistorias)"
            placeholder="https://exemplo.com/logo.png"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />

          <div className="flex justify-end pt-4 border-t border-[#E7EAE7]">
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
