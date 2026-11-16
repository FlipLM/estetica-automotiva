import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import {
  formatDateInputValue,
  parseRangeEnd,
  parseRangeStart,
} from "@/lib/date-utils";
import { roundMoney } from "@/lib/payment-fees";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const dateParam =
      searchParams.get("date") || formatDateInputValue(new Date());

    let dayStart: Date;
    let dayEnd: Date;
    try {
      dayStart = parseRangeStart(dateParam);
      dayEnd = parseRangeEnd(dateParam);
    } catch {
      return NextResponse.json(
        { error: "Data inválida. Use o formato YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const [paymentsRaw, expensesRaw] = await Promise.all([
      prisma.payment.findMany({
        where: {
          serviceOrder: {
            tenantId,
            status: { not: "CANCELLED" },
          },
          paidAt: { gte: dayStart, lte: dayEnd },
        },
        select: {
          id: true,
          amount: true,
          method: true,
          installments: true,
          feeRate: true,
          feeAmount: true,
          netAmount: true,
          paidAt: true,
          notes: true,
          serviceOrder: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              vehicle: {
                select: {
                  plate: true,
                  model: true,
                  brand: true,
                  customer: { select: { name: true } },
                  customerVehicles: {
                    select: { customer: { select: { name: true } } },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { paidAt: "asc" },
      }),
      prisma.expense.findMany({
        where: {
          tenantId,
          paid: true,
          OR: [
            { paidAt: { gte: dayStart, lte: dayEnd } },
            { paidAt: null, dueDate: { gte: dayStart, lte: dayEnd } },
          ],
        },
        orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    const incomeMethods = [
      "CASH",
      "PIX",
      "DEBIT_CARD",
      "CREDIT_CARD",
      "TRANSFER",
    ] as const;

    const incomeByMethod: Record<
      string,
      {
        method: string;
        count: number;
        grossAmount: number;
        feeAmount: number;
        netAmount: number;
      }
    > = {};

    for (const m of incomeMethods) {
      incomeByMethod[m] = {
        method: m,
        count: 0,
        grossAmount: 0,
        feeAmount: 0,
        netAmount: 0,
      };
    }

    let totalGrossIn = 0;
    let totalCardFees = 0;
    let totalNetIn = 0;

    const payments = paymentsRaw.map((p) => {
      const feeAmount = roundMoney(p.feeAmount || 0);
      const netAmount =
        p.netAmount > 0 ? p.netAmount : roundMoney(p.amount - feeAmount);

      totalGrossIn += p.amount;
      totalCardFees += feeAmount;
      totalNetIn += netAmount;

      if (!incomeByMethod[p.method]) {
        incomeByMethod[p.method] = {
          method: p.method,
          count: 0,
          grossAmount: 0,
          feeAmount: 0,
          netAmount: 0,
        };
      }
      incomeByMethod[p.method].count += 1;
      incomeByMethod[p.method].grossAmount = roundMoney(
        incomeByMethod[p.method].grossAmount + p.amount
      );
      incomeByMethod[p.method].feeAmount = roundMoney(
        incomeByMethod[p.method].feeAmount + feeAmount
      );
      incomeByMethod[p.method].netAmount = roundMoney(
        incomeByMethod[p.method].netAmount + netAmount
      );

      const cust =
        p.serviceOrder.vehicle.customer ||
        p.serviceOrder.vehicle.customerVehicles?.[0]?.customer;

      return {
        id: p.id,
        amount: p.amount,
        method: p.method,
        installments: p.installments || 1,
        feeRate: p.feeRate || 0,
        feeAmount,
        netAmount,
        paidAt: p.paidAt,
        notes: p.notes,
        serviceOrderId: p.serviceOrder.id,
        orderNumber: p.serviceOrder.orderNumber,
        plate: p.serviceOrder.vehicle.plate,
        model: `${p.serviceOrder.vehicle.brand || ""} ${p.serviceOrder.vehicle.model}`.trim(),
        customerName: cust?.name || "Cliente não informado",
      };
    });

    const expenseByMethod: Record<string, number> = {
      CASH: 0,
      PIX: 0,
      BOLETO: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      TRANSFER: 0,
      OTHER: 0,
    };

    let totalOut = 0;
    for (const exp of expensesRaw) {
      totalOut += exp.amount;
      const key =
        exp.paymentMethod && exp.paymentMethod in expenseByMethod
          ? exp.paymentMethod
          : "OTHER";
      expenseByMethod[key] = roundMoney(expenseByMethod[key] + exp.amount);
    }

    totalGrossIn = roundMoney(totalGrossIn);
    totalCardFees = roundMoney(totalCardFees);
    totalNetIn = roundMoney(totalNetIn);
    totalOut = roundMoney(totalOut);

    const cashIn = incomeByMethod.CASH.netAmount;
    const cashOut = expenseByMethod.CASH || 0;
    const cashDrawerBalance = roundMoney(cashIn - cashOut);

    const digitalIn = roundMoney(
      incomeByMethod.PIX.netAmount +
        incomeByMethod.DEBIT_CARD.netAmount +
        incomeByMethod.CREDIT_CARD.netAmount +
        incomeByMethod.TRANSFER.netAmount
    );
    const digitalOut = roundMoney(totalOut - cashOut);
    const digitalBalance = roundMoney(digitalIn - digitalOut);
    const dayNetBalance = roundMoney(totalNetIn - totalOut);

    return NextResponse.json({
      date: dateParam,
      summary: {
        cashIn,
        cashOut,
        cashDrawerBalance,
        digitalIn,
        digitalOut,
        digitalBalance,
        totalGrossIn,
        totalCardFees,
        totalNetIn,
        totalOut,
        dayNetBalance,
        paymentsCount: payments.length,
        expensesCount: expensesRaw.length,
      },
      incomeByMethod: Object.values(incomeByMethod),
      expenseByMethod,
      payments,
      expenses: expensesRaw,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
