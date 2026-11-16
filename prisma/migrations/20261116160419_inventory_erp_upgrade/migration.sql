-- AlterTable
ALTER TABLE "products" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "daysValidAfterOpen" INTEGER,
ADD COLUMN     "defaultDilution" TEXT,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "openedAt" TIMESTAMP(3),
ADD COLUMN     "packLabel" TEXT,
ADD COLUMN     "packSize" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "serviceOrderId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "service_product_recipes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityPerService" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_product_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_product_recipes_tenantId_idx" ON "service_product_recipes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "service_product_recipes_serviceId_productId_key" ON "service_product_recipes"("serviceId", "productId");

-- CreateIndex
CREATE INDEX "products_tenantId_active_idx" ON "products"("tenantId", "active");

-- CreateIndex
CREATE INDEX "stock_movements_productId_type_createdAt_idx" ON "stock_movements"("productId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_serviceOrderId_idx" ON "stock_movements"("serviceOrderId");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_product_recipes" ADD CONSTRAINT "service_product_recipes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_product_recipes" ADD CONSTRAINT "service_product_recipes_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_product_recipes" ADD CONSTRAINT "service_product_recipes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
