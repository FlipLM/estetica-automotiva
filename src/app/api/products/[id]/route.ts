import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateProductSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").optional(),
  category: z.enum(["CHEMICAL", "ACCESSORY", "TOOL"]).optional(),
  unit: z.enum(["ML", "L", "G", "KG", "UN"]).optional(),
  minStock: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  supplier: z.string().nullable().optional(),
});

export async function GET(
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
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(
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
    const validated = updateProductSchema.parse(body);

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json({
      message: "Produto atualizado com sucesso",
      product: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
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
      include: {
        movements: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Coleta os IDs de despesas vinculadas a entradas deste produto
      const linkedExpenseIds = product.movements
        .map((m) => m.expenseId)
        .filter((id): id is string => !!id);

      // Exclui as movimentações
      await tx.stockMovement.deleteMany({
        where: { productId: params.id },
      });

      // Exclui o produto
      await tx.product.delete({
        where: { id: params.id },
      });

      // Se houver despesas vinculadas exclusivamente a essas entradas, exclui-as do financeiro
      if (linkedExpenseIds.length > 0) {
        await tx.expense.deleteMany({
          where: { id: { in: linkedExpenseIds } },
        });
      }
    });

    return NextResponse.json({ message: "Produto excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
