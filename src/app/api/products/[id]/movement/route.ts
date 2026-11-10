import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "LOSS", "OS_CONSUMPTION"]),
  quantity: z.number().positive("A quantidade deve ser positiva"),
  reason: z.string().min(2, "O motivo/observação é obrigatório"),
});

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

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: validated.type,
          quantity: validated.quantity,
          reason: validated.reason,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: { currentStock: newStock },
      });

      return { movement, updatedProduct };
    });

    return NextResponse.json({
      message: "Movimentação registrada com sucesso",
      movement: result.movement,
      currentStock: result.updatedProduct.currentStock,
      isLowStock: result.updatedProduct.currentStock <= result.updatedProduct.minStock,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }
    console.error("Erro ao registrar movimentação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

