import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const expenseCreateSchema = z.object({
  description: z.string().min(2, "Descrição deve ter no mínimo 2 caracteres."),
  category: z.enum([
    "PRODUCTS",
    "SALARY",
    "COMMISSION",
    "RENT",
    "UTILITIES",
    "MAINTENANCE",
    "MARKETING",
    "OTHER",
  ]),
  amount: z.number().positive("Valor da despesa deve ser positivo."),
  dueDate: z.string(),
  paid: z.boolean().default(true),
  paidAt: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const month = searchParams.get("month"); // Formato: YYYY-MM

    let dateFilter: any = undefined;
    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr);
      const m = parseInt(monthStr) - 1;
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0, 23, 59, 59);
      dateFilter = { gte: start, lte: end };
    }

    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        category: category || undefined,
        dueDate: dateFilter,
      },
      orderBy: { dueDate: "desc" },
    });

    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({ expenses, total });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId, userId } = session;

    const body = await req.json();
    const validated = expenseCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const dueDate = new Date(data.dueDate);
    const paidAt = data.paid ? (data.paidAt ? new Date(data.paidAt) : dueDate) : null;

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        description: data.description,
        category: data.category,
        amount: data.amount,
        dueDate,
        paid: data.paid,
        paidAt,
        paymentMethod: data.paymentMethod || "PIX",
        notes: data.notes || null,
      },
    });

    // Registra auditoria
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "CREATE_EXPENSE",
        entity: "Expense",
        entityId: expense.id,
        details: JSON.stringify({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
        }),
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

