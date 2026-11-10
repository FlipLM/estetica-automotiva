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
} from "lucide-react";

interface HeaderProps {
  userName: string;
  userRole: "ADMIN" | "OPERATOR";
  tenantName: string;
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
  "/design-system": "Design System & Protótipos",
  "/temas": "Identidades Visuais",
};

export function Header({ userName, userRole, tenantName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [boxes, setBoxes] = useState<BoxTelemetry[]>([]);

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
    <header className="h-16 bg-white border-b border-[#E7EAE7] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
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
    </header>
  );
}
