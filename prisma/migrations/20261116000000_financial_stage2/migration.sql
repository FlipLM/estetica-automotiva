-- AlterTable: tenants (taxas de maquininha)
ALTER TABLE "tenants"
  ADD COLUMN "debitFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  ADD COLUMN "credit1xFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  ADD COLUMN "credit2to6FeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  ADD COLUMN "credit7to12FeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable: payments (parcelamento e taxa MDR)
ALTER TABLE "payments"
  ADD COLUMN "installments" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "feeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  ADD COLUMN "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  ADD COLUMN "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- Backfill seguro para pagamentos existentes
UPDATE "payments"
SET "netAmount" = "amount"
WHERE "netAmount" = 0.0 AND "amount" > 0.0;

-- AlterTable: expenses (fornecedor, parcelamento e recorrência)
ALTER TABLE "expenses"
  ADD COLUMN "supplier" TEXT,
  ADD COLUMN "recurrenceGroupId" TEXT,
  ADD COLUMN "recurrenceType" TEXT NOT NULL DEFAULT 'SINGLE',
  ADD COLUMN "installmentNumber" INTEGER,
  ADD COLUMN "totalInstallments" INTEGER;

-- CreateIndex
CREATE INDEX "expenses_tenantId_recurrenceGroupId_idx" ON "expenses"("tenantId", "recurrenceGroupId");
