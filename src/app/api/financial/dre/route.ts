import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import {
  getDaysFromTodayEnd,
  getPeriodDateRange,
  getTodayStart,
} from "@/lib/date-utils";
import { roundMoney } from "@/lib/payment-fees";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get("period") || "current_month";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let range;
    try {
      range = getPeriodDateRange({
        period: periodParam,
        startDate: startDateParam,
        endDate: endDateParam,
      });
    } catch {
      return NextResponse.json(
        { error: "Parâmetros de período inválidos." },
        { status: 400 }
      );
    }

    const { startDate, endDate, period } = range;
    const todayStart = getTodayStart();
    const sevenDaysEnd = getDaysFromTodayEnd(7);

    // Regime de Caixa: despesas pagas cuja data efetiva de pagamento (paidAt) cai no período
    const paidExpenseCashWhere = {
      tenantId,
      paid: true,
      OR: [
        { paidAt: { gte: startDate, lte: endDate } },
        { paidAt: null, dueDate: { gte: startDate, lte: endDate } },
      ],
    };

    const paymentsInPeriodWhere = {
      serviceOrder: { tenantId, status: { not: "CANCELLED" } },
      paidAt: { gte: startDate, lte: endDate },
    };

    const [
      paidOrdersAgg,
      paymentsAgg,
      expensesByCategory,
      paymentsByMethod,
      recentPaymentsRaw,
      readyOrdersRaw,
      readyOrdersAgg,
      inProgressOrdersAgg,
      overdueExpensesAgg,
      upcomingExpensesAgg,
      attentionExpenses,
    ] = await Promise.all([
      // 1. OS completamente quitadas no período (para ticket médio e descontos concedidos)
      prisma.serviceOrder.aggregate({
        where: {
          tenantId,
          status: "PAID",
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          subtotal: true,
          discount: true,
          totalAmount: true,
        },
        _count: { _all: true },
      }),

      // 2. Regime de Caixa real via Payment (inclui sinais/pagamentos parciais recebidos no período)
      prisma.payment.aggregate({
        where: paymentsInPeriodWhere,
        _sum: {
          amount: true,
          feeAmount: true,
          netAmount: true,
        },
        _count: { _all: true },
      }),

      // 3. Despesas pagas agrupadas por categoria (Regime de Caixa)
      prisma.expense.groupBy({
        by: ["category"],
        where: paidExpenseCashWhere,
        _sum: { amount: true },
      }),

      // 4. Entradas por método de pagamento (tabela Payment)
      prisma.payment.groupBy({
        by: ["method"],
        where: paymentsInPeriodWhere,
        _sum: { amount: true, feeAmount: true, netAmount: true },
        _count: { _all: true },
      }),

      // 5. Histórico de recebimentos reais do período
      prisma.payment.findMany({
        where: paymentsInPeriodWhere,
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
              totalAmount: true,
              paidAmount: true,
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
        orderBy: { paidAt: "desc" },
        take: 100,
      }),

      // 6. OS prontas (DONE) aguardando pagamento (A Receber)
      prisma.serviceOrder.findMany({
        where: { tenantId, status: "DONE" },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          paidAmount: true,
          completedAt: true,
          createdAt: true,
          vehicle: {
            select: {
              plate: true,
              model: true,
              brand: true,
              customer: { select: { name: true, phone: true, whatsapp: true } },
              customerVehicles: {
                select: {
                  customer: { select: { name: true, phone: true, whatsapp: true } },
                },
                take: 1,
              },
            },
          },
          items: { select: { serviceName: true } },
        },
        orderBy: { completedAt: "asc" },
        take: 50,
      }),

      // 7. Totais A Receber (DONE - saldo restante)
      prisma.serviceOrder.aggregate({
        where: { tenantId, status: "DONE" },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { _all: true },
      }),

      // 8. Totais em execução no pátio (TODO + IN_PROGRESS - saldo restante)
      prisma.serviceOrder.aggregate({
        where: { tenantId, status: { in: ["TODO", "IN_PROGRESS"] } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: { _all: true },
      }),

      // 9. Contas a Pagar atrasadas
      prisma.expense.aggregate({
        where: {
          tenantId,
          paid: false,
          dueDate: { lt: todayStart },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),

      // 10. Contas a Pagar a vencer (hoje ou futuro)
      prisma.expense.aggregate({
        where: {
          tenantId,
          paid: false,
          dueDate: { gte: todayStart },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),

      // 11. Bloco "Atenção Hoje": despesas em aberto vencidas ou vencendo em até 7 dias
      prisma.expense.findMany({
        where: {
          tenantId,
          paid: false,
          dueDate: { lte: sevenDaysEnd },
        },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
    ]);

    const billedVehiclesCount = paidOrdersAgg._count._all || 0;
    const paidOrdersTotal = paidOrdersAgg._sum.totalAmount || 0;
    const totalDiscounts = paidOrdersAgg._sum.discount || 0;
    const averageTicket =
      billedVehiclesCount > 0 ? paidOrdersTotal / billedVehiclesCount : 0;

    // Recebimentos reais em caixa no período (via Payment)
    const grossReceived = roundMoney(paymentsAgg._sum.amount || 0);
    const cardFees = roundMoney(paymentsAgg._sum.feeAmount || 0);
    const netReceived = roundMoney(grossReceived - cardFees);
    const paymentsCount = paymentsAgg._count._all || 0;

    // Mantém compatibilidade com campos legados usando a base de caixa real
    const grossRevenue = grossReceived;
    const netRevenue = netReceived;

    // Categorização de Despesas Pagas no Período
    const expenseBreakdown = {
      PRODUCTS: 0,
      COMMISSION: 0,
      SALARY: 0,
      RENT: 0,
      UTILITIES: 0,
      MAINTENANCE: 0,
      MARKETING: 0,
      OTHER: 0,
    };

    let totalExpenses = 0;
    for (const row of expensesByCategory) {
      const amount = row._sum.amount || 0;
      totalExpenses += amount;
      if (row.category in expenseBreakdown) {
        expenseBreakdown[row.category as keyof typeof expenseBreakdown] += amount;
      } else {
        expenseBreakdown.OTHER += amount;
      }
    }
    totalExpenses = roundMoney(totalExpenses);

    const variableCosts = roundMoney(
      expenseBreakdown.PRODUCTS + expenseBreakdown.COMMISSION
    );
    const fixedCosts = roundMoney(
      expenseBreakdown.RENT +
        expenseBreakdown.UTILITIES +
        expenseBreakdown.SALARY +
        expenseBreakdown.MAINTENANCE +
        expenseBreakdown.MARKETING +
        expenseBreakdown.OTHER
    );

    const grossProfit = roundMoney(netReceived - variableCosts);
    const grossMargin = netReceived > 0 ? (grossProfit / netReceived) * 100 : 0;

    const netProfit = roundMoney(netReceived - totalExpenses);
    const netMargin = netReceived > 0 ? (netProfit / netReceived) * 100 : 0;

    // Breakdown por método de pagamento (bruto e líquido)
    const paymentMethodBreakdown = {
      PIX: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      CASH: 0,
      TRANSFER: 0,
    };

    const paymentMethodNetBreakdown = {
      PIX: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      CASH: 0,
      TRANSFER: 0,
    };

    for (const row of paymentsByMethod) {
      const gross = row._sum.amount || 0;
      const fee = row._sum.feeAmount || 0;
      const net = roundMoney(gross - fee);
      if (row.method in paymentMethodBreakdown) {
        paymentMethodBreakdown[
          row.method as keyof typeof paymentMethodBreakdown
        ] += gross;
        paymentMethodNetBreakdown[
          row.method as keyof typeof paymentMethodNetBreakdown
        ] += net;
      }
    }

    const readyOrders = readyOrdersRaw.map((o) => {
      const cust = o.vehicle.customer || o.vehicle.customerVehicles?.[0]?.customer;
      const remainingAmount = Math.max(
        0,
        roundMoney(o.totalAmount - (o.paidAmount || 0))
      );
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        paidAmount: o.paidAmount || 0,
        remainingAmount,
        completedAt: o.completedAt,
        createdAt: o.createdAt,
        plate: o.vehicle.plate,
        model: `${o.vehicle.brand || ""} ${o.vehicle.model}`.trim(),
        customerName: cust?.name || "Cliente não informado",
        customerPhone: cust?.whatsapp || cust?.phone || null,
        mainService: o.items[0]?.serviceName || "Serviço Geral",
      };
    });

    const recentPayments = recentPaymentsRaw.map((p) => {
      const cust =
        p.serviceOrder.vehicle.customer ||
        p.serviceOrder.vehicle.customerVehicles?.[0]?.customer;
      const computedNet =
        p.netAmount > 0 ? p.netAmount : roundMoney(p.amount - (p.feeAmount || 0));
      return {
        id: p.id,
        amount: p.amount,
        method: p.method,
        installments: p.installments || 1,
        feeRate: p.feeRate || 0,
        feeAmount: p.feeAmount || 0,
        netAmount: computedNet,
        paidAt: p.paidAt,
        notes: p.notes,
        serviceOrderId: p.serviceOrder.id,
        orderNumber: p.serviceOrder.orderNumber,
        orderStatus: p.serviceOrder.status,
        orderTotalAmount: p.serviceOrder.totalAmount,
        orderPaidAmount: p.serviceOrder.paidAmount,
        plate: p.serviceOrder.vehicle.plate,
        model: `${p.serviceOrder.vehicle.brand || ""} ${p.serviceOrder.vehicle.model}`.trim(),
        customerName: cust?.name || "Cliente não informado",
      };
    });

    const readyTotal = Math.max(
      0,
      roundMoney(
        (readyOrdersAgg._sum.totalAmount || 0) -
          (readyOrdersAgg._sum.paidAmount || 0)
      )
    );
    const inProgressTotal = Math.max(
      0,
      roundMoney(
        (inProgressOrdersAgg._sum.totalAmount || 0) -
          (inProgressOrdersAgg._sum.paidAmount || 0)
      )
    );

    const overdueTotal = overdueExpensesAgg._sum.amount || 0;
    const overdueCount = overdueExpensesAgg._count._all || 0;
    const upcomingTotal = upcomingExpensesAgg._sum.amount || 0;
    const upcomingCount = upcomingExpensesAgg._count._all || 0;

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ordersCount: billedVehiclesCount,
      paymentsCount,
      averageTicket,
      grossReceived,
      cardFees,
      netReceived,
      grossRevenue,
      discounts: totalDiscounts,
      netRevenue,
      variableCosts: {
        products: expenseBreakdown.PRODUCTS,
        commissions: expenseBreakdown.COMMISSION,
        total: variableCosts,
      },
      grossProfit,
      grossMarginPercentage: grossMargin,
      fixedCosts: {
        rent: expenseBreakdown.RENT,
        utilities: expenseBreakdown.UTILITIES,
        salaries: expenseBreakdown.SALARY,
        maintenance: expenseBreakdown.MAINTENANCE,
        marketing: expenseBreakdown.MARKETING,
        other: expenseBreakdown.OTHER,
        total: fixedCosts,
      },
      totalExpenses,
      netProfit,
      netMarginPercentage: netMargin,
      dre: {
        grossReceived,
        cardFees,
        netReceived,
        grossRevenue,
        totalDiscounts,
        netRevenue,
        variableCosts,
        grossProfit,
        grossMargin,
        fixedCosts,
        totalExpenses,
        netProfit,
        netMargin,
        billedVehiclesCount,
        averageTicket,
      },
      expenseBreakdown,
      paymentMethodBreakdown,
      paymentMethodNetBreakdown,
      receivables: {
        readyCount: readyOrdersAgg._count._all || 0,
        readyTotal,
        inProgressCount: inProgressOrdersAgg._count._all || 0,
        inProgressTotal,
        readyOrders,
      },
      payables: {
        overdueCount,
        overdueTotal,
        upcomingCount,
        upcomingTotal,
        pendingTotal: overdueTotal + upcomingTotal,
        attentionExpenses,
      },
      recentPayments,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
