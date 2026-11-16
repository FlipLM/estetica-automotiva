-- AlterTable: tenants (link oficial do Google Avaliações)
ALTER TABLE "tenants"
  ADD COLUMN "googleReviewUrl" TEXT;

-- AlterTable: services (ciclo sugerido de manutenção/retorno em dias)
ALTER TABLE "services"
  ADD COLUMN "maintenanceIntervalDays" INTEGER;

-- CreateTable: crm_contact_logs (anti-spam, adiamento e atribuição de ROI no CRM)
CREATE TABLE "crm_contact_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "serviceOrderId" TEXT,
    "userId" TEXT,
    "campaign" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'SENT',
    "message" TEXT,
    "snoozeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_contact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_contact_logs_tenantId_customerId_createdAt_idx" ON "crm_contact_logs"("tenantId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "crm_contact_logs_tenantId_campaign_createdAt_idx" ON "crm_contact_logs"("tenantId", "campaign", "createdAt");

-- AddForeignKey
ALTER TABLE "crm_contact_logs" ADD CONSTRAINT "crm_contact_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contact_logs" ADD CONSTRAINT "crm_contact_logs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contact_logs" ADD CONSTRAINT "crm_contact_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contact_logs" ADD CONSTRAINT "crm_contact_logs_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contact_logs" ADD CONSTRAINT "crm_contact_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
