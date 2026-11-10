import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "LOSS", "OS_CONSUMPTION"]),
  quantity: z.number().positive("A quantidade deve ser maior que zero"),
  reason: z.string().min(2, "O motivo/justificativa é obrigatório"),
  totalCost: z.number().min(0).optional(),
  unitCost: z.number().min(0).optional(),
});

const patchMovementSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("RECOVER_LOSS"),
    movementId: z.string().min(1),
  }),
  z.object({
    action: z.literal("EDIT_MOVEMENT"),
    movementId: z.string().min(1),
    quantity: z.number().positive("A quantidade deve ser maior que zero"),
    totalCost: z.number().min(0).optional(),
    reason: z.string().min(2, "O motivo é obrigatório"),
  }),
]);

/**
 * Recalcula o custo médio unitário ponderado de um produto a partir das suas entradas (IN)
 */
async function recalculateAverageCost(tx: any, productId: string, fallbackCost: number) {
  const inMovements = await tx.stockMovement.findMany({
    where: { productId, type: "IN" },
  });

  if (inMovements.length === 0) {
    return fallbackCost;
  }

  let totalQty = 0;
  let totalSpent = 0;

  for (const m of inMovements) {
    totalQty += m.quantity;
    const cost =
      m.totalCost !== null && m.totalCost !== undefined
        ? m.totalCost
        : m.quantity * (m.unitCost ?? fallbackCost);
    totalSpent += cost;
  }

  return totalQty > 0 ? totalSpent / totalQty : fallbackCost;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validated = movementSchema.parse(body);

    // Calcular novo saldo
    let newStock = product.currentStock;
    if (validated.type === "IN") {
      newStock += validated.quantity;
    } else {
      if (product.currentStock < validated.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente. Saldo atual: ${product.currentStock} ${product.unit}`,
          },
          { status: 400 }
        );
      }
      newStock -= validated.quantity;
    }

    // Cálculo de custo da movimentação
    let movUnitCost = product.costPrice;
    let movTotalCost = validated.quantity * product.costPrice;

    if (validated.type === "IN") {
      if (validated.totalCost !== undefined && validated.totalCost >= 0) {
        movTotalCost = validated.totalCost;
        movUnitCost = validated.totalCost / validated.quantity;
      } else if (validated.unitCost !== undefined && validated.unitCost >= 0) {
        movUnitCost = validated.unitCost;
        movTotalCost = validated.unitCost * validated.quantity;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Se for uma entrada (IN) com valor financeiro, gera automaticamente a despesa no Financeiro (PRODUCTS)
      let expenseId: string | null = null;
      if (validated.type === "IN" && movTotalCost > 0) {
        const expense = await tx.expense.create({
          data: {
            tenantId: session.tenantId,
            description: `Entrada de Estoque: ${product.name} (+${validated.quantity} ${product.unit})`,
            amount: movTotalCost,
            category: "PRODUCTS",
            dueDate: new Date(),
            paid: true,
            paidAt: new Date(),
            notes: validated.reason
              ? `Entrada registrada no estoque. Motivo/NF: ${validated.reason}`
              : "Entrada de produto no estoque",
          },
        });
        expenseId = expense.id;
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: validated.type,
          quantity: validated.quantity,
          unitCost: movUnitCost,
          totalCost: movTotalCost,
          reason: validated.reason,
          expenseId: expenseId,
        },
      });

      const newAverageCost =
        validated.type === "IN"
          ? await recalculateAverageCost(tx, product.id, movUnitCost)
          : product.costPrice;

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: newStock,
          costPrice: newAverageCost,
        },
      });

      return { movement, updatedProduct };
    });

    return NextResponse.json({
      message: "Movimentação registrada com sucesso",
      movement: result.movement,
      currentStock: result.updatedProduct.currentStock,
      averageUnitCost: result.updatedProduct.costPrice,
      isLowStock: result.updatedProduct.currentStock <= result.updatedProduct.minStock,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao registrar movimentação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const validated = patchMovementSchema.parse(body);

    const existingMovement = await prisma.stockMovement.findFirst({
      where: { id: validated.movementId, productId: product.id },
    });

    if (!existingMovement) {
      return NextResponse.json(
        { error: "Registro de movimentação não encontrado" },
        { status: 404 }
      );
    }

    // AÇÃO 1: REENCONTRAR ITEM PERDIDO (RETORNAR PARA O ESTOQUE)
    if (validated.action === "RECOVER_LOSS") {
      if (existingMovement.type !== "LOSS") {
        return NextResponse.json(
          { error: "Apenas registros de perda podem ser reencontrados e retornados ao estoque." },
          { status: 400 }
        );
      }

      if (existingMovement.recovered) {
        return NextResponse.json(
          { error: "Este item já foi marcado como reencontrado anteriormente." },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedMovement = await tx.stockMovement.update({
          where: { id: existingMovement.id },
          data: {
            recovered: true,
            recoveredAt: new Date(),
          },
        });

        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: product.currentStock + existingMovement.quantity,
          },
        });

        return { updatedMovement, updatedProduct };
      });

      return NextResponse.json({
        message: "Item reencontrado! Quantidade devolvida ao estoque com sucesso.",
        movement: result.updatedMovement,
        currentStock: result.updatedProduct.currentStock,
      });
    }

    // AÇÃO 2: EDITAR MOVIMENTAÇÃO (BLOQUEADO PARA SAÍDAS)
    if (validated.action === "EDIT_MOVEMENT") {
      if (
        existingMovement.type === "OUT" ||
        existingMovement.type === "OS_CONSUMPTION"
      ) {
        return NextResponse.json(
          {
            error:
              "Bloqueado: Não é permitido editar itens que estão em saídas de estoque.",
          },
          { status: 403 }
        );
      }

      if (existingMovement.type === "LOSS" && existingMovement.recovered) {
        return NextResponse.json(
          {
            error: "Não é possível editar uma perda que já foi recuperada.",
          },
          { status: 400 }
        );
      }

      const diffQty = validated.quantity - existingMovement.quantity;
      let newStock = product.currentStock;

      if (existingMovement.type === "IN") {
        newStock = product.currentStock + diffQty;
        if (newStock < 0) {
          return NextResponse.json(
            {
              error:
                "A redução da quantidade desta entrada deixaria o saldo atual negativo.",
            },
            { status: 400 }
          );
        }
      } else if (existingMovement.type === "LOSS") {
        newStock = product.currentStock - diffQty;
        if (newStock < 0) {
          return NextResponse.json(
            {
              error: `Estoque insuficiente para aumentar a perda. Saldo disponível: ${product.currentStock} ${product.unit}`,
            },
            { status: 400 }
          );
        }
      }

      const newTotalCost =
        existingMovement.type === "IN" && validated.totalCost !== undefined
          ? validated.totalCost
          : existingMovement.totalCost ?? validated.quantity * product.costPrice;

      const newUnitCost =
        validated.quantity > 0 ? newTotalCost / validated.quantity : product.costPrice;

      const result = await prisma.$transaction(async (tx) => {
        // Se for uma entrada (IN) vinculada a uma despesa no financeiro, sincroniza o valor e descrição
        if (existingMovement.type === "IN") {
          if (existingMovement.expenseId) {
            await tx.expense.update({
              where: { id: existingMovement.expenseId },
              data: {
                amount: newTotalCost,
                description: `Entrada de Estoque: ${product.name} (+${validated.quantity} ${product.unit})`,
                notes: validated.reason
                  ? `Atualizado via estoque. Motivo/NF: ${validated.reason}`
                  : undefined,
              },
            });
          } else if (newTotalCost > 0) {
            // Se a entrada antiga não tinha despesa vinculada (ex: criada antes), gera agora
            const newExp = await tx.expense.create({
              data: {
                tenantId: session.tenantId,
                description: `Entrada de Estoque: ${product.name} (+${validated.quantity} ${product.unit})`,
                amount: newTotalCost,
                category: "PRODUCTS",
                dueDate: new Date(),
                paid: true,
                paidAt: new Date(),
                notes: validated.reason,
              },
            });
            await tx.stockMovement.update({
              where: { id: existingMovement.id },
              data: { expenseId: newExp.id },
            });
          }
        }

        const updatedMovement = await tx.stockMovement.update({
          where: { id: existingMovement.id },
          data: {
            quantity: validated.quantity,
            totalCost: newTotalCost,
            unitCost: newUnitCost,
            reason: validated.reason,
          },
        });

        const newAverageCost =
          existingMovement.type === "IN"
            ? await recalculateAverageCost(tx, product.id, newUnitCost)
            : product.costPrice;

        const updatedProduct = await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
            costPrice: newAverageCost,
          },
        });

        return { updatedMovement, updatedProduct };
      });

      return NextResponse.json({
        message: "Movimentação atualizada com sucesso",
        movement: result.updatedMovement,
        currentStock: result.updatedProduct.currentStock,
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao atualizar movimentação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
