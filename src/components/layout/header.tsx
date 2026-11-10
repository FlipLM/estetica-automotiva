"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, ShieldCheck, Wrench, Search, Zap, Gauge, Clock } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  userRole: "ADMIN" | "OPERATOR";
  tenantName?: string;
}

export function Header({ userName, userRole, tenantName }: HeaderProps) {
  const router = useRouter();
  const [time, setTime] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [boxes, setBoxes] = useState<
    Array<{
      id: string;
      name: string;
      capacity: number;
      occupiedCount: number;
      isFull: boolean;
      currentOrders?: Array<{ plate: string; model: string }>;
    }>
  >([]);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);

    async function loadBoxes() {
      try {
        const res = await fetch("/api/boxes");
        if (res.ok) {
          const data = await res.json();
          setBoxes(data.boxes || []);
        }
      } catch (e) {
        // Silently catch
      }
    }
    loadBoxes();
    const boxInterval = setInterval(loadBoxes, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(boxInterval);
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Erro ao sair:", e);
      router.push("/login");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/patio?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  return (
    <header className="h-16 border-b border-carbon-700/80 bg-carbon-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* 1. STATUS E INDICAÇÃO DOS BOXES EM TEMPO REAL */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Fita de Boxes */}
        <Link
          href="/boxes"
          title="Clique para cadastrar ou gerenciar os boxes e baias do pátio"
          className="hidden xl:flex items-center gap-2 font-mono text-[10px] hover:opacity-95 transition-all group"
        >
          <span className="text-slate-400 group-hover:text-lime-400 uppercase tracking-wider text-[9px] flex items-center gap-1 font-bold transition-colors">
            <Gauge className="w-3 h-3 text-lime-400" />
            BOXES & BAIAS:
          </span>

          <div className="flex items-center gap-1.5">
            {boxes.length === 0 ? (
              <div className="px-2 py-1 rounded bg-carbon-950 border border-carbon-700 flex items-center gap-1.5 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="text-[9px] font-bold">CARREGANDO BOXES...</span>
              </div>
            ) : (
              boxes.slice(0, 4).map((b) => {
                const firstPlate = b.currentOrders?.[0]?.plate;
                return (
                  <div
                    key={b.id}
                    className={`px-2 py-1 rounded border flex items-center gap-1.5 text-slate-300 transition-colors ${
                      b.isFull
                        ? "bg-rose-950/30 border-rose-500/50 text-rose-300"
                        : b.occupiedCount > 0
                        ? "bg-carbon-950 border-amber-500/30 text-amber-300"
                        : "bg-carbon-950/60 border-dashed border-carbon-700 text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        b.isFull
                          ? "bg-rose-400 animate-pulse"
                          : b.occupiedCount > 0
                          ? "bg-amber-400 animate-pulse"
                          : "bg-lime-400"
                      }`}
                    />
                    <span className="font-bold uppercase text-[9px]">{b.name}:</span>
                    {b.isFull ? (
                      <span className="text-[9px] font-bold text-rose-400">
                        LOTADO ({b.occupiedCount}/{b.capacity})
                      </span>
                    ) : b.occupiedCount > 0 ? (
                      <span className="text-white font-mono font-bold text-[9px]">
                        {firstPlate || `${b.occupiedCount}/${b.capacity}`}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400">
                        LIVRE ({b.capacity} {b.capacity === 1 ? "vaga" : "vagas"})
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Link>

        {/* Indicador Mobile/Tablet */}
        <div className="xl:hidden flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="led-pulse-lime" />
            <span className="font-bold text-white uppercase">{tenantName || "OFICINA ATIVA"}</span>
          </div>
        </div>
      </div>

      {/* 2. CENTRO: BUSCA RÁPIDA POR PLACA OU CLIENTE */}
      <div className="hidden md:flex items-center max-w-xs w-full mx-4">
        <form onSubmit={handleSearch} className="w-full relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="BUSCAR PLACA OU CLIENTE..."
            className="w-full bg-carbon-950 border border-carbon-700 hover:border-carbon-600 focus:border-lime-400/80 rounded-lg pl-8 pr-12 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-lime-400/30 transition-all uppercase"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 bg-carbon-800 px-1.5 py-0.5 rounded border border-carbon-700">
            ENTER
          </kbd>
        </form>
      </div>

      {/* 3. DIREITA: RELÓGIO, BOTÃO NOVA ENTRADA E OPERADOR */}
      <div className="flex items-center gap-3">
        {/* Relógio Operacional */}
        <div className="hidden lg:flex flex-col items-end pr-3 border-r border-carbon-700/80 font-mono">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 tracking-wider">
            <Clock className="w-3 h-3 text-lime-400" />
            <span>{time || "--:--:--"}</span>
          </div>
          <span className="text-[9px] text-slate-500 tracking-tight">TURNO DIURNO</span>
        </div>

        {/* Botão de Alta Visibilidade: Nova Entrada */}
        <Link
          href="/os/nova"
          className="btn-engine-start px-3.5 py-2 rounded text-xs flex items-center gap-2 group cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-black stroke-black group-hover:scale-110 transition-transform" />
          <span className="font-display font-extrabold tracking-wider">+ NOVA OS // ENTRADA</span>
        </Link>

        {/* Perfil do Usuário */}
        <div className="flex items-center gap-2 pl-3 border-l border-carbon-700/80">
          <div className="w-8 h-8 rounded bg-carbon-800 border border-carbon-700 flex items-center justify-center text-xs font-semibold">
            {userRole === "ADMIN" ? (
              <ShieldCheck className="w-4 h-4 text-lime-400" />
            ) : (
              <Wrench className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-mono font-bold text-slate-200 leading-tight truncate max-w-[120px]">
              {userName}
            </p>
            <p className="text-[9px] font-mono text-lime-400 leading-tight">
              {userRole === "ADMIN" ? "ADMINISTRADOR" : "OPERADOR"}
            </p>
          </div>

          {/* Sair do Sistema */}
          <button
            onClick={handleLogout}
            title="Encerrar sessão e sair do sistema"
            className="p-1.5 rounded hover:bg-carbon-800 text-slate-500 hover:text-red-400 border border-transparent hover:border-carbon-700 transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
