"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ConfirmationDialog,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import { formatDateInputValue } from "@/lib/date-utils";
import { AdminInventoryView } from "@/components/modules/estoque/admin-inventory-view";
import {
  EditMovementModal,
  StockMovementModal,
  type MovementModalMode,
} from "@/components/modules/estoque/movement-modals";
import { OperatorBayView } from "@/components/modules/estoque/operator-bay-view";
import { ProductFormModal } from "@/components/modules/estoque/product-form-modal";
import { ProductReportModal } from "@/components/modules/estoque/product-report-modal";
import { ShoppingListModal } from "@/components/modules/estoque/shopping-list-modal";
import type {
  ActiveOrderOption,
  InventoryAnalytics,
  InventoryProduct,
  InventorySummary,
  ProductMovementItem,
} from "@/components/modules/estoque/types";

const EMPTY_SUMMARY: InventorySummary = {
  totalProducts: 0,
  archivedProductsCount: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  expiringCount: 0,
  totalStockValue: 0,
  totalInvestedMonth: 0,
  totalSpentInPeriod: 0,
  lossesInPeriod: 0,
  consumptionInPeriod: 0,
  recoveriesInPeriod: 0,
};

const EMPTY_ANALYTICS: InventoryAnalytics = {
  totalPurchasedVolume: 0,
  totalPurchasedValue: 0,
  totalLostQuantity: 0,
  totalLostValue: 0,
  totalRecoveredQuantity: 0,
  totalRecoveredValue: 0,
  topConsumers: [],
  recentLossAlerts: [],
};

export default function EstoquePage() {
  const [role, setRole] = useState<"ADMIN" | "OPERATOR">("OPERATOR");
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(EMPTY_SUMMARY);
  const [analytics, setAnalytics] = useState<InventoryAnalytics>(EMPTY_ANALYTICS);
  const [activeOrders, setActiveOrders] = useState<ActiveOrderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [period, setPeriod] = useState("month");
  const [customStartDate, setCustomStartDate] = useState(() =>
    formatDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [customEndDate, setCustomEndDate] = useState(() =>
    formatDateInputValue(new Date())
  );
  const [movementsRefreshKey, setMovementsRefreshKey] = useState(0);

  // Modais
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(
    null
  );
  const [movementModal, setMovementModal] = useState<{
    product: InventoryProduct | null;
    mode: MovementModalMode;
  }>({ product: null, mode: "OUT" });
  const [reportProductId, setReportProductId] = useState<string | null>(null);
  const [editMovementState, setEditMovementState] = useState<{
    movement: ProductMovementItem | null;
    productName: string;
    productUnit: string;
  }>({ movement: null, productName: "", productUnit: "ML" });
  const [shoppingListOpen, setShoppingListOpen] = useState(false);

  // Confirmações seguras via ConfirmationDialog
  const [deletingProduct, setDeletingProduct] =
    useState<InventoryProduct | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [recoverTarget, setRecoverTarget] = useState<{
    productId: string;
    movementId: string;
  } | null>(null);
  const [recoverLoading, setRecoverLoading] = useState(false);

  const isAdmin = role === "ADMIN";

  const loadInventory = useCallback(
    async (overrides?: { search?: string }) => {
      try {
        const querySearch =
          overrides?.search !== undefined ? overrides.search : search;
        const params = new URLSearchParams({
          category,
          period,
          lowStock: String(lowStockOnly),
          expiringOnly: String(expiringOnly),
          includeArchived: String(includeArchived),
        });
        if (querySearch.trim()) params.set("search", querySearch.trim());
        if (period === "custom" && customStartDate && customEndDate) {
          params.set("startDate", customStartDate);
          params.set("endDate", customEndDate);
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Erro ao carregar estoque.");
        }

        if (data.role === "ADMIN" || data.role === "OPERATOR") {
          setRole(data.role);
        }
        setProducts(data.products || []);
        setSummary(data.summary || EMPTY_SUMMARY);
        setAnalytics(data.analytics || EMPTY_ANALYTICS);
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Erro ao carregar estoque.",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      category,
      period,
      lowStockOnly,
      expiringOnly,
      includeArchived,
      customStartDate,
      customEndDate,
    ]
  );

  const loadActiveOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) return;
      const data = await res.json();
      const options: ActiveOrderOption[] = (data.orders || [])
        .filter(
          (o: { status: string }) =>
            o.status === "TODO" || o.status === "IN_PROGRESS"
        )
        .slice(0, 30)
        .map(
          (o: {
            id: string;
            orderNumber: number;
            status: string;
            vehicle?: { model?: string; plate?: string; customer?: { name?: string } };
          }) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            vehicleLabel: o.vehicle
              ? `${o.vehicle.model || "Veículo"} (${o.vehicle.plate || ""})`
              : "Veículo",
            customerName: o.vehicle?.customer?.name ?? null,
          })
        );
      setActiveOrders(options);
    } catch {
      // OS opcional no modal de saída
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory();
    }, 180);
    return () => clearTimeout(timer);
  }, [loadInventory]);

  useEffect(() => {
    loadActiveOrders();
  }, [loadActiveOrders]);

  function handleSuccessRefresh(message: string) {
    setFeedback({ type: "success", text: message });
    setMovementsRefreshKey((k) => k + 1);
    loadInventory();
  }

  async function handleConfirmDeleteProduct() {
    if (!deletingProduct) return;
    setDeletingLoading(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Não foi possível remover o produto.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: data.message || "Produto atualizado com sucesso.",
      });
      setDeletingProduct(null);
      await loadInventory();
    } catch {
      setFeedback({
        type: "error",
        text: "Falha de conexão ao arquivar/excluir produto.",
      });
    } finally {
      setDeletingLoading(false);
    }
  }

  async function handleConfirmRecoverLoss() {
    if (!recoverTarget) return;
    setRecoverLoading(true);
    try {
      const res = await fetch(`/api/products/${recoverTarget.productId}/movement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECOVER_LOSS",
          movementId: recoverTarget.movementId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Não foi possível recuperar esta perda.",
        });
        return;
      }
      setRecoverTarget(null);
      handleSuccessRefresh("Item recuperado e devolvido ao saldo em estoque.");
    } catch {
      setFeedback({
        type: "error",
        text: "Falha de conexão ao recuperar item perdido.",
      });
    } finally {
      setRecoverLoading(false);
    }
  }

  async function handleOpenBottle(product: InventoryProduct) {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "OPEN_BOTTLE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Erro ao registrar abertura do frasco.",
        });
        return;
      }
      handleSuccessRefresh(
        `Abertura de "${product.name}" registrada. Contagem de Pot-Life iniciada.`
      );
    } catch {
      setFeedback({
        type: "error",
        text: "Falha de conexão ao marcar abertura do frasco.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Estoque & Insumos"
        description={
          isAdmin
            ? "Gestão de químicos, custo médio ponderado, compras integradas ao financeiro e fichas técnicas."
            : "Retirada rápida de insumos, cálculo de diluição e registro de perdas no pátio."
        }
      />

      {feedback && (
        <Alert variant={feedback.type === "success" ? "success" : "error"}>
          <div className="flex items-center justify-between gap-3">
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs underline cursor-pointer shrink-0"
            >
              Fechar
            </button>
          </div>
        </Alert>
      )}

      {loading ? (
        <LoadingState message="Carregando estoque e alertas da oficina..." />
      ) : isAdmin ? (
        <AdminInventoryView
          products={products}
          summary={summary}
          analytics={analytics}
          search={search}
          onSearchChange={setSearch}
          onSearchClear={() => {
            setSearch("");
            loadInventory({ search: "" });
          }}
          category={category}
          onCategoryChange={setCategory}
          lowStockOnly={lowStockOnly}
          onLowStockOnlyChange={setLowStockOnly}
          expiringOnly={expiringOnly}
          onExpiringOnlyChange={setExpiringOnly}
          includeArchived={includeArchived}
          onIncludeArchivedChange={setIncludeArchived}
          period={period}
          onPeriodChange={setPeriod}
          customStartDate={customStartDate}
          onCustomStartDateChange={setCustomStartDate}
          customEndDate={customEndDate}
          onCustomEndDateChange={setCustomEndDate}
          onOpenCreateProduct={() => {
            setEditingProduct(null);
            setProductModalOpen(true);
          }}
          onOpenEditProduct={(p) => {
            setEditingProduct(p);
            setProductModalOpen(true);
          }}
          onRequestDeleteProduct={setDeletingProduct}
          onOpenMovementModal={(product, mode) =>
            setMovementModal({ product, mode })
          }
          onOpenReportModal={(p) => setReportProductId(p.id)}
          onOpenBottle={handleOpenBottle}
          onOpenShoppingList={() => setShoppingListOpen(true)}
          onRequestRecoverLoss={(productId, movementId) =>
            setRecoverTarget({ productId, movementId })
          }
          movementsRefreshKey={movementsRefreshKey}
        />
      ) : (
        <OperatorBayView
          products={products}
          summary={summary}
          search={search}
          onSearchChange={setSearch}
          onSearchClear={() => {
            setSearch("");
            loadInventory({ search: "" });
          }}
          category={category}
          onCategoryChange={setCategory}
          onOpenUseModal={(p) => setMovementModal({ product: p, mode: "OUT" })}
          onOpenLossModal={(p) => setMovementModal({ product: p, mode: "LOSS" })}
          onOpenReportModal={(p) => setReportProductId(p.id)}
        />
      )}

      {/* Modais */}
      {isAdmin && (
        <ProductFormModal
          isOpen={productModalOpen}
          editingProduct={editingProduct}
          onClose={() => setProductModalOpen(false)}
          onSaved={handleSuccessRefresh}
        />
      )}

      <StockMovementModal
        isOpen={!!movementModal.product}
        product={movementModal.product}
        mode={movementModal.mode}
        isAdmin={isAdmin}
        activeOrders={activeOrders}
        onClose={() => setMovementModal({ product: null, mode: "OUT" })}
        onSuccess={handleSuccessRefresh}
      />

      <ProductReportModal
        isOpen={!!reportProductId}
        productId={reportProductId}
        isAdmin={isAdmin}
        onClose={() => setReportProductId(null)}
        onRecoverLoss={(productId, movementId) =>
          setRecoverTarget({ productId, movementId })
        }
        onEditMovement={(movement, productName, productUnit) =>
          setEditMovementState({ movement, productName, productUnit })
        }
        onRefreshList={() => loadInventory()}
      />

      {isAdmin && (
        <>
          <EditMovementModal
            isOpen={!!editMovementState.movement}
            movement={editMovementState.movement}
            productName={editMovementState.productName}
            productUnit={editMovementState.productUnit}
            onClose={() =>
              setEditMovementState({
                movement: null,
                productName: "",
                productUnit: "ML",
              })
            }
            onSuccess={(msg) => {
              handleSuccessRefresh(msg);
              setReportProductId((prev) => prev);
            }}
          />

          <ShoppingListModal
            isOpen={shoppingListOpen}
            products={products}
            onClose={() => setShoppingListOpen(false)}
          />
        </>
      )}

      <ConfirmationDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDeleteProduct}
        title={
          deletingProduct && deletingProduct.movementsCount > 0
            ? `Arquivar "${deletingProduct.name}"?`
            : `Excluir "${deletingProduct?.name}"?`
        }
        description={
          deletingProduct && deletingProduct.movementsCount > 0
            ? "Este produto já possui movimentações ou fichas vinculadas. Ele será arquivado para preservar todo o histórico contábil e suas despesas financeiras."
            : "Este produto não possui movimentações registradas e será removido permanentemente."
        }
        confirmLabel={
          deletingProduct && deletingProduct.movementsCount > 0
            ? "Arquivar Produto"
            : "Excluir Produto"
        }
        destructive
        loading={deletingLoading}
      />

      <ConfirmationDialog
        isOpen={!!recoverTarget}
        onClose={() => setRecoverTarget(null)}
        onConfirm={handleConfirmRecoverLoss}
        title="Recuperar item perdido para o estoque?"
        description="A quantidade registrada como perda será reintegrada automaticamente ao saldo disponível deste produto."
        confirmLabel="Confirmar Recuperação"
        loading={recoverLoading}
      />
    </div>
  );
}
