"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Save,
  Users,
  Car,
  Wrench,
  ClipboardList,
  Upload,
  Trash2,
  Loader2,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  StatCard,
  PageHeader,
  Alert,
  LoadingState,
  Input,
} from "@/components/ui";
import { compressLogoImage } from "@/lib/image-compressor";

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
  storageConnected?: boolean;
  localStorageUsage?: {
    percentUsed: number;
    isLimitReached: boolean;
    storageConnected?: boolean;
  } | null;
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
  const [saveError, setSaveError] = useState<string | null>(null);

  // Upload da Logo & Cota
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localUsage, setLocalUsage] = useState<{
    percentUsed: number;
    isLimitReached: boolean;
    storageConnected?: boolean;
  } | null>(null);

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
        if (data.tenant?.localStorageUsage) {
          setLocalUsage(data.tenant.localStorageUsage);
        }
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoUploadError(null);

    try {
      // Comprime a logomarca no navegador (512x512 WebP, ~20KB a 40KB)
      // Evita sobrecarregar a cota de armazenamento com arquivos pesados de câmeras
      const compressedFile = await compressLogoImage(file);

      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.redirectTo) {
          setLogoUploadError(
            data.error || "Limite de armazenamento temporário atingido (100% utilizado)."
          );
          if (data.percentUsed !== undefined) {
            setLocalUsage({
              percentUsed: data.percentUsed,
              isLimitReached: true,
              storageConnected: false,
            });
          }
        } else {
          setLogoUploadError(data.error || "Erro ao enviar imagem da logo.");
        }
        return;
      }

      setForm((prev) => ({ ...prev, logoUrl: data.url }));
      if (data.percentUsed !== undefined) {
        setLocalUsage({
          percentUsed: data.percentUsed,
          isLimitReached: !!data.isLimitReached,
          storageConnected: false,
        });
      }
    } catch (err) {
      console.error("Erro no upload da logo:", err);
      setLogoUploadError("Falha na comunicação com o servidor.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
        await fetchTenant();
      } else {
        setSaveError(data.error || "Erro ao atualizar configurações da empresa.");
      }
    } catch (err) {
      console.error(err);
      setSaveError("Falha de conexão com o servidor.");
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

      {saveError && (
        <Alert
          variant="error"
          title="Não foi possível salvar as alterações"
          description={saveError}
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
              placeholder="contato@vulpto.com.br"
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

          {/* Upload de Logo da Empresa */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-semibold text-[#142D26]">
              Logo da Empresa (Menu Lateral, Vistorias e Laudos PDF)
            </label>

            {/* Aviso de Armazenamento Local Temporário e link para nuvem */}
            {localUsage && !localUsage.storageConnected && (
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                  localUsage.isLimitReached
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : localUsage.percentUsed >= 80
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-[#F4FBF7] border-[#D1E7DD] text-[#142D26]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 shrink-0 text-[#247653]" />
                  <span>
                    <strong>Armazenamento Local Temporário:</strong> {localUsage.percentUsed}% utilizado
                  </span>
                </div>
                <Link
                  href="/armazenamento"
                  className="inline-flex items-center gap-1 font-bold text-[#247653] hover:underline shrink-0"
                >
                  Conectar Armazenamento em Nuvem Próprio <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {logoUploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>{logoUploadError}</span>
                <Link
                  href="/armazenamento"
                  className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold text-xs hover:bg-rose-800 transition shrink-0 inline-flex items-center gap-1"
                >
                  Conectar Nuvem Própria <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-[#E7EAE7] bg-[#F9FAF9]">
              {/* Preview da Logo */}
              <div className="w-20 h-20 rounded-xl border border-[#E7EAE7] bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo da Empresa"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#A4ADA6] p-2 text-center">
                    <Building2 className="w-7 h-7" />
                    <span className="text-[10px] mt-0.5">Sem logo</span>
                  </div>
                )}
              </div>

              {/* Controles de Upload */}
              <div className="space-y-2 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3.5 py-2 rounded-xl bg-[#247653] hover:bg-[#1E6346] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando foto...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Selecionar Imagem</span>
                      </>
                    )}
                  </button>

                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logoUrl: "" }))}
                      disabled={uploadingLogo}
                      className="px-3.5 py-2 rounded-xl border border-[#D0D5DD] hover:bg-[#EAEAEA] text-[#344054] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#737D75]">
                  <strong>Dimensão recomendada:</strong> 512×512 px (proporção quadrada 1:1, mín. 256×256 px). Formatos: PNG, JPG ou WebP.
                </p>
              </div>
            </div>
          </div>

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
