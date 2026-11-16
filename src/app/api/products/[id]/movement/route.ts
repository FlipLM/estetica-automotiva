import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, handleAuthError } from "@/lib/permissions";
import { parseDateInput } from "@/lib/date-utils";
import {
  calculateMovingAverageCost,
  formatStockQuantity,
  roundCurrency,
  roundStockQty,
  roundUnitCost,
} from "@/lib/inventory";

class InsufficientStockError extends Error {
  available: number;
  unit: string;
  constructor(available: number, unit: string) {
    super(`Estoque insuficiente. Disponível: ${available} ${unit}`);
    this.name = "InsufficientStockError";
    this.available = available;
    this.unit = unit;
  }
}

class ConflictMovementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictMovementError";
  }
}

class NotFoundMovementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundMovementError";
  }
}

const postMovementSchema = z.object({
  type: z.enum(["IN", "OUT", "LOSS", "OS_CONSUMPTION", "ADJUSTMENT"]),
  quantity: z.number().positive("Quantidade deve ser maior que zero").optional(),
  targetStock: z.number().min(0, "Saldo apurado não pode ser negativo").optional(),
  unitCost: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  reason: z.string().trim().max(300).optional(),
  serviceOrderId: z.string().uuid().nullish(),
  purchasedAt: z.string().nullish(),
  supplier: z.string().trim().max(120).nullish(),
  paid: z.boolean().optional(),
  dueDate: z.string().nullish(),
  paymentMethod: z
    .enum(["CASH", "PIX", "DEBIT", "CREDIT", "BOLETO", "TRANSFER", "OTHER"])
    .nullish(),
  createExpense: z.boolean().optional(),
  markOpened: z.boolean().optional(),
});

const patchMovementSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("RECOVER_LOSS"),
    movementId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("EDIT_MOVEMENT"),
    movementId: z.string().uuid(),
    quantity: z.number().positive("Quantidade deve ser maior que zero"),
    totalCost: z.number().min(0).optional(),
    reason: z.string().trim().max(300).optional(),
  }),
]);

// POST /api/products/[id]/movement — Registra entrada (ADMIN), ajuste (ADMIN) ou saída/perda/consumo OS (ADMIN/OPERATOR)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const isAdmin = session.role === "ADMIN";
    const body = await request.json();
    const validated = postMovementSchema.parse(body);

    // RBAC estrito no backend
    if ((validated.type === "IN" || validated.type === "ADJUSTMENT") && !isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem registrar compras ou ajustes de inventário." },
        { status: 403 }
      );
    }

    if (validated.type === "ADJUSTMENT") {
      if (validated.targetStock === undefined) {
        return NextResponse.json(
          { error: "Informe o saldo físico contado para o ajuste de inventário." },
          { status: 400 }
        );
      }
    } else if (!validated.quantity || validated.quantity <= 0) {
      return NextResponse.json(
        { error: "Informe uma quantidade positiva para a movimentação." },
        { status: 400 }
      );
    }

    // OS_CONSUMPTION exige serviceOrderId válido pertencente ao tenant
    let validServiceOrder: { id: string; orderNumber: number } | null = null;
    if (validated.type === "OS_CONSUMPTION") {
      if (!validated.serviceOrderId) {
        return NextResponse.json(
          { error: "Consumo de OS exige seleção de uma Ordem de Serviço válida." },
          { status: 400 }
        );
      }
      validServiceOrder = await prisma.serviceOrder.findFirst({
        where: {
          id: validated.serviceOrderId,
          tenantId: session.tenantId,
        },
        select: { id: true, orderNumber: true },
      });
      if (!validServiceOrder) {
        return NextResponse.json(
          { error: "Ordem de Serviço não encontrada para esta oficina." },
          { status: 404 }
        );
      }
    } else if (validated.serviceOrderId) {
      validServiceOrder = await prisma.serviceOrder.findFirst({
        where: {
          id: validated.serviceOrderId,
          tenantId: session.tenantId,
        },
        select: { id: true, orderNumber: true },
      });
      if (!validServiceOrder) {
        return NextResponse.json(
          { error: "Ordem de Serviço informada não pertence à sua oficina." },
          { status: 404 }
        );
      }
    }

    const purchaseDate = validated.purchasedAt
      ? parseDateInput(validated.purchasedAt)
      : new Date();
    if (validated.purchasedAt && !purchaseDate) {
      return NextResponse.json({ error: "Data da compra inválida." }, { status: 400 });
    }

    const isPaid = validated.paid ?? true;
    const parsedDueDate = validated.dueDate
      ? parseDateInput(validated.dueDate)
      : purchaseDate;
    if (validated.dueDate && !parsedDueDate) {
      return NextResponse.json({ error: "Data de vencimento inválida." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: params.id, tenantId: session.tenantId },
      });

      if (!product) {
        throw new NotFoundMovementError("Produto não encontrado.");
      }
      if (!product.active) {
        throw new ConflictMovementError(
          "Este produto está arquivado. Reative-o antes de movimentar o estoque."
        );
      }

      const qty = roundStockQty(validated.quantity || 0);
      let movementQty = qty;
      let movementUnitCost: number | null = null;
      let movementTotalCost: number | null = null;
      let movementExpenseId: string | null = null;
      let movementReason = validated.reason?.trim() || null;
      const movementCreatedAt =
        validated.type === "IN" && purchaseDate ? purchaseDate : new Date();

      if (validated.type === "IN") {
        if (validated.totalCost !== undefined) {
          movementTotalCost = roundCurrency(validated.totalCost);
          movementUnitCost = roundUnitCost(movementTotalCost / qty);
        } else if (validated.unitCost !== undefined) {
          movementUnitCost = roundUnitCost(validated.unitCost);
          movementTotalCost = roundCurrency(movementUnitCost * qty);
        } else {
          movementUnitCost = roundUnitCost(product.costPrice);
          movementTotalCost = roundCurrency(movementUnitCost * qty);
        }

        const newAvgCost = calculateMovingAverageCost({
          currentStock: product.currentStock,
          currentCostPrice: product.costPrice,
          incomingQty: qty,
          incomingTotalCost: movementTotalCost,
        });

        const cleanSupplier = validated.supplier?.trim() || null;
        const shouldCreateExpense =
          (validated.createExpense ?? true) && movementTotalCost > 0;

        if (shouldCreateExpense) {
          const expense = await tx.expense.create({
            data: {
              tenantId: session.tenantId,
              category: "PRODUCTS",
              description: `Compra de estoque: ${product.name} (${formatStockQuantity(qty, product.unit)})`,
              amount: movementTotalCost,
              dueDate: parsedDueDate || movementCreatedAt,
              paid: isPaid,
              paidAt: isPaid ? movementCreatedAt : null,
              paymentMethod: validated.paymentMethod || (isPaid ? "PIX" : "BOLETO"),
              supplier: cleanSupplier || product.supplier,
              notes:
                movementReason ||
                (cleanSupplier ? `Fornecedor: ${cleanSupplier}` : null),
            },
          });
          movementExpenseId = expense.id;
        }

        const shouldUpdateLastPurchase =
          !product.purchasedAt || movementCreatedAt >= product.purchasedAt;

        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: { increment: qty },
            costPrice: newAvgCost,
            ...(shouldUpdateLastPurchase ? { purchasedAt: movementCreatedAt } : {}),
            ...(cleanSupplier && shouldUpdateLastPurchase
              ? { supplier: cleanSupplier }
              : {}),
          },
        });

        if (!movementReason) {
          movementReason = cleanSupplier
            ? `Entrada de compra — ${cleanSupplier}`
            : "Reposição de estoque";
        }
      } else if (validated.type === "ADJUSTMENT") {
        const countedStock = roundStockQty(validated.targetStock!);
        const delta = roundStockQty(countedStock - product.currentStock);

        if (Math.abs(delta) < 0.0001) {
          throw new ConflictMovementError(
            "O saldo informado já é igual ao saldo atual em estoque."
          );
        }

        movementQty = Math.abs(delta);
        movementUnitCost = roundUnitCost(product.costPrice);
        movementTotalCost = roundCurrency(movementQty * product.costPrice);

        if (delta < 0) {
          const dec = await tx.product.updateMany({
            where: {
              id: product.id,
              tenantId: session.tenantId,
              active: true,
              currentStock: { gte: movementQty },
            },
            data: {
              currentStock: { decrement: movementQty },
            },
          });
          if (dec.count === 0) {
            throw new InsufficientStockError(product.currentStock, product.unit);
          }
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: {
              currentStock: { increment: movementQty },
            },
          });
        }

        const prefix =
          delta > 0
            ? `[Ajuste +${formatStockQuantity(movementQty, product.unit)}]`
            : `[Ajuste -${formatStockQuantity(movementQty, product.unit)}]`;
        movementReason = movementReason
          ? `${prefix} ${movementReason}`
          : `${prefix} Conferência de inventário (de ${formatStockQuantity(product.currentStock, product.unit)} para ${formatStockQuantity(countedStock, product.unit)})`;
      } else {
        // OUT | LOSS | OS_CONSUMPTION — Baixa atômica com proteção contra saldo negativo
        const dec = await tx.product.updateMany({
          where: {
            id: product.id,
            tenantId: session.tenantId,
            active: true,
            currentStock: { gte: qty },
          },
          data: {
            currentStock: { decrement: qty },
            ...(validated.markOpened && !product.openedAt
              ? { openedAt: new Date() }
              : {}),
          },
        });

        if (dec.count === 0) {
          throw new InsufficientStockError(product.currentStock, product.unit);
        }

        movementUnitCost = roundUnitCost(product.costPrice);
        movementTotalCost = roundCurrency(qty * product.costPrice);

        if (!movementReason) {
          if (validated.type === "OS_CONSUMPTION" && validServiceOrder) {
            movementReason = `Consumo na OS #${validServiceOrder.orderNumber}`;
          } else if (validated.type === "LOSS") {
            movementReason = "Perda / avaria / vazamento";
          } else {
            movementReason = "Retirada operacional no pátio";
          }
        }
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          userId: session.userId,
          serviceOrderId: validServiceOrder?.id || null,
          type: validated.type,
          quantity: movementQty,
          unitCost: movementUnitCost,
          totalCost: movementTotalCost,
          reason: movementReason,
          expenseId: movementExpenseId,
          createdAt: movementCreatedAt,
        },
      });

      const updatedProduct = await tx.product.findUnique({
        where: { id: product.id },
      });

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "CREATE_STOCK_MOVEMENT",
          entity: "StockMovement",
          entityId: movement.id,
          details: JSON.stringify({
            before: {
              productId: product.id,
              currentStock: product.currentStock,
              costPrice: product.costPrice,
            },
            after: {
              type: movement.type,
              quantity: movement.quantity,
              newStock: updatedProduct?.currentStock,
              newCostPrice: updatedProduct?.costPrice,
              serviceOrderId: movement.serviceOrderId,
              expenseId: movement.expenseId,
            },
          }),
        },
      });

      return { movement, updatedProduct };
    });

    const sanitizedProduct = result.updatedProduct
      ? {
          ...result.updatedProduct,
          costPrice: isAdmin ? result.updatedProduct.costPrice : 0,
          supplier: isAdmin ? result.updatedProduct.supplier : null,
          purchasedAt: isAdmin ? result.updatedProduct.purchasedAt : null,
        }
      : null;

    const sanitizedMovement = {
      ...result.movement,
      unitCost: isAdmin ? result.movement.unitCost : null,
      totalCost: isAdmin ? result.movement.totalCost : null,
      expenseId: isAdmin ? result.movement.expenseId : null,
    };

    return NextResponse.json(
      { movement: sanitizedMovement, product: sanitizedProduct },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ConflictMovementError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof NotFoundMovementError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return handleAuthError(error);
  }
}

// PATCH /api/products/[id]/movement — Recuperar perda (atômico) ou Editar movimentação (ADMIN)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = patchMovementSchema.parse(body);

    if (validated.action === "EDIT_MOVEMENT") {
      const session = await requireAdmin();

      const updated = await prisma.$transaction(async (tx) => {
        const movement = await tx.stockMovement.findFirst({
          where: {
            id: validated.movementId,
            productId: params.id,
            product: { tenantId: session.tenantId },
          },
          include: { product: true },
        });

        if (!movement) {
          throw new NotFoundMovementError("Movimentação não encontrada.");
        }

        if (movement.type === "ADJUSTMENT") {
          throw new ConflictMovementError(
            "Ajustes de inventário não podem ser editados. Registre um novo ajuste se necessário."
          );
        }

        const newQty = roundStockQty(validated.quantity);
        const oldQty = roundStockQty(movement.quantity);
        const qtyDiff = roundStockQty(newQty - oldQty);

        if (movement.type === "IN") {
          // Para IN: aumentar qtde soma no estoque; diminuir exige que haja saldo suficiente para estornar
          if (qtyDiff < 0) {
            const absDiff = Math.abs(qtyDiff);
            const dec = await tx.product.updateMany({
              where: {
                id: movement.productId,
                tenantId: session.tenantId,
                currentStock: { gte: absDiff },
              },
              data: { currentStock: { decrement: absDiff } },
            });
            if (dec.count === 0) {
              throw new InsufficientStockError(
                movement.product.currentStock,
                movement.product.unit
              );
            }
          } else if (qtyDiff > 0) {
            await tx.product.update({
              where: { id: movement.productId },
              data: { currentStock: { increment: qtyDiff } },
            });
          }

          const newTotalCost =
            validated.totalCost !== undefined
              ? roundCurrency(validated.totalCost)
              : roundCurrency(movement.totalCost ?? newQty * movement.product.costPrice);
          const newUnitCost = roundUnitCost(newTotalCost / newQty);

          const refreshedProduct = await tx.product.findUnique({
            where: { id: movement.productId },
          });

          // Recalcula custo médio de forma segura com base no estoque remanescente antes desta entrada
          const stockBeforeEntry = Math.max(
            0,
            roundStockQty((refreshedProduct?.currentStock || 0) - newQty)
          );
          const recalcAvgCost = calculateMovingAverageCost({
            currentStock: stockBeforeEntry,
            currentCostPrice: movement.product.costPrice,
            incomingQty: newQty,
            incomingTotalCost: newTotalCost,
          });

          await tx.product.update({
            where: { id: movement.productId },
            data: { costPrice: recalcAvgCost },
          });

          // Só atualiza a despesa vinculada se ela existir (nunca recria despesa se expenseId for null)
          if (movement.expenseId) {
            await tx.expense.updateMany({
              where: { id: movement.expenseId, tenantId: session.tenantId },
              data: {
                amount: newTotalCost,
                description: `Compra de estoque: ${movement.product.name} (${formatStockQuantity(newQty, movement.product.unit)})`,
                ...(validated.reason ? { notes: validated.reason } : {}),
              },
            });
          }

          const saved = await tx.stockMovement.update({
            where: { id: movement.id },
            data: {
              quantity: newQty,
              unitCost: newUnitCost,
              totalCost: newTotalCost,
              ...(validated.reason !== undefined ? { reason: validated.reason || null } : {}),
            },
          });

          await tx.auditLog.create({
            data: {
              tenantId: session.tenantId,
              userId: session.userId,
              action: "EDIT_STOCK_MOVEMENT",
              entity: "StockMovement",
              entityId: movement.id,
              details: JSON.stringify({
                before: {
                  quantity: oldQty,
                  totalCost: movement.totalCost,
                  costPrice: movement.product.costPrice,
                },
                after: {
                  quantity: newQty,
                  totalCost: newTotalCost,
                  costPrice: recalcAvgCost,
                },
              }),
            },
          });

          return saved;
        }

        // OUT | LOSS | OS_CONSUMPTION (quando não recuperada): se aumentou a saída, precisa abater a diferença do estoque
        const isUnrecovered = !(movement.type === "LOSS" && movement.recovered);
        if (isUnrecovered && qtyDiff !== 0) {
          if (qtyDiff > 0) {
            const dec = await tx.product.updateMany({
              where: {
                id: movement.productId,
                tenantId: session.tenantId,
                currentStock: { gte: qtyDiff },
              },
              data: { currentStock: { decrement: qtyDiff } },
            });
            if (dec.count === 0) {
              throw new InsufficientStockError(
                movement.product.currentStock,
                movement.product.unit
              );
            }
          } else {
            await tx.product.update({
              where: { id: movement.productId },
              data: { currentStock: { increment: Math.abs(qtyDiff) } },
            });
          }
        }

        const unitCost = roundUnitCost(movement.unitCost ?? movement.product.costPrice);
        const totalCost = roundCurrency(newQty * unitCost);

        const saved = await tx.stockMovement.update({
          where: { id: movement.id },
          data: {
            quantity: newQty,
            totalCost,
            ...(validated.reason !== undefined ? { reason: validated.reason || null } : {}),
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            userId: session.userId,
            action: "EDIT_STOCK_MOVEMENT",
            entity: "StockMovement",
            entityId: movement.id,
            details: JSON.stringify({
              before: { quantity: oldQty, reason: movement.reason },
              after: { quantity: newQty, reason: saved.reason },
            }),
          },
        });

        return saved;
      });

      return NextResponse.json({ movement: updated });
    }

    // action === "RECOVER_LOSS"
    const session = await requireAuth();
    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.findFirst({
        where: {
          id: validated.movementId,
          productId: params.id,
          product: { tenantId: session.tenantId },
        },
        include: { product: true },
      });

      if (!movement) {
        throw new NotFoundMovementError("Movimentação não encontrada.");
      }
      if (movement.type !== "LOSS") {
        throw new ConflictMovementError(
          "Apenas registros de perda/avaria podem ser recuperados."
        );
      }

      // Trava atômica anti-concorrência: só recupera se ainda estiver recovered: false
      const claimed = await tx.stockMovement.updateMany({
        where: {
          id: movement.id,
          recovered: false,
          type: "LOSS",
        },
        data: {
          recovered: true,
          recoveredAt: new Date(),
        },
      });

      if (claimed.count === 0) {
        throw new ConflictMovementError(
          "Esta perda já foi recuperada anteriormente."
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: movement.productId },
        data: {
          currentStock: { increment: movement.quantity },
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "RECOVER_STOCK_LOSS",
          entity: "StockMovement",
          entityId: movement.id,
          details: JSON.stringify({
            before: { recovered: false, stock: movement.product.currentStock },
            after: { recovered: true, stock: updatedProduct.currentStock },
          }),
        },
      });

      return { movementId: movement.id, currentStock: updatedProduct.currentStock };
    });

    return NextResponse.json({
      recovered: true,
      movementId: result.movementId,
      currentStock: result.currentStock,
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ConflictMovementError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof NotFoundMovementError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return handleAuthError(error);
  }
}
