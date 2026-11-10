"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Camera,
  ClipboardList,
  Kanban,
  Layers,
  FileSpreadsheet,
  Users,
  Wrench,
  CircleDollarSign,
  Award,
  Package,
  Sparkles,
  UserCheck,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  Car,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "ADMIN" | "OPERATOR";
  tenantName?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Sidebar({ role, tenantName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bayStats, setBayStats] = useState({
    totalCapacity: 5,
    occupiedCount: 0,
    percentOccupied: 0,
  });

  useEffect(() => {
    setMobileMenuOpen(false);
    async function loadBayStats() {
      try {
        const res = await fetch("/api/boxes");
        if (res.ok) {
          const json = await res.json();
          const list: Array<{ capacity: number; occupiedCount: number }> =
            json.boxes || [];
          const total = list.reduce((acc, b) => acc + (b.capacity || 1), 0);
          const occupied = list.reduce(
            (acc, b) => acc + (b.occupiedCount || 0),
            0
          );
          const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
          setBayStats({
            totalCapacity: Math.max(1, total),
            occupiedCount: occupied,
            percentOccupied: pct,
          });
        }
      } catch {
        // Ignora silenciosamente
      }
    }
    loadBayStats();
  }, [pathname]);

  const groups: NavGroup[] = [
    {
      title: "PRINCIPAL",
      items: [
        ...(role === "ADMIN"
          ? [
              {
                name: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
              },
            ]
          : []),
        {
          name: "Agenda",
          href: "/agenda",
          icon: Calendar,
        },
      ],
    },
    {
      title: "OPERAÇÃO",
      items: [
        {
          name: "Recepção / Vistoria",
          href: "/vistoria",
          icon: Camera,
        },
        {
          name: "Ordens de Serviço",
          href: "/os",
          icon: ClipboardList,
        },
        {
          name: "Kanban do Pátio",
          href: "/patio",
          icon: Kanban,
          badge: "Ao vivo",
        },
        {
          name: "Boxes e Vagas",
          href: "/boxes",
          icon: Layers,
        },
        {
          name: "Orçamentos",
          href: "/orcamentos",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      title: "CADASTROS",
      items: [
        {
          name: "Clientes e Veículos",
          href: "/clientes",
          icon: Users,
        },
        ...(role === "ADMIN"
          ? [
              {
                name: "Catálogo de Serviços",
                href: "/servicos",
                icon: Wrench,
              },
            ]
          : []),
      ],
    },
    {
      title: "GESTÃO",
      items: [
        ...(role === "ADMIN"
          ? [
              {
                name: "Financeiro e DRE",
                href: "/financeiro",
                icon: CircleDollarSign,
              },
            ]
          : []),
        {
          name: "Comissões",
          href: "/comissoes",
          icon: Award,
        },
        {
          name: "Estoque",
          href: "/estoque",
          icon: Package,
        },
        ...(role === "ADMIN"
          ? [
              {
                name: "CRM e Retenção",
                href: "/crm",
                icon: Sparkles,
              },
            ]
          : []),
      ],
    },
    ...(role === "ADMIN"
      ? [
          {
            title: "SISTEMA",
            items: [
              {
                name: "Equipe",
                href: "/funcionarios",
                icon: UserCheck,
              },
              {
                name: "Configurações",
                href: "/configuracoes",
                icon: Settings,
              },
            ],
          },
        ]
      : []),
  ];

  const isRouteActive = (href: string) => {
    if (pathname === href) return true;
    if (href !== "/dashboard" && pathname.startsWith(`${href}/`)) return true;
    return false;
  };

  return (
    <>
      {/* =====================================================================
          SIDEBAR DESKTOP (240px expandida / 72px recolhida)
         ===================================================================== */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-[#E7EAE7] min-h-screen shrink-0 select-none transition-all duration-200 relative z-30 print:hidden",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* 1. Identidade da Marca */}
        <div
          className={cn(
            "h-16 border-b border-[#E7EAE7] flex items-center justify-between px-4",
            collapsed && "justify-center px-2"
          )}
        >
          <Link
            href={role === "ADMIN" ? "/dashboard" : "/patio"}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#142D26] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Car className="w-5 h-5 text-[#E9F3EC]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[15px] text-[#142D26] tracking-tight truncate">
                    DetailPro
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E9F3EC] text-[#247653]">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-[#737D75] truncate">
                  {tenantName || "Centro de Estética"}
                </p>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Recolher barra lateral"
              title="Recolher menu"
              className="p-1.5 rounded-[8px] text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botão para expandir quando recolhida */}
        {collapsed && (
          <div className="flex justify-center py-2 border-b border-[#F1F3F1]">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir barra lateral"
              title="Expandir menu"
              className="p-1.5 rounded-[8px] text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Botão de Ação Principal */}
        <div className={cn("px-3 pt-3 pb-1", collapsed && "px-2")}>
          <Link
            href="/os/nova"
            title="Nova Ordem de Serviço"
            className={cn(
              "flex items-center justify-center gap-2 bg-[#247653] hover:bg-[#318B63] text-white font-semibold text-[13px] rounded-[8px] h-9 transition-all shadow-xs",
              collapsed ? "px-0 w-full" : "px-3 w-full"
            )}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Nova Ordem de Serviço</span>}
          </Link>
        </div>

        {/* 3. Navegação Organizada por Grupos */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA49E]">
                    {group.title}
                  </span>
                </div>
              )}

              {group.items.map((item) => {
                const active = isRouteActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 rounded-[8px] text-[13px] transition-all duration-150 group",
                      collapsed && "justify-center px-0 py-2.5",
                      active
                        ? "bg-[#E9F3EC] text-[#142D26] font-semibold"
                        : "text-[#737D75] hover:text-[#252B27] hover:bg-[#F7F8F6] font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-[18px] h-[18px] shrink-0 transition-colors",
                          active
                            ? "text-[#247653]"
                            : "text-[#737D75] group-hover:text-[#252B27]"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                          active
                            ? "bg-[#247653] text-white"
                            : "bg-[#F1F3F1] text-[#737D75]"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* 4. Medidor Compacto de Ocupação do Pátio */}
        {!collapsed ? (
          <div className="p-3 m-3 rounded-[10px] bg-[#F7F8F6] border border-[#E7EAE7]">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="font-medium text-[#737D75]">Vagas do Pátio</span>
              <span className="font-semibold text-[#142D26]">
                {bayStats.occupiedCount}/{bayStats.totalCapacity} ocupadas
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E7EAE7] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  bayStats.percentOccupied >= 90
                    ? "bg-[#DC4C4C]"
                    : bayStats.percentOccupied >= 60
                    ? "bg-[#D97706]"
                    : "bg-[#247653]"
                )}
                style={{ width: `${Math.min(100, bayStats.percentOccupied)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#737D75]">
              <span>Ocupação atual</span>
              <span>{bayStats.percentOccupied}%</span>
            </div>
          </div>
        ) : (
          <div
            className="p-2 m-2 rounded-[8px] bg-[#F7F8F6] border border-[#E7EAE7] text-center"
            title={`Vagas do Pátio: ${bayStats.occupiedCount}/${bayStats.totalCapacity}`}
          >
            <span className="text-[11px] font-bold text-[#247653]">
              {bayStats.occupiedCount}/{bayStats.totalCapacity}
            </span>
          </div>
        )}
      </aside>

      {/* =====================================================================
          NAVEGAÇÃO MOBILE INFERIOR + DRAWER COMPLETO
         ===================================================================== */}
      <nav
        aria-label="Navegação rápida mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7EAE7] px-3 py-2 flex items-center justify-around shadow-dropdown pb-[calc(0.5rem+env(safe-area-inset-bottom))] print:hidden"
      >
        <Link
          href={role === "ADMIN" ? "/dashboard" : "/patio"}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium transition-colors",
            pathname === "/dashboard"
              ? "text-[#247653] font-bold bg-[#E9F3EC]"
              : "text-[#737D75] hover:text-[#252B27]"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Início</span>
        </Link>

        <Link
          href="/patio"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium transition-colors",
            pathname.startsWith("/patio")
              ? "text-[#247653] font-bold bg-[#E9F3EC]"
              : "text-[#737D75] hover:text-[#252B27]"
          )}
        >
          <Kanban className="w-5 h-5" />
          <span>Pátio</span>
        </Link>

        {/* Botão de Destaque Central: + Nova OS */}
        <Link
          href="/os/nova"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#247653] hover:bg-[#142D26] active:scale-95 text-white shadow-md -mt-5 transition-all"
          aria-label="Nova Ordem de Serviço"
          title="Nova Ordem de Serviço"
        >
          <Plus className="w-6 h-6" />
        </Link>

        <Link
          href="/vistoria"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium transition-colors",
            pathname.startsWith("/vistoria")
              ? "text-[#247653] font-bold bg-[#E9F3EC]"
              : "text-[#737D75] hover:text-[#252B27]"
          )}
        >
          <Camera className="w-5 h-5" />
          <span>Vistoria</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-medium transition-colors cursor-pointer",
            mobileMenuOpen
              ? "text-[#247653] font-bold bg-[#E9F3EC]"
              : "text-[#737D75] hover:text-[#252B27]"
          )}
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Drawer Mobile Completo */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-[#142D26]/60 backdrop-blur-sm flex"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[300px] max-w-[85vw] bg-white h-full shadow-modal flex flex-col animate-in slide-in-from-left duration-200">
            <div className="h-16 px-4 border-b border-[#E7EAE7] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#142D26] flex items-center justify-center text-white shadow-xs">
                  <Car className="w-5 h-5 text-[#A7F3D0]" />
                </div>
                <div>
                  <span className="font-bold text-[16px] text-[#142D26] block leading-none">
                    DetailPro
                  </span>
                  <span className="text-[11px] text-[#737D75] truncate max-w-[170px] block mt-0.5">
                    {tenantName || "Estética Automotiva"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="p-2 rounded-lg text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {/* Ocupação do Pátio no topo do Drawer */}
              <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#737D75]">Ocupação do Pátio</span>
                  <span className="font-bold text-[#142D26]">
                    {bayStats.occupiedCount}/{bayStats.totalCapacity} vagas
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E7EAE7] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      bayStats.percentOccupied >= 90
                        ? "bg-[#DC4C4C]"
                        : bayStats.percentOccupied >= 60
                        ? "bg-[#D97706]"
                        : "bg-[#247653]"
                    )}
                    style={{ width: `${Math.min(100, bayStats.percentOccupied)}%` }}
                  />
                </div>
              </div>

              {groups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#9CA49E]">
                    {group.title}
                  </span>
                  {group.items.map((item) => {
                    const active = isRouteActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] transition-colors",
                          active
                            ? "bg-[#E9F3EC] text-[#142D26] font-bold"
                            : "text-[#737D75] hover:bg-[#F7F8F6] font-medium"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0",
                              active ? "text-[#247653]" : "text-[#737D75]"
                            )}
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E9F3EC] text-[#247653] font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div
            className="flex-1"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
}
