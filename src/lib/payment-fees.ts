export type PaymentMethodType =
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CASH"
  | "TRANSFER";

export interface TenantCardFeeRates {
  debitFeeRate?: number | null;
  credit1xFeeRate?: number | null;
  credit2to6FeeRate?: number | null;
  credit7to12FeeRate?: number | null;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Resolve a taxa percentual (MDR) da maquininha com base no método e parcelas.
 * PIX, Dinheiro e Transferência possuem taxa padrão 0%.
 */
export function resolveDefaultFeeRate({
  method,
  installments = 1,
  tenantRates,
}: {
  method: PaymentMethodType | string;
  installments?: number;
  tenantRates?: TenantCardFeeRates | null;
}): number {
  if (!tenantRates) return 0;

  if (method === "DEBIT_CARD") {
    return Math.max(0, tenantRates.debitFeeRate ?? 0);
  }

  if (method === "CREDIT_CARD") {
    const qty = Math.max(1, Math.min(12, Math.floor(installments || 1)));
    if (qty === 1) {
      return Math.max(0, tenantRates.credit1xFeeRate ?? 0);
    }
    if (qty <= 6) {
      return Math.max(0, tenantRates.credit2to6FeeRate ?? 0);
    }
    return Math.max(0, tenantRates.credit7to12FeeRate ?? 0);
  }

  return 0;
}

/**
 * Calcula taxa percentual, valor da taxa em R$ e valor líquido recebido.
 */
export function calculatePaymentFeeBreakdown({
  amount,
  method,
  installments = 1,
  overrideFeeRate,
  tenantRates,
}: {
  amount: number;
  method: PaymentMethodType | string;
  installments?: number;
  overrideFeeRate?: number | null;
  tenantRates?: TenantCardFeeRates | null;
}): {
  installments: number;
  feeRate: number;
  feeAmount: number;
  netAmount: number;
} {
  const safeInstallments =
    method === "CREDIT_CARD"
      ? Math.max(1, Math.min(12, Math.floor(installments || 1)))
      : 1;

  const feeRate =
    overrideFeeRate !== undefined && overrideFeeRate !== null
      ? Math.max(0, Math.min(100, overrideFeeRate))
      : resolveDefaultFeeRate({
          method,
          installments: safeInstallments,
          tenantRates,
        });

  const feeAmount = roundMoney((amount * feeRate) / 100);
  const netAmount = roundMoney(Math.max(0, amount - feeAmount));

  return {
    installments: safeInstallments,
    feeRate,
    feeAmount,
    netAmount,
  };
}
