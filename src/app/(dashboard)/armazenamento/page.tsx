"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Users,
  HardDrive,
  BookOpen,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Save,
  RefreshCw,
  HelpCircle,
  Lock,
  Smartphone,
  FolderGit2,
  Send,
  Database,
  Info,
} from "lucide-react";
import { Button, Input, Card, Alert } from "@/components/ui";

type StorageProviderType =
  | "GOOGLE_DRIVE"
  | "TELEGRAM"
  | "ONEDRIVE"
  | "DROPBOX"
  | "CLOUDFLARE_R2";

interface ProviderMeta {
  id: StorageProviderType;
  name: string;
  tagline: string;
  freeTier: string;
  estimatedPhotos: string;
  estimatedCars: string;
  difficulty: "Muito Fácil (3 min)" | "Fácil (5 min)" | "Avançado (TI)";
  badge?: string;
  color: string;
  tutorialSteps: Array<{
    title: string;
    description: string;
    linkLabel?: string;
    linkUrl?: string;
  }>;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "GOOGLE_DRIVE",
    name: "Google Drive da Empresa",
    tagline: "Usa os 15 GB gratuitos da conta Gmail da sua estética",
    freeTier: "15 GB Grátis",
    estimatedPhotos: "~75.000 fotos",
    estimatedCars: "~9.300 carros vistoriados",
    difficulty: "Fácil (5 min)",
    badge: "Mais Popular",
    color: "#247653",
    tutorialSteps: [
      {
        title: "1. Crie uma pasta no Google Drive da Estética",
        description:
          "Acesse o Google Drive da conta oficial da empresa, crie uma pasta chamada 'Vulpto - Vistorias' e abra ela. Na barra de endereço do navegador, copie o código final da URL (depois de /folders/). Esse é o ID da Pasta.",
        linkLabel: "Abrir Google Drive",
        linkUrl: "https://drive.google.com",
      },
      {
        title: "2. Gere o Token de Acesso Permanente (Refresh Token)",
        description:
          "Acesse o Google OAuth Playground, marque a permissão 'https://www.googleapis.com/auth/drive.file', clique em 'Authorize APIs' com a conta Google da estética e depois em 'Exchange authorization code for tokens'.",
        linkLabel: "Abrir Google OAuth Playground",
        linkUrl: "https://developers.google.com/oauthplayground/",
      },
      {
        title: "3. Cole o Token abaixo e clique em Testar Conexão",
        description:
          "Cole o Refresh Token (ou Access Token) abaixo. Pronto! Todos os seus funcionários passarão a salvar as fotos automaticamente dentro dessa pasta do Google Drive da empresa.",
      },
    ],
  },
  {
    id: "TELEGRAM",
    name: "Telegram Cloud (Grupo Privado)",
    tagline: "Armazenamento 100% ilimitado + notificações de vistoria no celular",
    freeTier: "Ilimitado (Grátis)",
    estimatedPhotos: "Ilimitadas",
    estimatedCars: "Sem limite de carros",
    difficulty: "Muito Fácil (3 min)",
    badge: "Espaço Infinito",
    color: "#0284C7",
    tutorialSteps: [
      {
        title: "1. Crie o Bot da sua Estética no @BotFather",
        description:
          "No Telegram, abra a conversa oficial @BotFather, envie o comando /newbot, escolha o nome da sua estética e copie o 'HTTP API Token' gerado (ex: 7123456:AAH...).",
        linkLabel: "Abrir @BotFather no Telegram",
        linkUrl: "https://t.me/BotFather",
      },
      {
        title: "2. Crie um Grupo ou Canal Privado 'Vistorias da Estética'",
        description:
          "Crie um grupo ou canal privado no seu Telegram (só você precisa estar nele) e adicione o seu Bot como Administrador do grupo.",
      },
      {
        title: "3. Descubra o Chat ID do Grupo e cole abaixo",
        description:
          "Adicione o @RawDataBot (ou envie uma mensagem no grupo e consulte /getUpdates) para copiar o Chat ID do grupo (começa com sinal de menos, ex: -100192837465). Cole o Bot Token e o Chat ID abaixo!",
      },
    ],
  },
  {
    id: "ONEDRIVE",
    name: "Microsoft OneDrive",
    tagline: "Ideal para quem usa Windows ou possui pacote Office 365 (1 TB)",
    freeTier: "5 GB Grátis (ou 1 TB no Office 365)",
    estimatedPhotos: "~25.000 a 5.000.000 fotos",
    estimatedCars: "~3.100 a 625.000 carros",
    difficulty: "Fácil (5 min)",
    color: "#2563EB",
    tutorialSteps: [
      {
        title: "1. Acesse o Graph Explorer ou Azure App da sua conta Microsoft",
        description:
          "Entre com a conta Hotmail, Outlook ou Microsoft 365 da estética no Microsoft Graph Explorer e autorize a permissão 'Files.ReadWrite'.",
        linkLabel: "Abrir Microsoft Graph Explorer",
        linkUrl: "https://developer.microsoft.com/en-us/graph/graph-explorer",
      },
      {
        title: "2. Copie o Token de Acesso e escolha o nome da pasta",
        description:
          "Na aba 'Access token' do Graph Explorer (ou do seu App Azure), copie o token gerado e informe abaixo o nome da pasta (ex: Vulpto-Vistorias).",
      },
      {
        title: "3. Salve e valide a conexão",
        description:
          "Ao clicar em Testar Conexão, o Vulpto validará sua conta Microsoft e todas as vistorias dos seus colaboradores serão arquivadas no seu OneDrive.",
      },
    ],
  },
  {
    id: "DROPBOX",
    name: "Dropbox Empresarial / Pessoal",
    tagline: "Sincronização direta em pasta dedicada no computador da oficina",
    freeTier: "2 GB Grátis (ou 2 TB no Plus)",
    estimatedPhotos: "~10.000 fotos",
    estimatedCars: "~1.250 carros vistoriados",
    difficulty: "Muito Fácil (3 min)",
    color: "#4F46E5",
    tutorialSteps: [
      {
        title: "1. Crie um App no Dropbox Developers",
        description:
          "Acesse a Console de Apps do Dropbox, clique em 'Create App', escolha 'Scoped access' -> 'App folder' e dê o nome 'Vulpto-Oficina'.",
        linkLabel: "Abrir Console do Dropbox",
        linkUrl: "https://www.dropbox.com/developers/apps",
      },
      {
        title: "2. Marque as permissões de escrita",
        description:
          "Na aba 'Permissions' do seu App no Dropbox, marque 'files.content.write' e 'files.content.read' e clique em Submit.",
      },
      {
        title: "3. Gere o Access Token na aba Settings",
        description:
          "Volte na aba 'Settings', clique em 'Generate access token' em OAuth 2, copie o código gerado e cole no campo abaixo.",
      },
    ],
  },
  {
    id: "CLOUDFLARE_R2",
    name: "Cloudflare R2 / Amazon S3",
    tagline: "Object Storage de alta escala com 10 GB/mês grátis e banda zero",
    freeTier: "10 GB Grátis / mês",
    estimatedPhotos: "~50.000 fotos",
    estimatedCars: "~6.200 carros vistoriados",
    difficulty: "Avançado (TI)",
    color: "#D97706",
    tutorialSteps: [
      {
        title: "1. Crie um Bucket R2 no painel da Cloudflare",
        description:
          "No menu R2 Object Storage da sua conta Cloudflare, clique em 'Create bucket' e dê o nome (ex: vistorias-estetica).",
        linkLabel: "Abrir Painel Cloudflare R2",
        linkUrl: "https://dash.cloudflare.com/",
      },
      {
        title: "2. Gere um Token de API R2 com permissão de Leitura e Escrita",
        description:
          "Clique em 'Manage R2 API Tokens' -> 'Create API Token' -> permissão 'Object Read & Write'. Copie o Account ID, Access Key ID e Secret Access Key.",
      },
      {
        title: "3. Preencha os dados abaixo e ative",
        description:
          "Cole os dados do bucket abaixo. Opcionalmente, informe o domínio público do bucket para links diretos de alta velocidade.",
      },
    ],
  },
];

export default function CloudStorageAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tenantName, setTenantName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [employeesCount, setEmployeesCount] = useState(1);
  const [storageConnected, setStorageConnected] = useState(false);
  const [localUsage, setLocalUsage] = useState<{
    percentUsed: number;
    isLimitReached: boolean;
  } | null>(null);

  const [selectedProvider, setSelectedProvider] =
    useState<StorageProviderType>("GOOGLE_DRIVE");
  const [storageFolderId, setStorageFolderId] = useState("");

  // Campos de credenciais
  const [creds, setCreds] = useState({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    accessToken: "",
    accountEmail: "",
    telegramBotToken: "",
    telegramChatId: "",
    r2AccountId: "",
    r2AccessKeyId: "",
    r2SecretAccessKey: "",
    r2BucketName: "",
    r2PublicUrl: "",
  });

  // Campos do chamado de suporte direto com o especialista
  const [supportTopic, setSupportTopic] = useState(
    "Quero ajuda passo a passo para conectar o Google Drive / Nuvem da minha estética"
  );
  const [supportNotes, setSupportNotes] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/storage/config");
        if (res.status === 403) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          throw new Error("Não foi possível carregar as configurações de nuvem.");
        }
        const data = await res.json();
        const cfg = data.config;
        setTenantName(cfg.tenantName || "Minha Estética");
        setAdminName(cfg.adminName || "Administrador");
        setAdminEmail(cfg.adminEmail || "");
        setEmployeesCount(cfg.employeesCount || 1);
        setSelectedProvider(cfg.storageProvider || "GOOGLE_DRIVE");
        setStorageFolderId(cfg.storageFolderId || "");
        setStorageConnected(!!cfg.storageConnected);
        if (cfg.localStorageUsage) {
          setLocalUsage(cfg.localStorageUsage);
        }
        if (cfg.credentials) {
          setCreds((prev) => ({ ...prev, ...cfg.credentials }));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const activeProviderMeta =
    PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/storage/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageProvider: selectedProvider,
          storageFolderId,
          credentials: creds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar configuração.");
      }
      setSuccess(
        data.message ||
          "Credenciais salvas com criptografia AES-256-GCM! Clique agora em 'Testar e Ativar Conexão'."
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      // Primeiro garante que o estado atual da tela está salvo
      await fetch("/api/storage/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageProvider: selectedProvider,
          storageFolderId,
          credentials: creds,
        }),
      });

      const res = await fetch("/api/storage/config", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setStorageConnected(false);
        throw new Error(data.error || "Falha no teste de conexão.");
      }
      setStorageConnected(true);
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  }

  function handleOpenSupportTicket() {
    const supportWhatsapp =
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5511988887777";
    const cleanPhone = supportWhatsapp.replace(/\D/g, "");
    const message = [
      `Olá! Preciso de suporte técnico no *Vulpto* para configurar o Armazenamento em Nuvem da minha estética.`,
      ``,
      `🏢 *Estética:* ${tenantName}`,
      `👤 *Administrador:* ${adminName} (${adminEmail})`,
      `☁️ *Ferramenta escolhida:* ${activeProviderMeta.name}`,
      `📌 *Solicitação:* ${supportTopic}`,
      supportNotes.trim() ? `📝 *Detalhes:* ${supportNotes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-[#737D75]">
        Carregando central de armazenamento em nuvem da estética...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Alert variant="error">
          <strong>Acesso Restrito ao Proprietário / Administrador:</strong> Apenas o
          administrador da estética pode configurar a conta de armazenamento em nuvem
          da empresa.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7EAE7] shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#142D26] flex items-center justify-center text-[#A7F3D0] shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-[#142D26]">
                Armazenamento em Nuvem da Estética
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9F3EC] text-[#142D26]">
                <Lock className="w-3 h-3" /> Exclusivo Administrador
              </span>
              {storageConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Nuvem Conectada e Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" /> Aguardando Ativação
                </span>
              )}
            </div>
            <p className="text-sm text-[#737D75] mt-1">
              Conecte uma única conta da sua empresa (Google Drive, Telegram, OneDrive,
              Dropbox ou R2). Todas as fotos tiradas pelos seus{" "}
              <strong>{employeesCount} colaborador(es)</strong> serão salvas
              automaticamente lá.
            </p>
          </div>
        </div>

        <a
          href="#suporte-chamado"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E9F3EC] hover:bg-[#d5eadb] text-[#142D26] font-semibold text-sm transition-colors shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-[#247653]" />
          Solicitar Ajuda na Configuração
        </a>
      </div>

      {/* Banner de Cota de Armazenamento Local Temporário */}
      {!storageConnected && localUsage && (
        <div
          className={`p-4 rounded-2xl border shadow-xs transition-all ${
            localUsage.isLimitReached
              ? "bg-rose-50 border-rose-200"
              : localUsage.percentUsed >= 80
              ? "bg-amber-50 border-amber-200"
              : "bg-[#F4FBF7] border-[#D1E7DD]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <HardDrive
                  className={`w-5 h-5 shrink-0 ${
                    localUsage.isLimitReached
                      ? "text-rose-600"
                      : localUsage.percentUsed >= 80
                      ? "text-amber-600"
                      : "text-[#247653]"
                  }`}
                />
                <h3 className="text-sm font-bold text-[#142D26]">
                  Armazenamento Local Temporário: {localUsage.percentUsed}% utilizado
                </h3>
                {localUsage.isLimitReached && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                    Limite Esgotado
                  </span>
                )}
              </div>
              <p className="text-xs text-[#526056] leading-relaxed">
                {localUsage.isLimitReached
                  ? "O limite do armazenamento temporário no servidor foi atingido (100% utilizado). Novos uploads de fotos de vistoria e logos estão bloqueados até a conexão de um serviço de nuvem próprio abaixo."
                  : `Suas fotos e imagens estão sendo guardadas temporariamente no servidor local (${localUsage.percentUsed}% do limite utilizado). Para ter armazenamento definitivo e ilimitado para toda a equipe, conecte uma das opções de nuvem abaixo.`}
              </p>
            </div>

            <div className="w-full md:w-56 shrink-0 bg-white p-3 rounded-xl border border-[#E7EAE7]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#142D26] mb-1.5">
                <span>Limite Utilizado</span>
                <span
                  className={
                    localUsage.isLimitReached
                      ? "text-rose-600 font-bold"
                      : localUsage.percentUsed >= 80
                      ? "text-amber-600 font-bold"
                      : "text-[#247653] font-bold"
                  }
                >
                  {localUsage.percentUsed}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#E7EAE7] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    localUsage.isLimitReached
                      ? "bg-rose-600"
                      : localUsage.percentUsed >= 80
                      ? "bg-amber-500"
                      : "bg-[#247653]"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(localUsage.percentUsed, 5))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explicação de Como Funciona em Equipe + Economia de MB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="border border-[#E7EAE7]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#E9F3EC] text-[#247653]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#142D26]">
                1 Conta da Empresa para Toda a Equipe
              </h3>
              <p className="text-xs text-[#737D75] mt-1 leading-relaxed">
                Seus funcionários entram com os logins individuais deles no celular, mas{" "}
                <strong>100% das vistorias caem na mesma nuvem central</strong> da
                estética, sem que você precise passar a senha do seu Drive para eles.
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-[#E7EAE7]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#E9F3EC] text-[#247653]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#142D26]">
                Apenas ~0,20 MB (200 KB) por Foto
              </h3>
              <p className="text-xs text-[#737D75] mt-1 leading-relaxed">
                O Vulpto comprime automaticamente as fotos da câmera (de 5 MB para{" "}
                <strong>~200 KB em WebP HD 1600px</strong>). Uma vistoria com 8 fotos
                consome só <strong>1,6 MB</strong> (cabem +9.300 carros em 15 GB grátis).
              </p>
            </div>
          </div>
        </Card>

        <Card padding="md" className="border border-[#E7EAE7]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#E9F3EC] text-[#247653]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#142D26]">
                Credenciais Criptografadas (AES-256)
              </h3>
              <p className="text-xs text-[#737D75] mt-1 leading-relaxed">
                Seus tokens são protegidos com criptografia militar{" "}
                <strong>AES-256-GCM</strong> no servidor e todas as fotos continuam
                aparecendo normalmente no modelo 3D e nos Laudos PDF.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Passo 1: Escolha do Provedor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#142D26]">
            1. Escolha onde deseja armazenar as fotos da sua estética
          </h2>
          <span className="text-xs text-[#737D75]">
            Clique em uma opção para ver o tutorial passo a passo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PROVIDERS.map((prov) => {
            const isSelected = selectedProvider === prov.id;
            return (
              <button
                key={prov.id}
                type="button"
                onClick={() => {
                  setSelectedProvider(prov.id);
                  setError(null);
                  setSuccess(null);
                }}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-2 border-[#247653] bg-[#F2F9F5] shadow-sm"
                    : "border-[#E7EAE7] bg-white hover:border-[#9CA49E]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#142D26] text-white">
                      {prov.freeTier}
                    </span>
                    {prov.badge && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {prov.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#142D26]">{prov.name}</h3>
                  <p className="text-xs text-[#737D75] mt-1 leading-snug">
                    {prov.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E7EAE7] text-[11px] text-[#5A645C] space-y-0.5">
                  <div>
                    📸 Capacidade: <strong>{prov.estimatedPhotos}</strong>
                  </div>
                  <div>
                    🚗 Equivale a: <strong>{prov.estimatedCars}</strong>
                  </div>
                  <div>
                    ⏱️ Configuração: <strong>{prov.difficulty}</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Passo 2: Tutorial Passo a Passo + Formulário de Configuração */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Tutorial Guiado */}
        <Card padding="lg" className="lg:col-span-5 border border-[#E7EAE7] space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E7EAE7] pb-3">
            <BookOpen className="w-5 h-5 text-[#247653]" />
            <div>
              <h2 className="text-base font-bold text-[#142D26]">
                Tutorial Passo a Passo: {activeProviderMeta.name}
              </h2>
              <p className="text-xs text-[#737D75]">
                Siga estes 3 passos simples para conectar a conta da empresa
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {activeProviderMeta.tutorialSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-2"
              >
                <h3 className="text-sm font-bold text-[#142D26]">{step.title}</h3>
                <p className="text-xs text-[#5A645C] leading-relaxed">
                  {step.description}
                </p>
                {step.linkUrl && (
                  <a
                    href={step.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#247653] hover:text-[#142D26] underline underline-offset-4"
                  >
                    {step.linkLabel || "Abrir página oficial"}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Dica de Organização:</strong> Todas as fotos enviadas pelos seus
              operadores na Vistoria 360º já chegam nomeadas com data/hora e código
              único, prontas para consulta ou auditoria a qualquer momento.
            </div>
          </div>
        </Card>

        {/* Coluna Direita: Formulário de Credenciais do Provedor Selecionado */}
        <Card padding="lg" className="lg:col-span-7 border border-[#E7EAE7]">
          <div className="flex items-center justify-between border-b border-[#E7EAE7] pb-3 mb-5">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-5 h-5 text-[#247653]" />
              <div>
                <h2 className="text-base font-bold text-[#142D26]">
                  2. Credenciais de Conexão ({activeProviderMeta.name})
                </h2>
                <p className="text-xs text-[#737D75]">
                  Preencha abaixo e clique em &ldquo;Testar e Ativar Conexão&rdquo;
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            {selectedProvider === "GOOGLE_DRIVE" && (
              <>
                <Input
                  label="E-mail da Conta Google da Estética (Informativo)"
                  placeholder="contato@suaestetica.com.br"
                  value={creds.accountEmail}
                  onChange={(e) =>
                    setCreds({ ...creds, accountEmail: e.target.value })
                  }
                />
                <Input
                  label="ID da Pasta no Google Drive (Opcional — deixe em branco para salvar na raiz)"
                  placeholder="Ex: 1A2b3C4d5E6f7G8h9I0j..."
                  value={storageFolderId}
                  onChange={(e) => setStorageFolderId(e.target.value)}
                />
                <Input
                  label="Refresh Token ou Access Token do Google Drive *"
                  placeholder="Cole aqui o token gerado no Google OAuth Playground"
                  value={creds.refreshToken || creds.accessToken}
                  onChange={(e) =>
                    setCreds({
                      ...creds,
                      refreshToken: e.target.value,
                      accessToken: e.target.value,
                    })
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Input
                    label="Client ID Próprio (Opcional)"
                    placeholder="Usa o padrão se ficar em branco"
                    value={creds.clientId}
                    onChange={(e) =>
                      setCreds({ ...creds, clientId: e.target.value })
                    }
                  />
                  <Input
                    label="Client Secret Próprio (Opcional)"
                    type="password"
                    placeholder="Usa o padrão se ficar em branco"
                    value={creds.clientSecret}
                    onChange={(e) =>
                      setCreds({ ...creds, clientSecret: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {selectedProvider === "TELEGRAM" && (
              <>
                <Input
                  label="Bot Token (Gerado no @BotFather) *"
                  placeholder="Ex: 7123456789:AAHxyz..."
                  value={creds.telegramBotToken}
                  onChange={(e) =>
                    setCreds({ ...creds, telegramBotToken: e.target.value })
                  }
                />
                <Input
                  label="Chat ID do Grupo/Canal Privado da Estética *"
                  placeholder="Ex: -1001987654321"
                  value={creds.telegramChatId}
                  onChange={(e) => {
                    setCreds({ ...creds, telegramChatId: e.target.value });
                    setStorageFolderId(e.target.value);
                  }}
                />
              </>
            )}

            {selectedProvider === "ONEDRIVE" && (
              <>
                <Input
                  label="Nome da Pasta no OneDrive da Estética"
                  placeholder="Ex: Vulpto-Vistorias"
                  value={storageFolderId}
                  onChange={(e) => setStorageFolderId(e.target.value)}
                />
                <Input
                  label="Access Token / Refresh Token do Microsoft OneDrive *"
                  placeholder="Cole aqui o token gerado no Microsoft Graph"
                  value={creds.accessToken}
                  onChange={(e) =>
                    setCreds({ ...creds, accessToken: e.target.value })
                  }
                />
              </>
            )}

            {selectedProvider === "DROPBOX" && (
              <>
                <Input
                  label="Nome da Pasta no Dropbox"
                  placeholder="Ex: Vulpto-Vistorias"
                  value={storageFolderId}
                  onChange={(e) => setStorageFolderId(e.target.value)}
                />
                <Input
                  label="Access Token do App Dropbox *"
                  placeholder="Ex: sl.Bxyz..."
                  value={creds.accessToken}
                  onChange={(e) =>
                    setCreds({ ...creds, accessToken: e.target.value })
                  }
                />
              </>
            )}

            {selectedProvider === "CLOUDFLARE_R2" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Cloudflare Account ID *"
                    placeholder="Ex: 8f9a2b3c4d5e..."
                    value={creds.r2AccountId}
                    onChange={(e) =>
                      setCreds({ ...creds, r2AccountId: e.target.value })
                    }
                  />
                  <Input
                    label="Nome do Bucket R2 *"
                    placeholder="Ex: vistorias-estetica"
                    value={creds.r2BucketName}
                    onChange={(e) =>
                      setCreds({ ...creds, r2BucketName: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Access Key ID *"
                    placeholder="Chave de acesso R2"
                    value={creds.r2AccessKeyId}
                    onChange={(e) =>
                      setCreds({ ...creds, r2AccessKeyId: e.target.value })
                    }
                  />
                  <Input
                    label="Secret Access Key *"
                    type="password"
                    placeholder="Segredo da chave R2"
                    value={creds.r2SecretAccessKey}
                    onChange={(e) =>
                      setCreds({ ...creds, r2SecretAccessKey: e.target.value })
                    }
                  />
                </div>
                <Input
                  label="URL Pública do Bucket (Opcional)"
                  placeholder="Ex: https://fotos.suaestetica.com.br"
                  value={creds.r2PublicUrl}
                  onChange={(e) =>
                    setCreds({ ...creds, r2PublicUrl: e.target.value })
                  }
                />
              </>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-[#E7EAE7]">
              <Button
                type="submit"
                variant="secondary"
                loading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Salvar Credenciais
              </Button>

              <Button
                type="button"
                variant="primary"
                loading={testing}
                onClick={handleTestConnection}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Testar e Ativar Conexão
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Passo 3: Central de Chamado / Suporte Direto com o Especialista */}
      <div
        id="suporte-chamado"
        className="rounded-2xl bg-gradient-to-r from-[#142D26] to-[#1E463A] text-white p-6 shadow-md"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#A7F3D0] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Suporte de Implantação Assistida
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              Prefere que a nossa equipe configure isso para você?
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Se tiver qualquer dúvida ao criar o token no Google Drive, Telegram,
              OneDrive ou Dropbox, abra um chamado abaixo. Nós entramos em contato com
              você pelo WhatsApp e fazemos a configuração passo a passo junto com a sua
              estética!
            </p>
          </div>

          <div className="lg:col-span-5 bg-white text-[#252B27] p-4 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-[#142D26] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#247653]" />
              Abrir Chamado de Suporte Técnico
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#5A645C] mb-1">
                Em qual etapa você precisa de ajuda?
              </label>
              <select
                value={supportTopic}
                onChange={(e) => setSupportTopic(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#D4DAD5] text-xs bg-white text-[#252B27]"
              >
                <option value="Quero ajuda passo a passo para conectar a nuvem da minha estética">
                  Quero ajuda passo a passo para configurar do zero
                </option>
                <option value="Gerar o Token no Google Drive / OneDrive / Dropbox">
                  Dúvida ao gerar o Token no Google Drive / OneDrive / Dropbox
                </option>
                <option value="Configurar o Bot e Grupo Privado no Telegram">
                  Quero configurar o grupo ilimitado no Telegram
                </option>
                <option value="Erro ao clicar em Testar e Ativar Conexão">
                  Deu erro ao clicar em &ldquo;Testar e Ativar Conexão&rdquo;
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A645C] mb-1">
                Observação opcional (ex: melhor horário ou dúvida)
              </label>
              <input
                type="text"
                value={supportNotes}
                onChange={(e) => setSupportNotes(e.target.value)}
                placeholder="Ex: Pode me chamar agora à tarde para configurarmos juntos?"
                className="w-full h-9 px-3 rounded-lg border border-[#D4DAD5] text-xs bg-white text-[#252B27]"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenSupportTicket}
              className="w-full h-10 rounded-xl bg-[#247653] hover:bg-[#1d6043] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Chamar Suporte para Configurar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

