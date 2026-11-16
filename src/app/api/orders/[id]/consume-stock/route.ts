import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";
import { roundCurrency, roundStockQty, roundUnitCost } from "@/lib/inventory";

class StockConsumeError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "StockConsumeError";
    this.status = status;
  }
}

const consumeStockSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Produto inválido."),
        quantity: z.number().positive("Quantidade deve ser maior que zero."),
        notes: z.string().trim().max(200).optional(),
      })
    )
    .min(1, "Selecione pelo menos um insumo para dar baixa na OS."),
});

// POST /api/orders/[id]/consume-stock — Registra baixa operacional de insumos vinculados à OS (ADMIN e OPERATOR)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const isAdmin = session.role === "ADMIN";
    const body = await req.json();
    const validated = consumeStockSchema.parse(body);

    const order = await prisma.serviceOrder.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Não é possível consumir insumos em uma OS cancelada." },
        { status: 400 }
      );
    }

    // Consolida múltiplos itens com o mesmo productId mantendo notas combinadas
    const aggregated = new Map<string, { quantity: number; notes: string[] }>();
    for (const item of validated.items) {
      const current = aggregated.get(item.productId) || { quantity: 0, notes: [] };
      current.quantity = roundStockQty(current.quantity + item.quantity);
      if (item.notes?.trim()) {
        current.notes.push(item.notes.trim());
      }
      aggregated.set(item.productId, current);
    }

    const movements = await prisma.$transaction(async (tx) => {
      const createdMovements = [];

      for (const [productId, entry] of Array.from(aggregated.entries())) {
        const product = await tx.product.findFirst({
          where: { id: productId, tenantId: session.tenantId },
        });

        if (!product) {
          throw new StockConsumeError("Produto não encontrado no catálogo desta oficina.", 404);
        }
        if (!product.active) {
          throw new StockConsumeError(
            `O produto "${product.name}" está arquivado e não pode receber baixas.`,
            400
          );
        }

        const dec = await tx.product.updateMany({
          where: {
            id: product.id,
            tenantId: session.tenantId,
            active: true,
            currentStock: { gte: entry.quantity },
          },
          data: {
            currentStock: { decrement: entry.quantity },
          },
        });

        if (dec.count === 0) {
          throw new StockConsumeError(
            `Estoque insuficiente de "${product.name}". Disponível: ${product.currentStock} ${product.unit}.`,
            400
          );
        }

        const unitCost = roundUnitCost(product.costPrice);
        const totalCost = roundCurrency(entry.quantity * unitCost);
        const reason =
          entry.notes.length > 0
            ? `OS #${order.orderNumber} — ${entry.notes.join("; ")}`
            : `Consumo confirmado na OS #${order.orderNumber}`;

        const movement = await tx.stockMovement.create({
          data: {
            productId: product.id,
            userId: session.userId,
            serviceOrderId: order.id,
            type: "OS_CONSUMPTION",
            quantity: entry.quantity,
            unitCost,
            totalCost,
            reason,
          },
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        });

        createdMovements.push({
          ...movement,
          unitCost: isAdmin ? movement.unitCost : null,
          totalCost: isAdmin ? movement.totalCost : null,
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "CONSUME_OS_STOCK",
          entity: "ServiceOrder",
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            items: Array.from(aggregated.entries()).map(([productId, e]) => ({
              productId,
              quantity: e.quantity,
            })),
          }),
        },
      });

      return createdMovements;
    });

    return NextResponse.json({ movements }, { status: 201 });
  } catch (error) {
    if (error instanceof StockConsumeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    return handleAuthError(error);
  }
}
