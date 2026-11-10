import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "current_month"; // current_month | last_month | 7_days | year | all

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (period) {
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case "7_days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
        startDate = new Date(2020, 0, 1);
        break;
      case "current_month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // 1. Receitas: Ordens de Serviço Pagas no Período
    const paidOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: "PAID",
        paidAt: { gte: startDate, lte: endDate },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    const grossRevenue = paidOrders.reduce((acc, curr) => acc + (curr.subtotal || curr.totalAmount), 0);
    const totalDiscounts = paidOrders.reduce((acc, curr) => acc + (curr.discount || 0), 0);
    const netRevenue = paidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const billedVehiclesCount = paidOrders.length;
    const averageTicket = billedVehiclesCount > 0 ? netRevenue / billedVehiclesCount : 0;

    // 2. Despesas Lançadas no Período
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        paid: true,
        dueDate: { gte: startDate, lte: endDate },
      },
    });

    // Categorização de Despesas
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
    expenses.forEach((e) => {
      totalExpenses += e.amount;
      if (expenseBreakdown[e.category as keyof typeof expenseBreakdown] !== undefined) {
        expenseBreakdown[e.category as keyof typeof expenseBreakdown] += e.amount;
      } else {
        expenseBreakdown.OTHER += e.amount;
      }
    });

    // Custos Variáveis (Produtos químicos + Comissões)
    const variableCosts = expenseBreakdown.PRODUCTS + expenseBreakdown.COMMISSION;

    // Custos Fixos (Aluguel, Contas de água/luz, Salários fixos, Manutenção, Marketing, Outros)
    const fixedCosts =
      expenseBreakdown.RENT +
      expenseBreakdown.UTILITIES +
      expenseBreakdown.SALARY +
      expenseBreakdown.MAINTENANCE +
      expenseBreakdown.MARKETING +
      expenseBreakdown.OTHER;

    // Resultados
    const grossProfit = netRevenue - variableCosts;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    const netProfit = netRevenue - totalExpenses;
    const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ordersCount: billedVehiclesCount,
      averageTicket,
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
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

