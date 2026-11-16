"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Layers,
  Package,
  PackageOpen,
  Plus,
  RotateCcw,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  Pagination,
  ProgressBar,
  SearchInput,
  StatCard,
  Tabs,
} from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CATEGORY_LABELS, formatStockQuantity } from "@/lib/inventory";
import type {
  InventoryAnalytics,
  InventoryProduct,
  InventorySummary,
  PaginatedMovementRow,
} from "./types";

interface AdminInventoryViewProps {
  products: InventoryProduct[];
  summary: InventorySummary;
  analytics: InventoryAnalytics;
  search: string;
  onSearchChange: (val: string) => void;
  onSearchClear: () => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  lowStockOnly: boolean;
  onLowStockOnlyChange: (val: boolean) => void;
  expiringOnly: boolean;
  onExpiringOnlyChange: (val: boolean) => void;
  includeArchived: boolean;
  onIncludeArchivedChange: (val: boolean) => void;
  period: string;
  onPeriodChange: (val: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (val: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (val: string) => void;
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (product: InventoryProduct) => void;
  onRequestDeleteProduct: (product: InventoryProduct) => void;
  onOpenMovementModal: (
    product: InventoryProduct,
    mode: "IN" | "OUT" | "LOSS" | "ADJUSTMENT"
  ) => void;
  onOpenReportModal: (product: InventoryProduct) => void;
  onOpenBottle: (product: InventoryProduct) => void;
  onOpenShoppingList: () => void;
  onRequestRecoverLoss: (productId: string, movementId: string) => void;
  movementsRefreshKey: number;
}

const MOVEMENT_BADGES: Record<
  string,
  { label: string; variant: "success" | "info" | "error" | "warning" | "neutral" }
> = {
  IN: { label: "Compra / Entrada", variant: "success" },
  OUT: { label: "Retirada Pátio", variant: "info" },
  OS_CONSUMPTION: { label: "Consumo OS", variant: "info" },
  LOSS: { label: "Perda / Avaria", variant: "error" },
  ADJUSTMENT: { label: "Ajuste Físico", variant: "warning" },
};

export function AdminInventoryView({
  products,
  summary,
  analytics,
  search,
  onSearchChange,
  onSearchClear,
  category,
  onCategoryChange,
  lowStockOnly,
  onLowStockOnlyChange,
  expiringOnly,
  onExpiringOnlyChange,
  includeArchived,
  onIncludeArchivedChange,
  period,
  onPeriodChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  onOpenCreateProduct,
  onOpenEditProduct,
  onRequestDeleteProduct,
  onOpenMovementModal,
  onOpenReportModal,
  onOpenBottle,
  onOpenShoppingList,
  onRequestRecoverLoss,
  movementsRefreshKey,
}: AdminInventoryViewProps) {
  const [activeTab, setActiveTab] = useState("catalog");

  // Histórico paginado global (/api/products/movements)
  const [movPage, setMovPage] = useState(1);
  const [movTypeFilter, setMovTypeFilter] = useState("ALL");
  const [movTotalPages, setMovTotalPages] = useState(1);
  const [movTotal, setMovTotal] = useState(0);
  const [movRows, setMovRows] = useState<PaginatedMovementRow[]>([]);
  const [movLoading, setMovLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "movements") return;
    let cancelled = false;
    async function loadMovements() {
      setMovLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(movPage),
          limit: "20",
          period,
          type: movTypeFilter,
        });
        if (search.trim()) params.set("search", search.trim());
        if (period === "custom" && customStartDate && customEndDate) {
          params.set("startDate", customStartDate);
          params.set("endDate", customEndDate);
        }
        const res = await fetch(`/api/products/movements?${params.toString()}`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setMovRows(data.movements || []);
          setMovTotal(data.total || 0);
          setMovTotalPages(data.totalPages || 1);
        }
      } finally {
        if (!cancelled) setMovLoading(false);
      }
    }
    loadMovements();
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    movPage,
    movTypeFilter,
    period,
    customStartDate,
    customEndDate,
    search,
    movementsRefreshKey,
  ]);

  const criticalCount = summary.lowStockCount + summary.outOfStockCount;

  return (
    <div className="space-y-6">
      {/* KPIs Consolidados (não distorcidos por busca) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Valor Imobilizado em Estoque"
          value={formatCurrency(summary.totalStockValue)}
          subtitle={`${summary.totalProducts} itens ativos no catálogo`}
          icon={<DollarSign className="w-4 h-4" />}
          tone="brand"
        />
        <StatCard
          label="Investido em Compras (Mês)"
          value={formatCurrency(summary.totalInvestedMonth)}
          subtitle={`No período filtrado: ${formatCurrency(summary.totalSpentInPeriod)}`}
          icon={<ArrowUpCircle className="w-4 h-4" />}
          tone="success"
        />
        <StatCard
          label="Reposição Necessária"
          value={String(criticalCount)}
          subtitle={
            summary.outOfStockCount > 0
              ? `${summary.outOfStockCount} zerado(s) e ${summary.lowStockCount} no mínimo`
              : "Itens abaixo do estoque mínimo"
          }
          icon={<AlertTriangle className="w-4 h-4" />}
          tone={criticalCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Validade & Pot-Life"
          value={String(summary.expiringCount)}
          subtitle={
            summary.lossesInPeriod > 0
              ? `Perdas no período: ${formatCurrency(summary.lossesInPeriod)}`
              : "Lotes vencidos, a vencer ou frascos abertos"
          }
          icon={<Clock className="w-4 h-4" />}
          tone={summary.expiringCount > 0 ? "error" : "default"}
        />
      </div>

      {/* Barra de Ações & Abas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: "catalog",
              label: "Catálogo & Saldos",
              count: products.length,
              icon: <Package className="w-3.5 h-3.5" />,
            },
            {
              id: "movements",
              label: "Histórico de Movimentações",
              count: activeTab === "movements" ? movTotal : undefined,
              icon: <Layers className="w-3.5 h-3.5" />,
            },
            {
              id: "analytics",
              label: "Consumo & Perdas",
              count: analytics.recentLossAlerts.length || undefined,
              icon: <FileText className="w-3.5 h-3.5" />,
            },
          ]}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenShoppingList}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
          >
            Lista de Compras ({criticalCount})
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenCreateProduct}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filtros compartilhados */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4">
            <SearchInput
              value={search}
              onChange={(val) => {
                onSearchChange(val);
                setMovPage(1);
              }}
              onClear={() => {
                onSearchClear();
                setMovPage(1);
              }}
              placeholder="Buscar produto, fornecedor ou embalagem..."
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="dp-input text-xs"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="CHEMICAL">Químicos / Produtos</option>
              <option value="ACCESSORY">Acessórios / Panos</option>
              <option value="TOOL">Equipamentos / Ferramentas</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={period}
              onChange={(e) => {
                onPeriodChange(e.target.value);
                setMovPage(1);
              }}
              className="dp-input text-xs"
            >
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Este Mês</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => onLowStockOnlyChange(!lowStockOnly)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                lowStockOnly
                  ? "bg-[#FFFBEB] border-[#D97706] text-[#B45309]"
                  : "bg-white border-[#E7EAE7] text-[#737D75]"
              }`}
            >
              Abaixo Mínimo ({criticalCount})
            </button>
            <button
              type="button"
              onClick={() => onExpiringOnlyChange(!expiringOnly)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                expiringOnly
                  ? "bg-[#FEF2F2] border-[#DC4C4C] text-[#DC4C4C]"
                  : "bg-white border-[#E7EAE7] text-[#737D75]"
              }`}
            >
              Validade ({summary.expiringCount})
            </button>
            {summary.archivedProductsCount > 0 && (
              <button
                type="button"
                onClick={() => onIncludeArchivedChange(!includeArchived)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors inline-flex items-center gap-1 ${
                  includeArchived
                    ? "bg-[#E9F3EC] border-[#247653] text-[#142D26]"
                    : "bg-white border-[#E7EAE7] text-[#737D75]"
                }`}
              >
                <Archive className="w-3 h-3" />
                Arquivados ({summary.archivedProductsCount})
              </button>
            )}
          </div>
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#F1F3F1] text-xs">
            <span className="text-[#737D75] font-medium">Período de análise:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => onCustomStartDateChange(e.target.value)}
              className="dp-input w-40 py-1 text-xs"
            />
            <span className="text-[#737D75]">até</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => onCustomEndDateChange(e.target.value)}
              className="dp-input w-40 py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* ABA 1: CATÁLOGO DE PRODUTOS */}
      {activeTab === "catalog" && (
        <div className="bg-white border border-[#E7EAE7] rounded-2xl overflow-hidden shadow-xs">
          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="w-6 h-6" />}
              title="Nenhum produto encontrado"
              description="Cadastre seu primeiro produto químico ou acessório, ou ajuste os filtros acima."
              action={
                <Button variant="primary" size="sm" onClick={onOpenCreateProduct}>
                  Cadastrar Primeiro Produto
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F8F6] text-[#737D75] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E7EAE7]">
                  <tr>
                    <th className="py-3 px-4">Produto & Ficha</th>
                    <th className="py-3 px-4">Nível de Saldo</th>
                    <th className="py-3 px-4 text-right">Custo Médio</th>
                    <th className="py-3 px-4 text-right">Imobilizado</th>
                    <th className="py-3 px-4">Validade / Frasco</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F1]">
                  {products.map((product) => {
                    const isOut = product.currentStock <= 0;
                    const isLow = !isOut && product.currentStock <= product.minStock;
                    const barTone = isOut ? "error" : isLow ? "warning" : "success";

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-[#F7F8F6]/70 transition-colors ${
                          !product.active ? "opacity-65 bg-[#F7F8F6]" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#252B27] text-[13px]">
                              {product.name}
                            </span>
                            {!product.active && (
                              <Badge variant="neutral" size="sm">
                                Arquivado
                              </Badge>
                            )}
                            {product.defaultDilution && (
                              <Badge variant="info" size="sm">
                                {product.defaultDilution}
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-[#737D75] mt-0.5 flex flex-wrap gap-x-2">
                            <span>{CATEGORY_LABELS[product.category]}</span>
                            {product.packLabel && <span>• Emb.: {product.packLabel}</span>}
                            {product.supplier && <span>• Forn.: {product.supplier}</span>}
                            {product.recipesCount > 0 && (
                              <span>• {product.recipesCount} serviço(s)</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-extrabold ${
                                isOut
                                  ? "text-[#DC4C4C]"
                                  : isLow
                                  ? "text-[#D97706]"
                                  : "text-[#142D26]"
                              }`}
                            >
                              {formatStockQuantity(product.currentStock, product.unit)}
                            </span>
                            <span className="text-[10px] text-[#737D75]">
                              Mín: {formatStockQuantity(product.minStock, product.unit)}
                            </span>
                          </div>
                          <ProgressBar
                            value={product.currentStock}
                            max={Math.max(product.minStock * 2, product.currentStock, 1)}
                            tone={barTone}
                          />
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-semibold text-[#252B27]">
                            {formatCurrency(product.averageUnitCost)}
                          </span>
                          <span className="block text-[10px] text-[#737D75]">
                            por {product.unit}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-[#142D26] whitespace-nowrap">
                          {formatCurrency(product.totalStockValue)}
                        </td>

                        <td className="py-3.5 px-4">
                          {product.shelfLife.status !== "OK" && product.shelfLife.label ? (
                            <Badge
                              variant={
                                product.shelfLife.status.includes("EXPIRED")
                                  ? "error"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {product.shelfLife.label}
                            </Badge>
                          ) : product.daysValidAfterOpen ? (
                            product.openedAt ? (
                              <span className="text-[11px] text-[#247653] font-medium">
                                Aberto ({product.shelfLife.daysRemaining ?? "?"}d rest.)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenBottle(product)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#247653] hover:underline cursor-pointer"
                              >
                                <PackageOpen className="w-3.5 h-3.5" />
                                Abrir frasco
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-[#9CA49E]">Normal</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {product.active && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onOpenMovementModal(product, "IN")}
                                  className="px-2 py-1.5 rounded-lg bg-[#E9F3EC] text-[#142D26] hover:bg-[#D5E9DC] font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                  title="Registrar Compra / Entrada"
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5 text-[#247653]" />
                                  Entrada
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenMovementModal(product, "OUT")}
                                  disabled={isOut}
                                  className="px-2 py-1.5 rounded-lg bg-[#F7F8F6] border border-[#E7EAE7] text-[#252B27] hover:bg-[#ECEFED] font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                                  title="Dar Baixa / Usar"
                                >
                                  <ArrowDownCircle className="w-3.5 h-3.5" />
                                  Usar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenMovementModal(product, "LOSS")}
                                  disabled={isOut}
                                  className="p-1.5 rounded-lg text-[#737D75] hover:text-[#DC4C4C] hover:bg-[#FEF2F2] cursor-pointer disabled:opacity-40"
                                  title="Registrar Perda / Avaria"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenMovementModal(product, "ADJUSTMENT")
                                  }
                                  className="p-1.5 rounded-lg text-[#737D75] hover:text-[#252B27] hover:bg-[#F7F8F6] cursor-pointer"
                                  title="Ajuste Físico de Inventário"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenReportModal(product)}
                              className="p-1.5 rounded-lg text-[#737D75] hover:text-[#247653] hover:bg-[#E9F3EC] cursor-pointer"
                              title="Ficha Completa & Histórico"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenEditProduct(product)}
                              className="p-1.5 rounded-lg text-[#737D75] hover:text-[#252B27] hover:bg-[#F7F8F6] cursor-pointer"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onRequestDeleteProduct(product)}
                              className="p-1.5 rounded-lg text-[#737D75] hover:text-[#DC4C4C] hover:bg-[#FEF2F2] cursor-pointer"
                              title={
                                product.movementsCount > 0
                                  ? "Arquivar Produto"
                                  : "Excluir Produto"
                              }
                            >
                              {product.movementsCount > 0 ? (
                                <Archive className="w-3.5 h-3.5" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: HISTÓRICO PAGINADO GLOBAL */}
      {activeTab === "movements" && (
        <div className="bg-white border border-[#E7EAE7] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E7EAE7] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#252B27]">
              Movimentações no Período ({movTotal})
            </span>
            <select
              value={movTypeFilter}
              onChange={(e) => {
                setMovTypeFilter(e.target.value);
                setMovPage(1);
              }}
              className="dp-input w-48 text-xs py-1.5"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="IN">Somente Entradas (Compras)</option>
              <option value="OS_CONSUMPTION">Somente Consumo em OS</option>
              <option value="OUT">Somente Retiradas Pátio</option>
              <option value="LOSS">Somente Perdas / Avarias</option>
              <option value="ADJUSTMENT">Somente Ajustes Físicos</option>
            </select>
          </div>

          {movLoading ? (
            <LoadingState message="Carregando histórico de movimentações..." />
          ) : movRows.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-5 h-5" />}
              title="Nenhuma movimentação no período"
              description="Altere o período ou o tipo de movimentação para visualizar os registros."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F8F6] text-[#737D75] uppercase tracking-wider text-[11px] font-semibold border-b border-[#E7EAE7]">
                    <tr>
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4">Produto</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4 text-right">Quantidade</th>
                      <th className="py-3 px-4 text-right">Valor / Custo</th>
                      <th className="py-3 px-4">Responsável / Detalhe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F1]">
                    {movRows.map((row) => {
                      const cfg = MOVEMENT_BADGES[row.type] || {
                        label: row.type,
                        variant: "neutral" as const,
                      };
                      return (
                        <tr key={row.id} className="hover:bg-[#F7F8F6]/70">
                          <td className="py-3 px-4 whitespace-nowrap text-[#737D75]">
                            {formatDateTime(row.createdAt)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#252B27]">
                            {row.productName}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={cfg.variant} size="sm">
                                {cfg.label}
                              </Badge>
                              {row.recovered && (
                                <Badge variant="success" size="sm">
                                  Recuperada
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[#252B27] whitespace-nowrap">
                            {row.type === "IN" ? "+" : row.type === "ADJUSTMENT" ? "" : "-"}
                            {formatStockQuantity(row.quantity, row.productUnit)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap text-[#343C36]">
                            {row.totalCost != null ? formatCurrency(row.totalCost) : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-[#252B27]">{row.reason || "—"}</p>
                            {(row.userName || row.serviceOrderNumber) && (
                              <p className="text-[11px] text-[#737D75]">
                                {row.userName ? `Por ${row.userName}` : ""}
                                {row.serviceOrderNumber
                                  ? ` • OS #${row.serviceOrderNumber}`
                                  : ""}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-[#E7EAE7]">
                <Pagination
                  currentPage={movPage}
                  totalPages={movTotalPages}
                  onPageChange={setMovPage}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ABA 3: ANALYTICS DE CONSUMO & PERDAS */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[#E7EAE7] rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#252B27]">
              Top Produtos Consumidos no Período
            </h3>
            {analytics.topConsumers.length === 0 ? (
              <p className="text-xs text-[#737D75]">
                Nenhum consumo operacional ou de OS registrado no período.
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.topConsumers.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#252B27]">{item.name}</p>
                      <p className="text-[#737D75]">
                        Consumo: {formatStockQuantity(item.totalQuantity, item.unit)}
                      </p>
                    </div>
                    <span className="font-bold text-[#142D26]">
                      {formatCurrency(item.totalCost)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E7EAE7] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#252B27]">
                Perdas Pendentes de Recuperação
              </h3>
              <span className="text-xs font-bold text-[#DC4C4C]">
                {formatCurrency(analytics.totalLostValue)}
              </span>
            </div>

            {analytics.recentLossAlerts.length === 0 ? (
              <p className="text-xs text-[#737D75]">
                Nenhuma perda pendente no período selecionado.
              </p>
            ) : (
              <div className="space-y-2.5">
                {analytics.recentLossAlerts.map((loss) => (
                  <div
                    key={loss.id}
                    className="p-3 rounded-xl bg-[#FEF2F2]/60 border border-[#FECACA] flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#252B27]">
                        {loss.productName} ({formatStockQuantity(loss.quantity, loss.unit)})
                      </p>
                      <p className="text-[#737D75]">
                        {loss.reason || "Sem motivo"} •{" "}
                        <strong className="text-[#DC4C4C]">
                          {formatCurrency(loss.totalCost)}
                        </strong>
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onRequestRecoverLoss(loss.productId, loss.id)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Recuperar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
