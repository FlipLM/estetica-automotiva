import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateExpenseSchema = z.object({
  description: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  category: z.enum([
    "PRODUCTS",
    "SALARY",
    "COMMISSION",
    "RENT",
    "UTILITIES",
    "MAINTENANCE",
    "MARKETING",
    "OTHER",
  ]).optional(),
  dueDate: z.string().optional(),
  paid: z.boolean().optional(),
  paidAt: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
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
      return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    });

    if (!expense) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateExpenseSchema.parse(body);

    const updateData: any = { ...validated };
    if (validated.dueDate) {
      updateData.dueDate = new Date(validated.dueDate);
    }
    if (validated.paid === true && !validated.paidAt) {
      updateData.paidAt = new Date();
    } else if (validated.paid === false) {
      updateData.paidAt = null;
    } else if (validated.paidAt) {
      updateData.paidAt = new Date(validated.paidAt);
    }

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Despesa atualizada com sucesso",
      expense: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }
    console.error("Erro ao atualizar despesa:", error);
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

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem excluir despesas" }, { status: 403 });
    }

    const expense = await prisma.expense.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    });

    if (!expense) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Despesa excluída com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir despesa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

