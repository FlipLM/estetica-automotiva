import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING | PAID
    const filterUserId = searchParams.get("userId");

    // Condição de busca de acordo com o papel do usuário
    const whereCondition: any = {
      serviceOrder: {
        tenantId: session.tenantId,
      },
    };

    if (session.role === "OPERATOR") {
      // Operador enxerga exclusivamente suas próprias comissões
      whereCondition.userId = session.userId;
    } else if (filterUserId) {
      whereCondition.userId = filterUserId;
    }

    if (status) {
      whereCondition.status = status;
    }

    const commissions = await prisma.commission.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            completedAt: true,
            totalAmount: true,
            vehicle: {
              select: {
                plate: true,
                model: true,
                customer: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Métricas resumidas
    const totalAmount = commissions.reduce((acc, c) => acc + c.amount, 0);
    const pendingAmount = commissions
      .filter((c) => c.status === "PENDING")
      .reduce((acc, c) => acc + c.amount, 0);
    const paidAmount = commissions
      .filter((c) => c.status === "PAID")
      .reduce((acc, c) => acc + c.amount, 0);

    return NextResponse.json({
      summary: {
        totalAmount,
        pendingAmount,
        paidAmount,
        totalCount: commissions.length,
      },
      commissions,
    });
  } catch (error: any) {
    console.error("Erro ao listar comissões:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

const settleCommissionSchema = z.object({
  commissionIds: z.array(z.string()).min(1),
  createExpense: z.boolean().default(true),
  paymentMethod: z.string().default("PIX"),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem liquidar comissões" }, { status: 403 });
    }

    const body = await request.json();
    const { commissionIds, createExpense, paymentMethod } = settleCommissionSchema.parse(body);

    // Valida se as comissões pertencem ao tenant do admin
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        id: { in: commissionIds },
        status: "PENDING",
        serviceOrder: {
          tenantId: session.tenantId,
        },
      },
      include: {
        user: true,
        serviceOrder: true,
      },
    });

    if (pendingCommissions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma comissão pendente encontrada para os IDs informados" },
        { status: 400 }
      );
    }

    const totalToSettle = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    const now = new Date();

    // Executa em transação a liquidação e criação de despesa se solicitado
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza comissões para PAID
      const updated = await tx.commission.updateMany({
        where: {
          id: { in: pendingCommissions.map((c) => c.id) },
        },
        data: {
          status: "PAID",
          paidAt: now,
        },
      });

      // 2. Se marcado para criar despesa no fluxo de caixa/DRE
      let createdExpense = null;
      if (createExpense && totalToSettle > 0) {
        const collaboratorNames = Array.from(new Set(pendingCommissions.map((c) => c.user.name))).join(", ");
        createdExpense = await tx.expense.create({
          data: {
            tenantId: session.tenantId,
            description: `Liquidação de Comissões (${pendingCommissions.length} itens) - ${collaboratorNames}`,
            amount: totalToSettle,
            category: "COMMISSION",
            dueDate: now,
            paid: true,
            paidAt: now,
            paymentMethod,
            notes: `Comissões das OS: ${pendingCommissions.map((c) => `#${c.serviceOrder.orderNumber}`).join(", ")}`,
          },
        });
      }

      return {
        settledCount: updated.count,
        totalAmountSettled: totalToSettle,
        expenseId: createdExpense?.id || null,
      };
    });

    return NextResponse.json({
      message: `${result.settledCount} comissão(ões) liquidada(s) com sucesso`,
      ...result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }
    console.error("Erro ao liquidar comissões:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

