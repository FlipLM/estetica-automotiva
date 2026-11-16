export type ProductCategory = "CHEMICAL" | "ACCESSORY" | "TOOL";
export type ProductUnit = "ML" | "L" | "G" | "KG" | "UN" | "M" | "M2";
export type MovementType = "IN" | "OUT" | "LOSS" | "OS_CONSUMPTION" | "ADJUSTMENT";

export interface ShelfLifeInfo {
  status:
    | "OK"
    | "EXPIRING_SOON"
    | "EXPIRED"
    | "POT_LIFE_SOON"
    | "POT_LIFE_EXPIRED";
  label: string | null;
  daysRemaining: number | null;
  potLifeDeadline: string | null;
}

export interface ProductMovementItem {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  reason?: string | null;
  recovered: boolean;
  recoveredAt?: string | null;
  expenseId?: string | null;
  serviceOrderId?: string | null;
  serviceOrderNumber?: number | null;
  vehicleLabel?: string | null;
  userName?: string | null;
  createdAt: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  currentStock: number;
  minStock: number;
  costPrice: number;
  averageUnitCost: number;
  totalStockValue: number;
  supplier?: string | null;
  purchasedAt?: string | null;
  lastPurchasedAt?: string | null;
  lastPurchaseCost?: number | null;
  packSize?: number | null;
  packLabel?: string | null;
  defaultDilution?: string | null;
  openedAt?: string | null;
  daysValidAfterOpen?: number | null;
  expirationDate?: string | null;
  shelfLife: ShelfLifeInfo;
  active: boolean;
  recipesCount: number;
  movementsCount: number;
  createdAt: string;
  updatedAt: string;
  movements: ProductMovementItem[];
}

export interface InventorySummary {
  totalProducts: number;
  archivedProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  totalStockValue: number;
  totalInvestedMonth: number;
  totalSpentInPeriod: number;
  lossesInPeriod: number;
  consumptionInPeriod: number;
  recoveriesInPeriod: number;
}

export interface InventoryAnalytics {
  totalPurchasedVolume: number;
  totalPurchasedValue: number;
  totalLostQuantity: number;
  totalLostValue: number;
  totalRecoveredQuantity: number;
  totalRecoveredValue: number;
  topConsumers: Array<{
    id: string;
    name: string;
    unit: string;
    totalQuantity: number;
    totalCost: number;
  }>;
  recentLossAlerts: Array<{
    id: string;
    productId: string;
    productName: string;
    unit: string;
    quantity: number;
    totalCost: number;
    reason?: string | null;
    createdAt: string;
  }>;
}

export interface PaginatedMovementRow extends ProductMovementItem {
  productName: string;
  productUnit: ProductUnit;
  productCategory: ProductCategory;
}

export interface ActiveOrderOption {
  id: string;
  orderNumber: number;
  status: string;
  vehicleLabel: string;
  customerName?: string | null;
}
