import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, handleAuthError } from "@/lib/permissions";
import { parseDateInput } from "@/lib/date-utils";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  getProductShelfLifeStatus,
  getUnitConversionFactor,
  roundCurrency,
  roundStockQty,
  roundUnitCost,
} from "@/lib/inventory";

const updateProductSchema = z.object({
  action: z.enum(["OPEN_BOTTLE", "RESET_OPENED"]).optional(),
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  unit: z.enum(PRODUCT_UNITS).optional(),
  minStock: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  supplier: z.string().trim().nullable().optional(),
  purchasedAt: z.string().nullish(),
  packSize: z.number().positive("Tamanho da embalagem deve ser positivo").nullable().optional(),
  packLabel: z.string().trim().max(60).nullable().optional(),
  defaultDilution: z.string().trim().max(40).nullable().optional(),
  daysValidAfterOpen: z.number().int().positive().max(3650).nullable().optional(),
  expirationDate: z.string().nullish(),
  openedAt: z.string().nullish(),
  active: z.boolean().optional(),
});

// GET /api/products/[id] — Detalhes do produto e histórico recente (com mascaramento RBAC para OPERATOR)
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const isAdmin = session.role === "ADMIN";

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        tenantId: session.tenantId,
      },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: { select: { id: true, name: true } },
            serviceOrder: {
              select: {
                id: true,
                orderNumber: true,
                vehicle: { select: { plate: true, model: true } },
              },
            },
          },
        },
        recipes: {
          include: {
            service: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const shelfLife = getProductShelfLifeStatus(product);

    return NextResponse.json({
      role: session.role,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        currentStock: roundStockQty(product.currentStock),
        minStock: roundStockQty(product.minStock),
        costPrice: isAdmin ? product.costPrice : 0,
        averageUnitCost: isAdmin ? product.costPrice : 0,
        totalStockValue: isAdmin
          ? roundCurrency(Math.max(0, product.currentStock) * product.costPrice)
          : 0,
        supplier: isAdmin ? product.supplier : null,
        purchasedAt: isAdmin ? product.purchasedAt : null,
        packSize: product.packSize,
        packLabel: product.packLabel,
        defaultDilution: product.defaultDilution,
        openedAt: product.openedAt,
        daysValidAfterOpen: product.daysValidAfterOpen,
        expirationDate: product.expirationDate,
        shelfLife,
        active: product.active,
        recipes: product.recipes.map((r) => ({
          id: r.id,
          serviceId: r.serviceId,
          serviceName: r.service.name,
          quantityPerService: r.quantityPerService,
          notes: r.notes,
        })),
        movements: product.movements.map((m) => ({
          id: m.id,
          productId: m.productId,
          type: m.type,
          quantity: m.quantity,
          unitCost: isAdmin ? m.unitCost : null,
          totalCost: isAdmin ? m.totalCost : null,
          reason: !isAdmin && m.type === "IN" ? "Reposição de estoque" : m.reason,
          recovered: m.recovered,
          recoveredAt: m.recoveredAt,
          expenseId: isAdmin ? m.expenseId : null,
          serviceOrderId: m.serviceOrderId,
          serviceOrderNumber: m.serviceOrder?.orderNumber ?? null,
          vehicleLabel: m.serviceOrder?.vehicle
            ? `${m.serviceOrder.vehicle.model} (${m.serviceOrder.vehicle.plate})`
            : null,
          userName: m.user?.name ?? null,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT /api/products/[id] — Atualiza ficha do produto, marca abertura de frasco ou converte unidade (Somente ADMIN)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const validated = updateProductSchema.parse(body);

    const existing = await prisma.product.findFirst({
      where: {
        id: params.id,
        tenantId: session.tenantId,
      },
      include: {
        _count: { select: { movements: true, recipes: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Ação rápida de controle de Pot-Life (Abrir Frasco / Zerar Abertura)
    if (validated.action === "OPEN_BOTTLE" || validated.action === "RESET_OPENED") {
      const nextOpenedAt = validated.action === "OPEN_BOTTLE" ? new Date() : null;
      const updated = await prisma.$transaction(async (tx) => {
        const prod = await tx.product.update({
          where: { id: existing.id },
          data: { openedAt: nextOpenedAt },
        });
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            userId: session.userId,
            action: validated.action!,
            entity: "Product",
            entityId: existing.id,
            details: JSON.stringify({
              before: { openedAt: existing.openedAt },
              after: { openedAt: nextOpenedAt },
            }),
          },
        });
        return prod;
      });
      return NextResponse.json({ product: updated });
    }

    // Parse seguro de datas via parseDateInput
    let nextPurchasedAt: Date | null | undefined = undefined;
    if (validated.purchasedAt !== undefined) {
      if (validated.purchasedAt === null || validated.purchasedAt === "") {
        nextPurchasedAt = null;
      } else {
        const parsed = parseDateInput(validated.purchasedAt);
        if (!parsed) {
          return NextResponse.json({ error: "Data da compra inválida." }, { status: 400 });
        }
        nextPurchasedAt = parsed;
      }
    }

    let nextExpirationDate: Date | null | undefined = undefined;
    if (validated.expirationDate !== undefined) {
      if (validated.expirationDate === null || validated.expirationDate === "") {
        nextExpirationDate = null;
      } else {
        const parsed = parseDateInput(validated.expirationDate);
        if (!parsed) {
          return NextResponse.json({ error: "Data de validade inválida." }, { status: 400 });
        }
        nextExpirationDate = parsed;
      }
    }

    let nextOpenedAt: Date | null | undefined = undefined;
    if (validated.openedAt !== undefined) {
      if (validated.openedAt === null || validated.openedAt === "") {
        nextOpenedAt = null;
      } else {
        const parsed = parseDateInput(validated.openedAt);
        if (!parsed) {
          return NextResponse.json({ error: "Data de abertura inválida." }, { status: 400 });
        }
        nextOpenedAt = parsed;
      }
    }

    const targetUnit = validated.unit ?? existing.unit;
    let conversionFactor = 1;

    if (targetUnit !== existing.unit) {
      const factor = getUnitConversionFactor(existing.unit, targetUnit);
      if (existing._count.movements > 0 && factor === null) {
        return NextResponse.json(
          {
            error: `Este produto já possui movimentações em ${existing.unit}. Não é possível alterar para ${targetUnit} diretamente — arquive este item e cadastre um novo produto na unidade desejada.`,
          },
          { status: 400 }
        );
      }
      conversionFactor = factor ?? 1;
    }

    const product = await prisma.$transaction(async (tx) => {
      let nextCurrentStock = existing.currentStock;
      let nextMinStock = validated.minStock ?? existing.minStock;
      let nextCostPrice = validated.costPrice ?? existing.costPrice;
      let nextPackSize =
        validated.packSize !== undefined ? validated.packSize : existing.packSize;

      if (conversionFactor !== 1) {
        nextCurrentStock = roundStockQty(existing.currentStock * conversionFactor);
        if (validated.minStock === undefined) {
          nextMinStock = roundStockQty(existing.minStock * conversionFactor);
        }
        if (validated.costPrice === undefined) {
          nextCostPrice = roundUnitCost(existing.costPrice / conversionFactor);
        }
        if (validated.packSize === undefined && existing.packSize !== null) {
          nextPackSize = roundStockQty(existing.packSize * conversionFactor);
        }

        // Converte histórico de movimentações e receitas para manter coerência contábil e de estoque
        const movements = await tx.stockMovement.findMany({
          where: { productId: existing.id },
          select: { id: true, quantity: true, unitCost: true },
        });
        for (const mov of movements) {
          await tx.stockMovement.update({
            where: { id: mov.id },
            data: {
              quantity: roundStockQty(mov.quantity * conversionFactor),
              unitCost:
                mov.unitCost !== null && mov.unitCost !== undefined
                  ? roundUnitCost(mov.unitCost / conversionFactor)
                  : null,
            },
          });
        }

        const recipes = await tx.serviceProductRecipe.findMany({
          where: { productId: existing.id },
          select: { id: true, quantityPerService: true },
        });
        for (const rec of recipes) {
          await tx.serviceProductRecipe.update({
            where: { id: rec.id },
            data: {
              quantityPerService: roundStockQty(rec.quantityPerService * conversionFactor),
            },
          });
        }
      }

      const updated = await tx.product.update({
        where: { id: existing.id },
        data: {
          name: validated.name ?? existing.name,
          category: validated.category ?? existing.category,
          unit: targetUnit,
          currentStock: nextCurrentStock,
          minStock: roundStockQty(nextMinStock),
          costPrice: roundUnitCost(nextCostPrice),
          supplier:
            validated.supplier !== undefined
              ? validated.supplier?.trim() || null
              : existing.supplier,
          purchasedAt:
            nextPurchasedAt !== undefined ? nextPurchasedAt : existing.purchasedAt,
          packSize: nextPackSize,
          packLabel:
            validated.packLabel !== undefined
              ? validated.packLabel?.trim() || null
              : existing.packLabel,
          defaultDilution:
            validated.defaultDilution !== undefined
              ? validated.defaultDilution?.trim() || null
              : existing.defaultDilution,
          daysValidAfterOpen:
            validated.daysValidAfterOpen !== undefined
              ? validated.daysValidAfterOpen
              : existing.daysValidAfterOpen,
          expirationDate:
            nextExpirationDate !== undefined ? nextExpirationDate : existing.expirationDate,
          openedAt: nextOpenedAt !== undefined ? nextOpenedAt : existing.openedAt,
          active: validated.active !== undefined ? validated.active : existing.active,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "UPDATE_PRODUCT",
          entity: "Product",
          entityId: existing.id,
          details: JSON.stringify({
            before: {
              name: existing.name,
              unit: existing.unit,
              currentStock: existing.currentStock,
              costPrice: existing.costPrice,
              active: existing.active,
            },
            after: {
              name: updated.name,
              unit: updated.unit,
              currentStock: updated.currentStock,
              costPrice: updated.costPrice,
              active: updated.active,
            },
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({ product });
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

// DELETE /api/products/[id] — Arquiva (soft-delete) quando há histórico; exclui só se vazio; nunca apaga Expense (Somente ADMIN)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        tenantId: session.tenantId,
      },
      include: {
        _count: {
          select: { movements: true, recipes: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (product._count.movements > 0 || product._count.recipes > 0) {
      if (!product.active) {
        return NextResponse.json({
          deleted: true,
          archived: true,
          message: "Este produto já está arquivado.",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { active: false },
        });
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            userId: session.userId,
            action: "ARCHIVE_PRODUCT",
            entity: "Product",
            entityId: product.id,
            details: JSON.stringify({
              before: { active: true, currentStock: product.currentStock },
              after: { active: false },
            }),
          },
        });
      });

      return NextResponse.json({
        deleted: true,
        archived: true,
        message:
          "Produto arquivado com segurança. Movimentações e despesas financeiras vinculadas foram preservadas.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: product.id } });
      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "DELETE_PRODUCT",
          entity: "Product",
          entityId: product.id,
          details: JSON.stringify({ name: product.name, unit: product.unit }),
        },
      });
    });

    return NextResponse.json({
      deleted: true,
      archived: false,
      message: "Produto sem histórico excluído definitivamente.",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
