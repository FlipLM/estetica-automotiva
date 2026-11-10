"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  ClipboardList,
  Camera,
  Users,
  Car,
  FileSpreadsheet,
  Wrench,
  Package,
  CircleDollarSign,
  Award,
  Sparkles,
  Settings,
  Palette,
  ChevronRight,
  Activity,
  Cpu,
  Layers,
  Gauge,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "ADMIN" | "OPERATOR";
  tenantName?: string;
}

export function Sidebar({ role, tenantName }: SidebarProps) {
  const pathname = usePathname();
  const [bayStats, setBayStats] = useState<{
    totalCapacity: number;
    occupiedCount: number;
    activeBoxesCount: number;
    percentOccupied: number;
  }>({
    totalCapacity: 5,
    occupiedCount: 0,
    activeBoxesCount: 0,
    percentOccupied: 0,
  });

  useEffect(() => {
    async function loadBayStats() {
      try {
        const res = await fetch("/api/boxes");
        if (res.ok) {
          const json = await res.json();
          const boxesList: Array<{ capacity: number; occupiedCount: number }> =
            json.boxes || [];
          const total = boxesList.reduce((acc, b) => acc + (b.capacity || 1), 0);
          const occupied = boxesList.reduce(
            (acc, b) => acc + (b.occupiedCount || 0),
            0
          );
          const activeBoxes = boxesList.filter((b) => (b.occupiedCount || 0) > 0).length;
          const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
          setBayStats({
            totalCapacity: Math.max(1, total),
            occupiedCount: occupied,
            activeBoxesCount: activeBoxes,
            percentOccupied: pct,
          });
        }
      } catch (err) {
        // Fallback silencioso
      }
    }
    loadBayStats();
  }, [pathname]);

  // Matriz de navegação estruturada em Setores da Oficina (100% em Português)
  const navigation = [
    {
      sector: "SETOR 01",
      title: "Operações do Pátio",
      items: [
        ...(role === "ADMIN"
          ? [
              {
                name: "Painel Geral",
                href: "/dashboard",
                icon: LayoutDashboard,
                tag: "INÍCIO",
              },
            ]
          : []),
        {
          name: "Pátio da Oficina",
          href: "/patio",
          icon: Kanban,
          tag: "AO VIVO",
        },
        {
          name: "Ordens de Serviço",
          href: "/os",
          icon: ClipboardList,
          tag: "OS",
        },
        {
          name: "Vistoria Digital 360º",
          href: "/vistoria",
          icon: Camera,
          tag: "FOTOS",
        },
        {
          name: "Orçamentos",
          href: "/orcamentos",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      sector: "SETOR 02",
      title: "Cadastros & Infraestrutura",
      items: [
        {
          name: "Clientes & Carros",
          href: "/clientes",
          icon: Users,
        },
        {
          name: "Boxes & Baias do Pátio",
          href: "/boxes",
          icon: Gauge,
          tag: "BOXES",
        },
        {
          name: "Funcionários & Equipe",
          href: "/funcionarios",
          icon: UserCheck,
          tag: "EQUIPE",
        },
        {
          name: "Catálogo de Serviços",
          href: "/servicos",
          icon: Wrench,
        },
        {
          name: "Estoque & Insumos",
          href: "/estoque",
          icon: Package,
        },
      ],
    },
    ...(role === "ADMIN"
      ? [
          {
            sector: "SETOR 03",
            title: "Gestão Financeira & Ajustes",
            items: [
              {
                name: "Financeiro & DRE",
                href: "/financeiro",
                icon: CircleDollarSign,
                tag: "DRE",
              },
              {
                name: "Comissões da Equipe",
                href: "/comissoes",
                icon: Award,
              },
              {
                name: "CRM & Retenção de Clientes",
                href: "/crm",
                icon: Sparkles,
              },
              {
                name: "Configurações da Oficina",
                href: "/configuracoes",
                icon: Settings,
              },
            ],
          },
        ]
      : [
          {
            sector: "SETOR 03",
            title: "Minha Produção",
            items: [
              {
                name: "Minhas Comissões",
                href: "/comissoes",
                icon: Award,
              },
            ],
          },
        ]),
  ];

  return (
    <aside className="w-64 shrink-0 billet-rail flex flex-col h-screen sticky top-0 select-none z-40">
      {/* 1. LOGO E IDENTIFICAÇÃO DA OFICINA */}
      <div className="p-3.5 border-b border-carbon-700/80 bg-carbon-900/60 relative overflow-hidden">
        <div className="flex items-center gap-3">
          {/* Logo Billet Hexagonal */}
          <div className="w-10 h-10 rounded-lg bg-carbon-800 border border-carbon-700 flex items-center justify-center relative shadow-inner group">
            <div className="absolute inset-0 bg-lime-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <Car className="w-5 h-5 text-lime-400" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-lime-400 rounded-full border-2 border-carbon-900" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-extrabold text-sm tracking-wide text-white uppercase truncate">
                APEX <span className="text-lime-400">//</span> ESTÉTICA
              </h1>
            </div>
            <p className="text-[10px] font-mono text-slate-400 truncate tracking-tight">
              {tenantName || "SISTEMA OPERACIONAL"}
            </p>
          </div>
        </div>

        {/* Status de Operação */}
        <div className="mt-3 pt-2.5 border-t border-carbon-800/80 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="led-pulse-lime" />
            <span className="tracking-widest uppercase text-lime-400 font-bold">SISTEMA ATIVO</span>
          </div>
          <span className="text-slate-500 text-[9px]">VERSÃO 2026.1</span>
        </div>
      </div>

      {/* 2. MEDIDOR DE CAPACIDADE DO PÁTIO */}
      <div className="mx-3 mt-3 p-2.5 rounded-lg bg-carbon-850/80 border border-carbon-700/70 text-slate-300">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
          <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3 h-3 text-lime-400" />
            CAPACIDADE DO PÁTIO
          </span>
          <span className="text-lime-400 font-bold">
            {bayStats.occupiedCount}/{bayStats.totalCapacity} VAGAS
          </span>
        </div>

        {/* Barra de Segmentos em Billet */}
        <div className="grid grid-cols-10 gap-0.5 h-1.5 bg-carbon-950 p-0.5 rounded border border-carbon-700">
          {Array.from({ length: 10 }).map((_, i) => {
            const filledCount = Math.round((bayStats.percentOccupied / 100) * 10);
            const isFilled = i < filledCount;
            const isHigh = bayStats.percentOccupied >= 90;
            return (
              <div
                key={`segment-${i}`}
                className={`rounded-xs transition-colors duration-300 ${
                  isFilled
                    ? isHigh
                      ? "bg-rose-500"
                      : "bg-lime-400"
                    : "bg-carbon-700/40"
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1.5">
          <span>
            {bayStats.activeBoxesCount > 0
              ? `${bayStats.activeBoxesCount} BOX(ES) EM ATIVIDADE`
              : "BOXES DISPONÍVEIS"}
          </span>
          <span className="text-slate-400">{bayStats.percentOccupied}% OCUPADO</span>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO DOS SETORES */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navigation.map((group) => (
          <div key={group.sector} className="space-y-1">
            {/* Título do Setor */}
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                <span className="text-lime-400/70 font-bold">{group.sector}</span> // {group.title}
              </span>
            </div>

            {/* Itens do Setor */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all duration-150 group",
                      isActive
                        ? "tactical-active-tab font-semibold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-carbon-800/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Ícone */}
                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-lime-400"
                            : "text-slate-500 group-hover:text-slate-300"
                        )}
                      />

                      {/* Nome do Módulo */}
                      <span className="truncate">{item.name}</span>
                    </div>

                    {/* Tag de Destaque */}
                    {item.tag ? (
                      <span
                        className={cn(
                          "text-[9px] font-mono uppercase px-1.5 py-0.2 rounded tracking-wider border",
                          isActive
                            ? "bg-lime-400/20 text-lime-300 border-lime-400/40"
                            : "bg-carbon-900 text-slate-500 border-carbon-700 group-hover:text-slate-300"
                        )}
                      >
                        {item.tag}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-lime-400 opacity-80" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 4. IDENTIFICAÇÃO DO USUÁRIO LOGADO */}
      <div className="p-3 border-t border-carbon-700/80 bg-carbon-900/90">
        <div className="flex items-center justify-between bg-carbon-950 p-2 rounded border border-carbon-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-carbon-800 border border-carbon-700 flex items-center justify-center shrink-0">
              <Cpu className="w-3.5 h-3.5 text-lime-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-bold text-slate-200 truncate leading-none">
                {role === "ADMIN" ? "ADMINISTRADOR" : "OPERADOR"}
              </p>
              <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                CONEXÃO ESTÁVEL // 14MS
              </p>
            </div>
          </div>

          <span
            className={cn(
              "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase",
              role === "ADMIN"
                ? "bg-lime-400/10 text-lime-400 border-lime-400/30"
                : "bg-blue-400/10 text-blue-400 border-blue-400/30"
            )}
          >
            {role === "ADMIN" ? "ADM" : "OP"}
          </span>
        </div>
      </div>
    </aside>
  );
}
