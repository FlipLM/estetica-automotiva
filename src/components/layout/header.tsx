"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Search,
  Layers,
  ChevronRight,
  Plus,
  Car,
  User,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  MessageCircle,
} from "lucide-react";

interface HeaderProps {
  userName: string;
  userRole: "ADMIN" | "OPERATOR";
  tenantName: string;
  plan?: string;
  trialExpiresAt?: string | null;
}

interface BoxTelemetry {
  id: string;
  name: string;
  capacity: number;
  occupiedCount: number;
  availableSlots: number;
  isFull: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard Executivo",
  "/agenda": "Agenda de Serviços",
  "/patio": "Kanban do Pátio",
  "/boxes": "Boxes e Vagas",
  "/vistoria": "Recepção e Vistoria 360º",
  "/orcamentos": "Orçamentos",
  "/os": "Ordens de Serviço",
  "/os/nova": "Nova Ordem de Serviço",
  "/clientes": "Clientes e Veículos",
  "/servicos": "Catálogo de Serviços",
  "/financeiro": "Financeiro e DRE",
  "/comissoes": "Comissões da Equipe",
  "/estoque": "Controle de Estoque",
  "/crm": "CRM e Retenção",
  "/funcionarios": "Equipe e Colaboradores",
  "/configuracoes": "Configurações da Empresa",
  "/admin": "Gestão SaaS & Leads (Master Admin)",
  "/onboarding": "Configuração Inicial da Oficina",
  "/temas": "Identidades Visuais",
};

export function Header({ userName, userRole, tenantName, plan, trialExpiresAt }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [boxes, setBoxes] = useState<BoxTelemetry[]>([]);
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  // Calcula horas / dias restantes do período de teste
  const isTrial = plan === "TRIAL";
  let trialRemainingText = "";
  if (isTrial && trialExpiresAt) {
    const diffMs = new Date(trialExpiresAt).getTime() - Date.now();
    const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const diffDays = Math.ceil(diffHours / 24);
    trialRemainingText = diffHours > 24 ? `${diffDays} dias restantes` : `${diffHours}h restantes`;
  }

  const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5511988887777";
  const cleanPhone = supportWhatsapp.replace(/\D/g, "");
  const whatsappTrialText = encodeURIComponent(
    `Olá! Estou testando o DetailPro para a empresa *${tenantName}* e gostaria de informações sobre planos definitivos ou contratação de um sistema sob medida!`
  );

  useEffect(() => {
    async function loadBoxes() {
      try {
        const res = await fetch("/api/boxes");
        if (res.ok) {
          const json = await res.json();
          setBoxes(json.boxes || []);
        }
      } catch {
        // Silencioso
      }
    }
    loadBoxes();
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchPlate.trim()) return;
    router.push(`/os?q=${encodeURIComponent(searchPlate.trim())}`);
  }

  const currentTitle =
    ROUTE_LABELS[pathname] ||
    (pathname.startsWith("/vistoria/")
      ? "Laudo de Vistoria"
      : pathname.startsWith("/orcamentos/")
      ? "Detalhes do Orçamento"
      : pathname.startsWith("/os/")
      ? "Detalhes da Ordem de Serviço"
      : "Painel Operacional");

  const totalSlots = boxes.reduce((acc, b) => acc + (b.capacity || 1), 0);
  const occupiedSlots = boxes.reduce((acc, b) => acc + (b.occupiedCount || 0), 0);

  return (
    <header className="h-16 bg-white border-b border-[#E7EAE7] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 print:hidden">
      {/* 1. Esquerda: Breadcrumb e Contexto */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] text-[#737D75] truncate">
          <Link
            href={userRole === "ADMIN" ? "/dashboard" : "/patio"}
            className="hover:text-[#247653] transition-colors hidden sm:inline font-medium"
          >
            {tenantName || "DetailPro"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA49E] hidden sm:inline shrink-0" />
          <span className="font-semibold text-[#252B27] truncate">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* 2. Centro: Busca Rápida Global */}
      <div className="hidden md:flex items-center max-w-sm w-full">
        <form onSubmit={handleSearch} className="w-full relative">
          <Search className="w-4 h-4 text-[#737D75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
            placeholder="Buscar placa, cliente ou nº da OS..."
            className="w-full h-9 pl-9 pr-3 text-[13px] bg-[#F7F8F6] border border-[#E7EAE7] rounded-[8px] text-[#252B27] placeholder:text-[#9CA49E] focus:outline-none focus:bg-white focus:border-[#247653] focus:ring-2 focus:ring-[#247653]/12 transition-all"
          />
        </form>
      </div>

      {/* 3. Direita: Status do Pátio, Atalho e Perfil */}
      <div className="flex items-center gap-3 shrink-0">
        {boxes.length > 0 && (
          <Link
            href="/patio"
            title="Ver ocupação dos boxes no pátio"
            className="hidden xl:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] text-[12px] text-[#252B27] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#247653]" />
            <span className="text-[#737D75]">Pátio:</span>
            <span className="font-semibold text-[#142D26]">
              {occupiedSlots}/{totalSlots} vagas
            </span>
          </Link>
        )}

        {isTrial && (
          <button
            type="button"
            onClick={() => setTrialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Seu período de teste no DetailPro. Clique para ver detalhes e opções de liberação."
          >
            <Clock className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
            <span>Teste: {trialRemainingText || "3 dias"}</span>
            <span className="hidden md:inline px-1.5 py-0.2 rounded-md bg-[#D97706] text-white text-[10px] font-semibold ml-0.5">
              Assinar
            </span>
          </button>
        )}

        <Link
          href="/vistoria"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#E9F3EC] hover:bg-[#D2E7D9] text-[#142D26] font-medium text-[13px] transition-colors"
        >
          <Car className="w-3.5 h-3.5 text-[#247653]" />
          <span>Nova Vistoria</span>
        </Link>

        <div className="h-5 w-px bg-[#E7EAE7] hidden sm:block" />

        {/* Usuário Conectado */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E9F3EC] border border-[#C5E2CE] text-[#142D26] flex items-center justify-center font-semibold text-[13px]">
            {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-[13px] font-semibold text-[#252B27] truncate max-w-[130px]">
              {userName}
            </p>
            <p className="text-[11px] text-[#737D75]">
              {userRole === "ADMIN" ? "Administrador" : "Operador"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sair da conta"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium text-[#737D75] hover:text-[#DC4C4C] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FECACA] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">
              {loggingOut ? "Saindo..." : "Sair"}
            </span>
          </button>
        </div>
      </div>

      {/* Modal Informativo do Período de Teste */}
      {trialModalOpen && (
        <div
          onClick={() => setTrialModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#142D26]/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-2xl border border-[#E7EAE7] shadow-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#142D26]">
                    Período de Demonstração Gratuito
                  </h3>
                  <p className="text-xs text-[#737D75]">
                    Empresa: <strong className="text-[#252B27]">{tenantName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTrialModalOpen(false)}
                className="p-1.5 rounded-lg text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#92400E]">
                <span>Status do Período de Avaliação:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A]">
                  {trialRemainingText || "3 dias disponíveis"}
                </span>
              </div>
              <p className="text-[12px] text-[#B45309]">
                Todas as funcionalidades (Pátio, Vistorias com Fotos, Orçamentos PDF, Ordens de Serviço e Financeiro) estão liberadas para você validar a operação.
              </p>
            </div>

            <div className="space-y-2 text-xs text-[#343C36]">
              <p className="font-semibold text-[#142D26]">
                Deseja ativar seu plano definitivo ou solicitar um sistema próprio?
              </p>
              <ul className="space-y-1.5 text-[12px] text-[#737D75]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                  <span>Liberação permanente de todos os seus dados e ordens de serviço</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                  <span>Possibilidade de domínio exclusivo com a marca da sua estética</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a
                href={`https://wa.me/${cleanPhone}?text=${whatsappTrialText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#16A36A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar no WhatsApp para Ativar</span>
              </a>

              <button
                type="button"
                onClick={() => setTrialModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-[#E7EAE7] bg-[#F7F8F6] hover:bg-[#E9F3EC] text-[#252B27] text-xs font-semibold transition-all cursor-pointer"
              >
                Continuar Testando
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
