import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import {
  addMonthsPreservingDay,
  getPeriodDateRange,
  getTodayStart,
  parseDateInput,
} from "@/lib/date-utils";

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
  amount: z.coerce.number().positive("Valor da despesa deve ser positivo."),
  dueDate: z.string(),
  paid: z.boolean().default(true),
  paidAt: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  supplier: z.string().max(120).optional().nullable(),
  notes: z.string().optional().nullable(),
  recurrenceType: z
    .enum(["SINGLE", "INSTALLMENT", "RECURRING"])
    .default("SINGLE"),
  totalInstallments: z.coerce.number().int().min(1).max(48).optional().default(1),
  amountMode: z
    .enum(["TOTAL", "INSTALLMENT_VALUE"])
    .optional()
    .default("INSTALLMENT_VALUE"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "ALL"; // ALL | PAID | PENDING | OVERDUE
    const period = searchParams.get("period"); // current_month | last_month | 7_days | year | all
    const month = searchParams.get("month"); // Formato legado: YYYY-MM
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const q = (searchParams.get("q") || "").trim();

    const pageParam = Number(searchParams.get("page") || "1");
    const limitParam = Number(searchParams.get("limit") || "50");
    const page =
      Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam >= 1
        ? Math.min(200, Math.floor(limitParam))
        : 50;

    const todayStart = getTodayStart();

    // Monta filtro de período sem bug de UTC-3
    let rangeFilter: { startDate: Date; endDate: Date } | null = null;
    if (
      (period && period !== "all") ||
      month ||
      startDateParam ||
      endDateParam
    ) {
      try {
        const range = getPeriodDateRange({
          period,
          month,
          startDate: startDateParam,
          endDate: endDateParam,
        });
        rangeFilter = { startDate: range.startDate, endDate: range.endDate };
      } catch {
        return NextResponse.json(
          { error: "Parâmetros de período inválidos." },
          { status: 400 }
        );
      }
    }

    const baseAndConditions: any[] = [{ tenantId }];

    if (category && category !== "ALL") {
      baseAndConditions.push({ category });
    }

    if (q) {
      baseAndConditions.push({
        OR: [
          { description: { contains: q } },
          { supplier: { contains: q } },
          { notes: { contains: q } },
        ],
      });
    }

    if (rangeFilter) {
      const { startDate, endDate } = rangeFilter;
      if (status === "PAID") {
        baseAndConditions.push({
          OR: [
            { paidAt: { gte: startDate, lte: endDate } },
            { paidAt: null, dueDate: { gte: startDate, lte: endDate } },
          ],
        });
      } else if (status === "PENDING" || status === "OVERDUE") {
        baseAndConditions.push({
          dueDate: { gte: startDate, lte: endDate },
        });
      } else {
        baseAndConditions.push({
          OR: [
            { dueDate: { gte: startDate, lte: endDate } },
            { paid: true, paidAt: { gte: startDate, lte: endDate } },
          ],
        });
      }
    }

    const baseWhere =
      baseAndConditions.length === 1
        ? baseAndConditions[0]
        : { AND: baseAndConditions };

    // Condições específicas para totais (mantendo o recorte de período/categoria/busca)
    const buildSummaryWhere = (extra: any) => {
      const conds = [
        { tenantId },
        ...(category && category !== "ALL" ? [{ category }] : []),
        ...(q
          ? [
              {
                OR: [
                  { description: { contains: q } },
                  { supplier: { contains: q } },
                  { notes: { contains: q } },
                ],
              },
            ]
          : []),
      ];
      return { AND: [...conds, extra] };
    };

    const paidRangeCond = rangeFilter
      ? {
          OR: [
            { paidAt: { gte: rangeFilter.startDate, lte: rangeFilter.endDate } },
            {
              paidAt: null,
              dueDate: { gte: rangeFilter.startDate, lte: rangeFilter.endDate },
            },
          ],
        }
      : {};

    const dueRangeCond = rangeFilter
      ? { dueDate: { gte: rangeFilter.startDate, lte: rangeFilter.endDate } }
      : {};

    const listAndConditions = [...baseAndConditions];
    if (status === "PAID") {
      listAndConditions.push({ paid: true });
    } else if (status === "OVERDUE") {
      listAndConditions.push({ paid: false, dueDate: { lt: todayStart } });
    } else if (status === "PENDING") {
      listAndConditions.push({ paid: false, dueDate: { gte: todayStart } });
    }

    const listWhere =
      listAndConditions.length === 1
        ? listAndConditions[0]
        : { AND: listAndConditions };

    const [
      expenses,
      filteredCount,
      paidAgg,
      pendingAgg,
      overdueAgg,
      allInScopeAgg,
    ] = await Promise.all([
      prisma.expense.findMany({
        where: listWhere,
        include: {
          stockMovement: {
            select: { id: true, productId: true, type: true },
          },
        },
        orderBy: [{ paid: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where: listWhere }),
      prisma.expense.aggregate({
        where: buildSummaryWhere({ paid: true, ...paidRangeCond }),
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.expense.aggregate({
        where: buildSummaryWhere({
          paid: false,
          dueDate: { gte: todayStart },
          ...(rangeFilter ? { AND: [dueRangeCond] } : {}),
        }),
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.expense.aggregate({
        where: buildSummaryWhere({
          paid: false,
          dueDate: { lt: todayStart },
          ...(rangeFilter ? { AND: [dueRangeCond] } : {}),
        }),
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.expense.aggregate({
        where: baseWhere,
        _sum: { amount: true },
      }),
    ]);

    const paidTotal = paidAgg._sum.amount || 0;
    const pendingTotal = pendingAgg._sum.amount || 0;
    const overdueTotal = overdueAgg._sum.amount || 0;
    const total = allInScopeAgg._sum.amount || 0;

    return NextResponse.json({
      expenses,
      total,
      paidTotal,
      pendingTotal,
      overdueTotal,
      counts: {
        paid: paidAgg._count._all || 0,
        pending: pendingAgg._count._all || 0,
        overdue: overdueAgg._count._all || 0,
      },
      pagination: {
        page,
        limit,
        totalItems: filteredCount,
        totalPages: Math.max(1, Math.ceil(filteredCount / limit)),
      },
    });
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

    if (data.recurrenceType === "INSTALLMENT") {
      if (data.totalInstallments < 2 || data.totalInstallments > 48) {
        return NextResponse.json(
          { error: "Compras parceladas devem ter entre 2 e 48 parcelas." },
          { status: 400 }
        );
      }
    } else if (data.recurrenceType === "RECURRING") {
      if (data.totalInstallments < 2 || data.totalInstallments > 24) {
        return NextResponse.json(
          { error: "Despesas recorrentes devem repetir entre 2 e 24 meses." },
          { status: 400 }
        );
      }
    }

    let firstDueDate: Date;
    let firstPaidAt: Date | null = null;
    try {
      firstDueDate = parseDateInput(data.dueDate);
      firstPaidAt = data.paid
        ? data.paidAt
          ? parseDateInput(data.paidAt)
          : firstDueDate
        : null;
    } catch {
      return NextResponse.json(
        { error: "Data de vencimento ou pagamento inválida." },
        { status: 400 }
      );
    }

    const count =
      data.recurrenceType === "SINGLE" ? 1 : data.totalInstallments;
    const recurrenceGroupId = count > 1 ? randomUUID() : null;

    // Calcula valores das parcelas em centavos para evitar erro de arredondamento
    const amountsInReais: number[] = [];
    if (data.recurrenceType === "INSTALLMENT" && data.amountMode === "TOTAL") {
      const totalCents = Math.round(data.amount * 100);
      const baseCents = Math.floor(totalCents / count);
      const remainderCents = totalCents - baseCents * count;
      for (let i = 0; i < count; i++) {
        const cents = i === count - 1 ? baseCents + remainderCents : baseCents;
        amountsInReais.push(cents / 100);
      }
    } else {
      for (let i = 0; i < count; i++) {
        amountsInReais.push(Math.round(data.amount * 100) / 100);
      }
    }

    const createdExpenses = await prisma.$transaction(async (tx) => {
      const list = [];

      for (let i = 0; i < count; i++) {
        const installmentNumber = count > 1 ? i + 1 : null;
        const dueDate =
          i === 0 ? firstDueDate : addMonthsPreservingDay(firstDueDate, i);
        // Apenas a 1ª parcela respeita o flag paid/paidAt; parcelas futuras nascem em aberto
        const isPaid = i === 0 ? data.paid : false;
        const paidAt = i === 0 ? firstPaidAt : null;

        const description =
          data.recurrenceType === "INSTALLMENT"
            ? `${data.description} (${i + 1}/${count})`
            : data.description;

        const created = await tx.expense.create({
          data: {
            tenantId,
            description,
            category: data.category,
            amount: amountsInReais[i],
            dueDate,
            paid: isPaid,
            paidAt,
            paymentMethod: data.paymentMethod || "PIX",
            supplier: data.supplier?.trim() || null,
            recurrenceGroupId,
            recurrenceType: data.recurrenceType,
            installmentNumber,
            totalInstallments: count > 1 ? count : null,
            notes: data.notes || null,
          },
        });

        list.push(created);
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CREATE_EXPENSE",
          entity: "Expense",
          entityId: list[0].id,
          details: JSON.stringify({
            description: data.description,
            amount: data.amount,
            category: data.category,
            recurrenceType: data.recurrenceType,
            count: list.length,
            recurrenceGroupId,
          }),
        },
      });

      return list;
    });

    return NextResponse.json(
      {
        expense: createdExpenses[0],
        expenses: createdExpenses,
        count: createdExpenses.length,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
