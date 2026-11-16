"use client";

import {
  AlertTriangle,
  Beaker,
  Droplet,
  History,
  MinusCircle,
  Package,
  ShieldAlert,
} from "lucide-react";
import { Badge, Button, EmptyState, SearchInput } from "@/components/ui";
import { CATEGORY_LABELS, formatStockQuantity } from "@/lib/inventory";
import type { InventoryProduct, InventorySummary } from "./types";

interface OperatorBayViewProps {
  products: InventoryProduct[];
  summary: InventorySummary;
  search: string;
  onSearchChange: (val: string) => void;
  onSearchClear: () => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  onOpenUseModal: (product: InventoryProduct) => void;
  onOpenLossModal: (product: InventoryProduct) => void;
  onOpenReportModal: (product: InventoryProduct) => void;
}

export function OperatorBayView({
  products,
  summary,
  search,
  onSearchChange,
  onSearchClear,
  category,
  onCategoryChange,
  onOpenUseModal,
  onOpenLossModal,
  onOpenReportModal,
}: OperatorBayViewProps) {
  return (
    <div className="space-y-5">
      {/* Banner operacional simplificado */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] text-[#247653] flex items-center justify-center shrink-0">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#142D26]">
              Balcão Rápido do Pátio
            </h2>
            <p className="text-xs text-[#737D75]">
              Selecione o produto que vai usar, calcule a diluição ou registre uma
              perda em segundos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="neutral" size="md">
            {summary.totalProducts} itens ativos
          </Badge>
          {summary.lowStockCount + summary.outOfStockCount > 0 && (
            <Badge variant="warning" size="md">
              {summary.lowStockCount + summary.outOfStockCount} em nível baixo
            </Badge>
          )}
          {summary.expiringCount > 0 && (
            <Badge variant="error" size="md">
              {summary.expiringCount} atenção validade
            </Badge>
          )}
        </div>
      </div>

      {/* Busca e Filtros rápidos touch-friendly */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={search}
            onChange={(val) => onSearchChange(val)}
            onClear={onSearchClear}
            placeholder="Buscar produto, cera, shampoo..."
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "ALL", label: "Todos" },
            { key: "CHEMICAL", label: "Químicos" },
            { key: "ACCESSORY", label: "Acessórios" },
            { key: "TOOL", label: "Equipamentos" },
          ].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onCategoryChange(c.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                category === c.key
                  ? "bg-[#247653] text-white"
                  : "bg-white border border-[#E7EAE7] text-[#737D75] hover:text-[#252B27]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grandes para uso com luva / celular no pátio */}
      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-5 h-5" />}
          title="Nenhum insumo encontrado"
          description="Tente limpar o filtro de busca ou trocar a categoria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const isOut = product.currentStock <= 0;
            const isLow = !isOut && product.currentStock <= product.minStock;

            return (
              <div
                key={product.id}
                className="bg-white border border-[#E7EAE7] rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#737D75]">
                        {CATEGORY_LABELS[product.category] || product.category}
                      </span>
                      <h3 className="text-sm font-bold text-[#252B27] leading-snug">
                        {product.name}
                      </h3>
                    </div>

                    {isOut ? (
                      <Badge variant="error" size="sm">
                        Zerado
                      </Badge>
                    ) : isLow ? (
                      <Badge variant="warning" size="sm">
                        Acabando
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Disponível
                      </Badge>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] flex items-center justify-between">
                    <span className="text-xs text-[#737D75]">Saldo atual</span>
                    <span className="text-base font-extrabold text-[#142D26]">
                      {formatStockQuantity(product.currentStock, product.unit)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {product.defaultDilution && (
                      <Badge variant="info" size="sm">
                        <Droplet className="w-3 h-3 mr-1" />
                        Diluição {product.defaultDilution}
                      </Badge>
                    )}
                    {product.shelfLife.status !== "OK" && product.shelfLife.label && (
                      <Badge variant="warning" size="sm">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {product.shelfLife.label}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={isOut}
                      onClick={() => onOpenUseModal(product)}
                      leftIcon={<MinusCircle className="w-4 h-4" />}
                    >
                      Pegar / Usar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      disabled={isOut}
                      onClick={() => onOpenLossModal(product)}
                      leftIcon={<ShieldAlert className="w-4 h-4 text-[#DC4C4C]" />}
                    >
                      Perda
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenReportModal(product)}
                    className="w-full py-1.5 text-[11px] font-semibold text-[#737D75] hover:text-[#252B27] inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    Ver últimas retiradas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
