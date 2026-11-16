import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  getPeriodDateRange,
  getTodayEnd,
  getTodayStart,
} from "@/lib/date-utils";
import { roundMoney } from "@/lib/payment-fees";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const { tenantId, role, userId } = session;

    const now = new Date();
    const startOfToday = getTodayStart(now);
    const endOfToday = getTodayEnd(now);
    const { startDate: sevenDaysAgo } = getPeriodDateRange({
      period: "7_days",
      reference: now,
    });
    const { startDate: startOfMonth, endDate: endOfMonth } = getPeriodDateRange({
      period: "current_month",
      reference: now,
    });

    // 1. Dados Operacionais do Pátio (Visíveis tanto para ADMIN quanto para OPERATOR)
    const [todoCount, inProgressCount, doneCount, paidCount, myAssignedCount] =
      await Promise.all([
        prisma.serviceOrder.count({ where: { tenantId, status: "TODO" } }),
        prisma.serviceOrder.count({ where: { tenantId, status: "IN_PROGRESS" } }),
        prisma.serviceOrder.count({ where: { tenantId, status: "DONE" } }),
        prisma.serviceOrder.count({ where: { tenantId, status: "PAID" } }),
        prisma.serviceOrder.count({
          where: {
            tenantId,
            assignedUserId: userId,
            status: { in: ["TODO", "IN_PROGRESS"] },
          },
        }),
      ]);

    // Últimos veículos em atendimento no pátio
    const recentOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: { in: ["TODO", "IN_PROGRESS", "DONE"] },
      },
      include: {
        vehicle: {
          include: {
            customer: true,
            customerVehicles: {
              include: { customer: true },
            },
          },
        },
        items: true,
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const baseResponse = {
      role,
      patio: {
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        paid: paidCount,
        totalActive: todoCount + inProgressCount + doneCount,
        myAssigned: myAssignedCount,
      },
      recentOrders: recentOrders.map((os) => {
        const cust =
          os.vehicle.customer || os.vehicle.customerVehicles?.[0]?.customer;
        return {
          id: os.id,
          orderNumber: os.orderNumber,
          plate: os.vehicle.plate,
          model: `${os.vehicle.brand || ""} ${os.vehicle.model}`.trim(),
          category: os.vehicle.category,
          customerName: cust?.name || "Não informado",
          customerPhone: cust?.whatsapp || cust?.phone || "",
          status: os.status,
          box: os.box || "Geral",
          totalAmount: role === "ADMIN" ? os.totalAmount : null,
          paidAmount: role === "ADMIN" ? os.paidAmount : null,
          mainService: os.items[0]?.serviceName || "Serviço Geral",
          assignedTo: os.assignedUser?.name || "Não atribuído",
          createdAt: os.createdAt,
        };
      }),
    };

    // Se for OPERATOR, finaliza aqui e NÃO expõe dados financeiros
    if (role !== "ADMIN") {
      return NextResponse.json({
        ...baseResponse,
        financial: null,
      });
    }

    // 2. Dados Financeiros Exclusivos para ADMINISTRADORES (Regime de Caixa real via Payment)
    const [
      paymentsTodayAgg,
      payments7DaysAgg,
      paymentsMonthAgg,
      ordersMonthAgg,
      expensesMonthAgg,
      totalCustomers,
      totalVehicles,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          serviceOrder: { tenantId, status: { not: "CANCELLED" } },
          paidAt: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { amount: true, feeAmount: true },
      }),
      prisma.payment.aggregate({
        where: {
          serviceOrder: { tenantId, status: { not: "CANCELLED" } },
          paidAt: { gte: sevenDaysAgo, lte: endOfToday },
        },
        _sum: { amount: true, feeAmount: true },
      }),
      prisma.payment.aggregate({
        where: {
          serviceOrder: { tenantId, status: { not: "CANCELLED" } },
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true, feeAmount: true },
      }),
      prisma.serviceOrder.aggregate({
        where: {
          tenantId,
          status: "PAID",
          paidAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.expense.aggregate({
        where: {
          tenantId,
          paid: true,
          OR: [
            { paidAt: { gte: startOfMonth, lte: endOfMonth } },
            { paidAt: null, dueDate: { gte: startOfMonth, lte: endOfMonth } },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.vehicle.count({ where: { tenantId } }),
    ]);

    const revenueToday = roundMoney(
      (paymentsTodayAgg._sum.amount || 0) -
        (paymentsTodayAgg._sum.feeAmount || 0)
    );
    const revenue7Days = roundMoney(
      (payments7DaysAgg._sum.amount || 0) -
        (payments7DaysAgg._sum.feeAmount || 0)
    );
    const revenueMonth = roundMoney(
      (paymentsMonthAgg._sum.amount || 0) -
        (paymentsMonthAgg._sum.feeAmount || 0)
    );

    const ordersMonthTotal = ordersMonthAgg._sum.totalAmount || 0;
    const ordersMonthCount = ordersMonthAgg._count._all || 0;
    const averageTicketMonth =
      ordersMonthCount > 0 ? ordersMonthTotal / ordersMonthCount : 0;

    const totalExpensesMonth = roundMoney(expensesMonthAgg._sum.amount || 0);
    const netProfitMonth = roundMoney(revenueMonth - totalExpensesMonth);
    const profitMargin =
      revenueMonth > 0 ? (netProfitMonth / revenueMonth) * 100 : 0;

    return NextResponse.json({
      ...baseResponse,
      financial: {
        revenueToday,
        revenue7Days,
        revenueMonth,
        averageTicket: averageTicketMonth,
        averageTicketMonth,
        totalExpensesMonth,
        netProfitMonth,
        profitMargin,
        totalCustomers,
        totalVehicles,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
