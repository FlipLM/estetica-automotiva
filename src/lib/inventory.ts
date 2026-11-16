/**
 * Helpers compartilhados de Engenharia de Estoque e Estética Automotiva (Vulpto).
 * Custo Médio Móvel, conversões seguras de unidades, diluição química e validade/pot-life.
 */

export const PRODUCT_UNITS = ["ML", "L", "G", "KG", "UN", "M", "M2"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const PRODUCT_CATEGORIES = ["CHEMICAL", "ACCESSORY", "TOOL"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const MOVEMENT_TYPES = [
  "IN",
  "OUT",
  "LOSS",
  "OS_CONSUMPTION",
  "ADJUSTMENT",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const UNIT_LABELS: Record<ProductUnit, string> = {
  ML: "ml",
  L: "L",
  G: "g",
  KG: "kg",
  UN: "un",
  M: "m",
  M2: "m²",
};

export const UNIT_FULL_LABELS: Record<ProductUnit, string> = {
  ML: "Mililitros (ml)",
  L: "Litros (L)",
  G: "Gramas (g)",
  KG: "Quilogramas (kg)",
  UN: "Unidades (un)",
  M: "Metros lineares (m)",
  M2: "Metros quadrados (m²)",
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  CHEMICAL: "Químico / Produto",
  ACCESSORY: "Acessório / Aplicador",
  TOOL: "Equipamento / Ferramenta",
};

export function roundStockQty(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function roundUnitCost(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round((value + Number.EPSILON) * 100000) / 100000;
}

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula o Custo Médio Ponderado Móvel após uma entrada (`IN`).
 * Quando o estoque atual é <= 0, o novo custo médio passa a ser o custo da compra atual.
 */
export function calculateMovingAverageCost(params: {
  currentStock: number;
  currentCostPrice: number;
  incomingQty: number;
  incomingTotalCost: number;
}): number {
  const { currentStock, currentCostPrice, incomingQty, incomingTotalCost } = params;
  if (incomingQty <= 0) return roundUnitCost(currentCostPrice);

  const safeCurrentStock = Math.max(0, currentStock);
  const safeCurrentCost = Math.max(0, currentCostPrice);
  const safeTotalCost = Math.max(0, incomingTotalCost);

  if (safeCurrentStock <= 0) {
    return roundUnitCost(safeTotalCost / incomingQty);
  }

  const totalInventoryValue = safeCurrentStock * safeCurrentCost + safeTotalCost;
  const totalQuantity = safeCurrentStock + incomingQty;
  if (totalQuantity <= 0) return 0;

  return roundUnitCost(totalInventoryValue / totalQuantity);
}

/**
 * Converte quantidades e custo unitário entre unidades compatíveis (ML <-> L, G <-> KG).
 * Retorna `null` se as unidades pertencem a dimensões incompatíveis (ex: ML -> UN, M -> M2).
 */
export function getUnitConversionFactor(
  fromUnit: string,
  toUnit: string
): number | null {
  if (fromUnit === toUnit) return 1;
  if (fromUnit === "ML" && toUnit === "L") return 0.001;
  if (fromUnit === "L" && toUnit === "ML") return 1000;
  if (fromUnit === "G" && toUnit === "KG") return 0.001;
  if (fromUnit === "KG" && toUnit === "G") return 1000;
  return null;
}

export function isDecimalUnit(unit: string): boolean {
  return unit === "ML" || unit === "L" || unit === "G" || unit === "KG" || unit === "M" || unit === "M2";
}

export function formatStockQuantity(qty: number, unit: string): string {
  const label = UNIT_LABELS[unit as ProductUnit] || unit.toLowerCase();
  const safe = Number.isFinite(qty) ? qty : 0;
  if (unit === "UN") {
    const formatted = Number.isInteger(safe) ? String(safe) : safe.toFixed(1).replace(".", ",");
    return `${formatted} ${label}`;
  }
  const formatted =
    Math.abs(safe - Math.round(safe)) < 0.001
      ? Math.round(safe).toLocaleString("pt-BR")
      : safe.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return `${formatted} ${label}`;
}

/**
 * Interpreta strings de diluição como "1:10", "1:50", "1/20" e retorna a proporção total.
 * Ex: "1:10" => 1 parte de produto + 10 partes de água = ratio 10 (totalParts = 11).
 */
export function parseDilutionRatio(raw?: string | null): number | null {
  if (!raw) return null;
  const match = raw.trim().match(/^1\s*[:/]\s*(\d+(?:[.,]\d+)?)$/);
  if (!match) return null;
  const ratio = Number(match[1].replace(",", "."));
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  return ratio;
}

/**
 * Calcula quantos mL (ou g) de produto concentrado e água são necessários para preparar
 * um borrifador/recipiente de `containerVolumeMl` na diluição `1:ratio`.
 */
export function computeConcentrateFromDilution(params: {
  containerVolume: number;
  ratio: number;
}): { concentrateAmount: number; waterAmount: number } {
  const { containerVolume, ratio } = params;
  if (!Number.isFinite(containerVolume) || containerVolume <= 0 || !Number.isFinite(ratio) || ratio <= 0) {
    return { concentrateAmount: 0, waterAmount: 0 };
  }
  const totalParts = ratio + 1;
  const concentrateAmount = Math.round((containerVolume / totalParts) * 10) / 10;
  const waterAmount = Math.round((containerVolume - concentrateAmount) * 10) / 10;
  return { concentrateAmount, waterAmount };
}

export interface ShelfLifeStatus {
  status: "OK" | "EXPIRING_SOON" | "EXPIRED" | "POT_LIFE_SOON" | "POT_LIFE_EXPIRED";
  label: string | null;
  daysRemaining: number | null;
  potLifeDeadline: Date | null;
}

/**
 * Avalia validade fechada e pot-life após aberto (vitrificadores, selantes, catalisadores).
 */
export function getProductShelfLifeStatus(product: {
  expirationDate?: Date | string | null;
  openedAt?: Date | string | null;
  daysValidAfterOpen?: number | null;
}, referenceDate: Date = new Date()): ShelfLifeStatus {
  const msPerDay = 1000 * 60 * 60 * 24;

  let potLifeDeadline: Date | null = null;
  let potLifeDaysLeft: number | null = null;

  if (product.openedAt && product.daysValidAfterOpen && product.daysValidAfterOpen > 0) {
    const opened = new Date(product.openedAt);
    if (!Number.isNaN(opened.getTime())) {
      potLifeDeadline = new Date(opened.getTime() + product.daysValidAfterOpen * msPerDay);
      potLifeDaysLeft = Math.ceil((potLifeDeadline.getTime() - referenceDate.getTime()) / msPerDay);
    }
  }

  let closedDaysLeft: number | null = null;
  if (product.expirationDate) {
    const exp = new Date(product.expirationDate);
    if (!Number.isNaN(exp.getTime())) {
      closedDaysLeft = Math.ceil((exp.getTime() - referenceDate.getTime()) / msPerDay);
    }
  }

  if (potLifeDaysLeft !== null && potLifeDaysLeft <= 0) {
    return {
      status: "POT_LIFE_EXPIRED",
      label: `Frasco aberto vencido há ${Math.abs(potLifeDaysLeft)}d`,
      daysRemaining: potLifeDaysLeft,
      potLifeDeadline,
    };
  }

  if (closedDaysLeft !== null && closedDaysLeft <= 0) {
    return {
      status: "EXPIRED",
      label: `Validade vencida há ${Math.abs(closedDaysLeft)}d`,
      daysRemaining: closedDaysLeft,
      potLifeDeadline,
    };
  }

  if (potLifeDaysLeft !== null && potLifeDaysLeft <= 10) {
    return {
      status: "POT_LIFE_SOON",
      label: `Frasco aberto vence em ${potLifeDaysLeft}d`,
      daysRemaining: potLifeDaysLeft,
      potLifeDeadline,
    };
  }

  if (closedDaysLeft !== null && closedDaysLeft <= 30) {
    return {
      status: "EXPIRING_SOON",
      label: `Validade em ${closedDaysLeft}d`,
      daysRemaining: closedDaysLeft,
      potLifeDeadline,
    };
  }

  const effectiveDays =
    potLifeDaysLeft !== null && closedDaysLeft !== null
      ? Math.min(potLifeDaysLeft, closedDaysLeft)
      : potLifeDaysLeft ?? closedDaysLeft;

  return {
    status: "OK",
    label: null,
    daysRemaining: effectiveDays,
    potLifeDeadline,
  };
}
