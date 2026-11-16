import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseDateInput } from "@/lib/date-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateExpenseSchema = z.object({
  description: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  category: z
    .enum([
      "PRODUCTS",
      "SALARY",
      "COMMISSION",
      "RENT",
      "UTILITIES",
      "MAINTENANCE",
      "MARKETING",
      "OTHER",
    ])
    .optional(),
  dueDate: z.string().optional(),
  paid: z.boolean().optional(),
  paidAt: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  supplier: z.string().max(120).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso restrito ao administrador" },
        { status: 403 }
      );
    }

    const expense = await prisma.expense.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
      include: {
        stockMovement: { select: { id: true, productId: true, type: true } },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateExpenseSchema.parse(body);

    if (expense.stockMovement) {
      const amountChanged =
        validated.amount !== undefined &&
        Math.abs(validated.amount - expense.amount) > 0.009;
      const categoryChanged =
        validated.category !== undefined && validated.category !== expense.category;
      if (amountChanged || categoryChanged) {
        return NextResponse.json(
          {
            error:
              "Despesa vinculada a entrada de estoque. Edite valor ou quantidade diretamente pela entrada no módulo de Estoque.",
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...validated };
    if (validated.supplier !== undefined) {
      updateData.supplier = validated.supplier?.trim() || null;
    }

    try {
      if (validated.dueDate) {
        updateData.dueDate = parseDateInput(validated.dueDate);
      }
      if (validated.paid === false) {
        updateData.paidAt = null;
      } else if (validated.paid === true) {
        updateData.paidAt = validated.paidAt
          ? parseDateInput(validated.paidAt)
          : expense.paidAt || new Date();
      } else if (validated.paidAt !== undefined) {
        updateData.paidAt = validated.paidAt
          ? parseDateInput(validated.paidAt)
          : null;
      }
    } catch {
      return NextResponse.json(
        { error: "Data de vencimento ou pagamento inválida." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.expense.update({
        where: { id: params.id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "UPDATE_EXPENSE",
          entity: "Expense",
          entityId: params.id,
          details: JSON.stringify({
            before: {
              description: expense.description,
              amount: expense.amount,
              category: expense.category,
              paid: expense.paid,
              paidAt: expense.paidAt,
              dueDate: expense.dueDate,
              supplier: expense.supplier,
            },
            after: {
              description: saved.description,
              amount: saved.amount,
              category: saved.category,
              paid: saved.paid,
              paidAt: saved.paidAt,
              dueDate: saved.dueDate,
              supplier: saved.supplier,
            },
          }),
        },
      });

      return saved;
    });

    return NextResponse.json({
      message: "Despesa atualizada com sucesso",
      expense: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao atualizar despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
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

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir despesas" },
        { status: 403 }
      );
    }

    const expense = await prisma.expense.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
      include: {
        stockMovement: { select: { id: true, productId: true, type: true } },
      },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    if (expense.stockMovement) {
      return NextResponse.json(
        {
          error:
            "Despesa vinculada a entrada de estoque não pode ser excluída pelo Financeiro. Ajuste ou estorne diretamente pela movimentação no módulo de Estoque.",
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") === "future" ? "future" : "single";

    const deletedCount = await prisma.$transaction(async (tx) => {
      let count = 0;

      if (scope === "future" && expense.recurrenceGroupId) {
        const res = await tx.expense.deleteMany({
          where: {
            tenantId: session.tenantId,
            recurrenceGroupId: expense.recurrenceGroupId,
            OR: [
              { id: expense.id },
              { paid: false, dueDate: { gte: expense.dueDate } },
            ],
          },
        });
        count = res.count;
      } else {
        await tx.expense.delete({
          where: { id: params.id },
        });
        count = 1;
      }

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "DELETE_EXPENSE",
          entity: "Expense",
          entityId: params.id,
          details: JSON.stringify({
            scope,
            deletedCount: count,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            recurrenceGroupId: expense.recurrenceGroupId,
          }),
        },
      });

      return count;
    });

    return NextResponse.json({
      message:
        deletedCount > 1
          ? `${deletedCount} parcelas/lançamentos excluídos com sucesso`
          : "Despesa excluída com sucesso",
      deletedCount,
    });
  } catch (error: any) {
    console.error("Erro ao excluir despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
