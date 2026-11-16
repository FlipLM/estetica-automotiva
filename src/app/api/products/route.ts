import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, handleAuthError } from "@/lib/permissions";
import { getPeriodDateRange, parseDateInput } from "@/lib/date-utils";
import {
  PRODUCT_UNITS,
  PRODUCT_CATEGORIES,
  getProductShelfLifeStatus,
  roundCurrency,
  roundStockQty,
  roundUnitCost,
  formatStockQuantity,
} from "@/lib/inventory";

const createProductSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres"),
  category: z.enum(PRODUCT_CATEGORIES).default("CHEMICAL"),
  unit: z.enum(PRODUCT_UNITS).default("ML"),
  currentStock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(5),
  costPrice: z.number().min(0).optional(),
  totalPaidInitial: z.number().min(0).optional(),
  supplier: z.string().trim().nullish(),
  purchasedAt: z.string().nullish(),
  packSize: z.number().positive("Tamanho da embalagem deve ser positivo").nullish(),
  packLabel: z.string().trim().max(60).nullish(),
  defaultDilution: z.string().trim().max(40).nullish(),
  daysValidAfterOpen: z.number().int().positive().max(3650).nullish(),
  expirationDate: z.string().nullish(),
  openedAt: z.string().nullish(),
  createExpense: z.boolean().optional(),
  paid: z.boolean().optional(),
  dueDate: z.string().nullish(),
  paymentMethod: z
    .enum(["CASH", "PIX", "DEBIT", "CREDIT", "BOLETO", "TRANSFER", "OTHER"])
    .nullish(),
});

// GET /api/products — Lista produtos ativos, KPIs e alertas de validade/reposição
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const isAdmin = session.role === "ADMIN";
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const expiringOnly = searchParams.get("expiringOnly") === "true";
    const includeArchived = isAdmin && searchParams.get("includeArchived") === "true";
    const period = searchParams.get("period") || "month";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const { startDate: rangeStart, endDate: rangeEnd } = getPeriodDateRange({
      period,
      startDate: startDateParam,
      endDate: endDateParam,
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Busca todos os produtos do tenant para KPIs fidedignos (sem distorção pelo filtro de busca)
    const allTenantProducts = await prisma.product.findMany({
      where: { tenantId: session.tenantId },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { id: true, name: true } },
            serviceOrder: { select: { id: true, orderNumber: true } },
          },
        },
        _count: {
          select: { recipes: true, movements: true },
        },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    const activeProducts = allTenantProducts.filter((p) => p.active);
    const archivedProductsCount = allTenantProducts.length - activeProducts.length;

    // Movimentações no período selecionado (tenant inteiro) para analytics consistentes
    const [periodMovements, monthInMovements] = await Promise.all([
      prisma.stockMovement.findMany({
        where: {
          product: { tenantId: session.tenantId },
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        include: {
          product: { select: { id: true, name: true, unit: true, costPrice: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      isAdmin
        ? prisma.stockMovement.aggregate({
            where: {
              product: { tenantId: session.tenantId },
              type: "IN",
              createdAt: { gte: monthStart, lte: monthEnd },
            },
            _sum: { totalCost: true },
          })
        : Promise.resolve({ _sum: { totalCost: 0 } }),
    ]);

    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;

    for (const p of activeProducts) {
      if (p.currentStock <= 0) {
        outOfStockCount++;
      } else if (p.currentStock <= p.minStock) {
        lowStockCount++;
      }
      const shelf = getProductShelfLifeStatus(p, now);
      if (shelf.status !== "OK") {
        expiringCount++;
      }
      if (isAdmin && p.currentStock > 0) {
        totalStockValue += p.currentStock * p.costPrice;
      }
    }

    // Analytics do período
    let totalSpentInPeriod = 0;
    let totalPurchasedVolume = 0;
    let lossesInPeriod = 0;
    let totalLostQuantity = 0;
    let consumptionInPeriod = 0;
    let recoveriesInPeriod = 0;
    let totalRecoveredQuantity = 0;

    const consumerMap = new Map<
      string,
      { id: string; name: string; unit: string; totalQuantity: number; totalCost: number }
    >();

    for (const m of periodMovements) {
      const mTotal =
        m.totalCost !== null && m.totalCost !== undefined
          ? m.totalCost
          : m.quantity * m.product.costPrice;

      if (m.type === "IN") {
        totalPurchasedVolume += m.quantity;
        if (isAdmin) totalSpentInPeriod += mTotal;
      } else if (m.type === "LOSS") {
        if (m.recovered) {
          totalRecoveredQuantity += m.quantity;
          if (isAdmin) recoveriesInPeriod += mTotal;
        } else {
          totalLostQuantity += m.quantity;
          if (isAdmin) lossesInPeriod += mTotal;
        }
      } else if (m.type === "OUT" || m.type === "OS_CONSUMPTION") {
        if (isAdmin) consumptionInPeriod += mTotal;
        const current = consumerMap.get(m.productId) || {
          id: m.productId,
          name: m.product.name,
          unit: m.product.unit,
          totalQuantity: 0,
          totalCost: 0,
        };
        current.totalQuantity += m.quantity;
        if (isAdmin) current.totalCost += mTotal;
        consumerMap.set(m.productId, current);
      }
    }

    const recentLossAlerts = periodMovements
      .filter((m) => m.type === "LOSS" && !m.recovered)
      .slice(0, 8)
      .map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.product.name,
        unit: m.product.unit,
        quantity: m.quantity,
        totalCost: isAdmin ? roundCurrency(m.totalCost ?? m.quantity * m.product.costPrice) : 0,
        reason: m.reason,
        createdAt: m.createdAt,
      }));

    const topConsumers = Array.from(consumerMap.values())
      .sort((a, b) => (isAdmin ? b.totalCost - a.totalCost : b.totalQuantity - a.totalQuantity))
      .slice(0, 5)
      .map((item) => ({
        ...item,
        totalQuantity: roundStockQty(item.totalQuantity),
        totalCost: isAdmin ? roundCurrency(item.totalCost) : 0,
      }));

    // Filtra produtos para a listagem
    const filteredProducts = allTenantProducts
      .filter((p) => {
        if (!includeArchived && !p.active) return false;
        if (category && category !== "ALL" && p.category !== category) return false;
        if (search) {
          const matchesName = p.name.toLowerCase().includes(search);
          const matchesSupplier = isAdmin && p.supplier?.toLowerCase().includes(search);
          const matchesPack = p.packLabel?.toLowerCase().includes(search);
          if (!matchesName && !matchesSupplier && !matchesPack) return false;
        }
        if (lowStockOnly && p.currentStock > p.minStock) return false;
        if (expiringOnly && getProductShelfLifeStatus(p, now).status === "OK") return false;
        return true;
      })
      .map((p) => {
        const shelfLife = getProductShelfLifeStatus(p, now);
        const lastIn = p.movements.find((m) => m.type === "IN");

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          unit: p.unit,
          currentStock: roundStockQty(p.currentStock),
          minStock: roundStockQty(p.minStock),
          costPrice: isAdmin ? p.costPrice : 0,
          averageUnitCost: isAdmin ? p.costPrice : 0,
          totalStockValue: isAdmin ? roundCurrency(Math.max(0, p.currentStock) * p.costPrice) : 0,
          supplier: isAdmin ? p.supplier : null,
          purchasedAt: isAdmin ? p.purchasedAt : null,
          lastPurchasedAt: isAdmin ? lastIn?.createdAt || p.purchasedAt : null,
          lastPurchaseCost: isAdmin ? lastIn?.unitCost ?? null : null,
          packSize: p.packSize,
          packLabel: p.packLabel,
          defaultDilution: p.defaultDilution,
          openedAt: p.openedAt,
          daysValidAfterOpen: p.daysValidAfterOpen,
          expirationDate: p.expirationDate,
          shelfLife,
          active: p.active,
          recipesCount: p._count.recipes,
          movementsCount: p._count.movements,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          movements: p.movements.map((m) => ({
            id: m.id,
            productId: m.productId,
            type: m.type,
            quantity: m.quantity,
            unitCost: isAdmin ? m.unitCost : null,
            totalCost: isAdmin ? m.totalCost : null,
            reason:
              !isAdmin && m.type === "IN"
                ? "Reposição de estoque"
                : m.reason,
            recovered: m.recovered,
            recoveredAt: m.recoveredAt,
            expenseId: isAdmin ? m.expenseId : null,
            serviceOrderId: m.serviceOrderId,
            serviceOrderNumber: m.serviceOrder?.orderNumber ?? null,
            userName: m.user?.name ?? null,
            createdAt: m.createdAt,
          })),
        };
      });

    return NextResponse.json({
      role: session.role,
      summary: {
        totalProducts: activeProducts.length,
        archivedProductsCount,
        lowStockCount,
        outOfStockCount,
        expiringCount,
        totalStockValue: isAdmin ? roundCurrency(totalStockValue) : 0,
        totalInvestedMonth: isAdmin ? roundCurrency(monthInMovements._sum.totalCost || 0) : 0,
        totalSpentInPeriod: isAdmin ? roundCurrency(totalSpentInPeriod) : 0,
        lossesInPeriod: isAdmin ? roundCurrency(lossesInPeriod) : 0,
        consumptionInPeriod: isAdmin ? roundCurrency(consumptionInPeriod) : 0,
        recoveriesInPeriod: isAdmin ? roundCurrency(recoveriesInPeriod) : 0,
      },
      analytics: {
        totalPurchasedVolume: roundStockQty(totalPurchasedVolume),
        totalPurchasedValue: isAdmin ? roundCurrency(totalSpentInPeriod) : 0,
        totalLostQuantity: roundStockQty(totalLostQuantity),
        totalLostValue: isAdmin ? roundCurrency(lossesInPeriod) : 0,
        totalRecoveredQuantity: roundStockQty(totalRecoveredQuantity),
        totalRecoveredValue: isAdmin ? roundCurrency(recoveriesInPeriod) : 0,
        topConsumers,
        recentLossAlerts,
      },
      products: filteredProducts,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/products — Cadastra novo produto com suporte a embalagem, validade e despesa inicial (Somente ADMIN)
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const validated = createProductSchema.parse(body);

    const purchaseDate = validated.purchasedAt
      ? parseDateInput(validated.purchasedAt)
      : new Date();
    if (!purchaseDate || Number.isNaN(purchaseDate.getTime())) {
      return NextResponse.json(
        { error: "Data da compra inválida." },
        { status: 400 }
      );
    }

    const parsedExpiration = validated.expirationDate
      ? parseDateInput(validated.expirationDate)
      : null;
    if (validated.expirationDate && !parsedExpiration) {
      return NextResponse.json(
        { error: "Data de validade inválida." },
        { status: 400 }
      );
    }

    const parsedOpenedAt = validated.openedAt
      ? parseDateInput(validated.openedAt)
      : null;
    if (validated.openedAt && !parsedOpenedAt) {
      return NextResponse.json(
        { error: "Data de abertura inválida." },
        { status: 400 }
      );
    }

    const isPaid = validated.paid ?? true;
    const parsedDueDate = validated.dueDate
      ? parseDateInput(validated.dueDate)
      : purchaseDate;
    if (validated.dueDate && !parsedDueDate) {
      return NextResponse.json(
        { error: "Data de vencimento inválida." },
        { status: 400 }
      );
    }

    const initialStock = roundStockQty(validated.currentStock);
    let unitCost = 0;
    let initialTotalCost = 0;

    if (
      validated.totalPaidInitial !== undefined &&
      validated.totalPaidInitial > 0 &&
      initialStock > 0
    ) {
      initialTotalCost = roundCurrency(validated.totalPaidInitial);
      unitCost = roundUnitCost(initialTotalCost / initialStock);
    } else if (validated.costPrice !== undefined && validated.costPrice > 0) {
      unitCost = roundUnitCost(validated.costPrice);
      initialTotalCost = roundCurrency(unitCost * initialStock);
    }

    const cleanSupplier = validated.supplier?.trim() || null;
    const shouldCreateExpense =
      (validated.createExpense ?? true) && initialStock > 0 && initialTotalCost > 0;

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId: session.tenantId,
          name: validated.name,
          category: validated.category,
          unit: validated.unit,
          currentStock: initialStock,
          minStock: roundStockQty(validated.minStock),
          costPrice: unitCost,
          supplier: cleanSupplier,
          purchasedAt: initialStock > 0 || validated.purchasedAt ? purchaseDate : null,
          packSize: validated.packSize ?? null,
          packLabel: validated.packLabel?.trim() || null,
          defaultDilution: validated.defaultDilution?.trim() || null,
          daysValidAfterOpen: validated.daysValidAfterOpen ?? null,
          expirationDate: parsedExpiration,
          openedAt: parsedOpenedAt,
          active: true,
        },
      });

      let expenseId: string | null = null;
      if (shouldCreateExpense) {
        const exp = await tx.expense.create({
          data: {
            tenantId: session.tenantId,
            category: "PRODUCTS",
            description: `Compra inicial: ${product.name} (${formatStockQuantity(initialStock, product.unit)})`,
            amount: initialTotalCost,
            dueDate: parsedDueDate || purchaseDate,
            paid: isPaid,
            paidAt: isPaid ? purchaseDate : null,
            paymentMethod: validated.paymentMethod || (isPaid ? "PIX" : "BOLETO"),
            supplier: cleanSupplier,
            notes: cleanSupplier
              ? `Fornecedor: ${cleanSupplier}`
              : "Entrada inicial de cadastro no estoque",
          },
        });
        expenseId = exp.id;
      }

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            userId: session.userId,
            type: "IN",
            quantity: initialStock,
            unitCost,
            totalCost: initialTotalCost,
            expenseId,
            createdAt: purchaseDate,
            reason: cleanSupplier
              ? `Cadastro inicial — Fornecedor: ${cleanSupplier}`
              : "Saldo inicial do cadastro",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "CREATE_PRODUCT",
          entity: "Product",
          entityId: product.id,
          details: JSON.stringify({
            name: product.name,
            category: product.category,
            unit: product.unit,
            currentStock: product.currentStock,
            costPrice: product.costPrice,
            expenseId,
          }),
        },
      });

      return product;
    });

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return handleAuthError(error);
  }
}
