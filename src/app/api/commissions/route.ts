import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPeriodDateRange } from "@/lib/date-utils";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING | PAID | ALL
    const filterUserId = searchParams.get("userId");
    const period = searchParams.get("period");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "50");

    const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam >= 1
        ? Math.min(200, Math.floor(limitParam))
        : 50;

    // Condição base (sem o filtro de status, para manter os cards de resumo íntegros)
    const baseWhere: any = {
      serviceOrder: {
        tenantId: session.tenantId,
      },
    };

    if (session.role === "OPERATOR") {
      // Operador enxerga exclusivamente suas próprias comissões
      baseWhere.userId = session.userId;
    } else if (filterUserId && filterUserId !== "ALL") {
      baseWhere.userId = filterUserId;
    }

    if ((period && period !== "all") || startDateParam || endDateParam) {
      try {
        const range = getPeriodDateRange({
          period,
          startDate: startDateParam,
          endDate: endDateParam,
        });
        baseWhere.createdAt = { gte: range.startDate, lte: range.endDate };
      } catch {
        return NextResponse.json(
          { error: "Parâmetros de período inválidos." },
          { status: 400 }
        );
      }
    }

    const listWhere: any = { ...baseWhere };
    if (status === "PENDING" || status === "PAID") {
      listWhere.status = status;
    }

    const [groupedSummary, filteredCount, commissions] = await Promise.all([
      prisma.commission.groupBy({
        by: ["status"],
        where: baseWhere,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.commission.count({ where: listWhere }),
      prisma.commission.findMany({
        where: listWhere,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    let pendingAmount = 0;
    let paidAmount = 0;
    let totalCount = 0;

    for (const row of groupedSummary) {
      const amount = row._sum.amount || 0;
      const count = row._count._all || 0;
      totalCount += count;
      if (row.status === "PENDING") {
        pendingAmount += amount;
      } else if (row.status === "PAID") {
        paidAmount += amount;
      }
    }

    const totalAmount = pendingAmount + paidAmount;
    const isAdmin = session.role === "ADMIN";

    // RBAC: Oculta faturamento bruto da OS para OPERATOR
    const sanitizedCommissions = commissions.map((c) => ({
      ...c,
      serviceOrder: {
        ...c.serviceOrder,
        totalAmount: isAdmin ? c.serviceOrder.totalAmount : null,
      },
    }));

    return NextResponse.json({
      role: session.role,
      summary: {
        totalAmount,
        pendingAmount,
        paidAmount,
        totalCount,
      },
      pagination: {
        page,
        limit,
        totalItems: filteredCount,
        totalPages: Math.max(1, Math.ceil(filteredCount / limit)),
      },
      commissions: sanitizedCommissions,
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
      return NextResponse.json(
        { error: "Apenas administradores podem liquidar comissões" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { commissionIds, createExpense, paymentMethod } =
      settleCommissionSchema.parse(body);

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
        const collaboratorNames = Array.from(
          new Set(pendingCommissions.map((c) => c.user.name))
        ).join(", ");
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
            notes: `Comissões das OS: ${pendingCommissions
              .map((c) => `#${c.serviceOrder.orderNumber}`)
              .join(", ")}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId,
          userId: session.userId,
          action: "SETTLE_COMMISSIONS",
          entity: "Commission",
          entityId: createdExpense?.id || pendingCommissions[0].id,
          details: JSON.stringify({
            settledCount: updated.count,
            totalToSettle,
            paymentMethod,
            expenseId: createdExpense?.id || null,
          }),
        },
      });

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
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao liquidar comissões:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
