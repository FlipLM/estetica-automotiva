import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth();
    const { tenantId, role, userId } = session;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Dados Operacionais do Pátio (Visíveis tanto para ADMIN quanto para OPERATOR)
    const [todoCount, inProgressCount, doneCount, paidCount, myAssignedCount] = await Promise.all([
      prisma.serviceOrder.count({ where: { tenantId, status: "TODO" } }),
      prisma.serviceOrder.count({ where: { tenantId, status: "IN_PROGRESS" } }),
      prisma.serviceOrder.count({ where: { tenantId, status: "DONE" } }),
      prisma.serviceOrder.count({ where: { tenantId, status: "PAID" } }),
      prisma.serviceOrder.count({
        where: { tenantId, assignedUserId: userId, status: { in: ["TODO", "IN_PROGRESS"] } },
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
        const cust = os.vehicle.customer || os.vehicle.customerVehicles?.[0]?.customer;
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

    // 2. Dados Financeiros Exclusivos para ADMINISTRADORES
    const [ordersToday, orders7Days, ordersMonth, allPaidOrders, expensesMonth] = await Promise.all([
      prisma.serviceOrder.findMany({
        where: { tenantId, status: "PAID", paidAt: { gte: startOfToday } },
        select: { totalAmount: true },
      }),
      prisma.serviceOrder.findMany({
        where: { tenantId, status: "PAID", paidAt: { gte: sevenDaysAgo } },
        select: { totalAmount: true },
      }),
      prisma.serviceOrder.findMany({
        where: { tenantId, status: "PAID", paidAt: { gte: startOfMonth } },
        select: { totalAmount: true },
      }),
      prisma.serviceOrder.findMany({
        where: { tenantId, status: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.expense.findMany({
        where: { tenantId, dueDate: { gte: startOfMonth }, paid: true },
        select: { amount: true, category: true },
      }),
    ]);

    const revenueToday = ordersToday.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const revenue7Days = orders7Days.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const revenueMonth = ordersMonth.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const totalPaidOrdersCount = allPaidOrders.length;
    const totalPaidRevenue = allPaidOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const averageTicket = totalPaidOrdersCount > 0 ? totalPaidRevenue / totalPaidOrdersCount : 0;

    const totalExpensesMonth = expensesMonth.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfitMonth = revenueMonth - totalExpensesMonth;
    const profitMargin = revenueMonth > 0 ? (netProfitMonth / revenueMonth) * 100 : 0;

    const [totalCustomers, totalVehicles] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.vehicle.count({ where: { tenantId } }),
    ]);

    return NextResponse.json({
      ...baseResponse,
      financial: {
        revenueToday,
        revenue7Days,
        revenueMonth,
        averageTicket,
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
