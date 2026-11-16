import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";
import { getPeriodDateRange } from "@/lib/date-utils";

// GET /api/products/movements — Histórico global paginado de movimentações de estoque
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const isAdmin = session.role === "ADMIN";
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      50,
      Math.max(5, Number.parseInt(searchParams.get("limit") || "20", 10) || 20)
    );
    const type = searchParams.get("type");
    const productId = searchParams.get("productId");
    const search = (searchParams.get("search") || "").trim();
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const { startDate: rangeStart, endDate: rangeEnd } = getPeriodDateRange({
      period,
      startDate,
      endDate,
    });

    const whereClause = {
      product: {
        tenantId: session.tenantId,
        ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      },
      createdAt: { gte: rangeStart, lte: rangeEnd },
      ...(type && type !== "ALL" ? { type } : {}),
      ...(productId ? { productId } : {}),
    };

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where: whereClause }),
      prisma.stockMovement.findMany({
        where: whereClause,
        include: {
          product: {
            select: { id: true, name: true, unit: true, category: true },
          },
          user: { select: { id: true, name: true } },
          serviceOrder: {
            select: {
              id: true,
              orderNumber: true,
              vehicle: { select: { plate: true, model: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      movements: movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.product.name,
        productUnit: m.product.unit,
        productCategory: m.product.category,
        type: m.type,
        quantity: m.quantity,
        unitCost: isAdmin ? m.unitCost : null,
        totalCost: isAdmin ? m.totalCost : null,
        reason: !isAdmin && m.type === "IN" ? "Reposição de estoque" : m.reason,
        recovered: m.recovered,
        recoveredAt: m.recoveredAt,
        expenseId: isAdmin ? m.expenseId : null,
        serviceOrderId: m.serviceOrderId,
        serviceOrderNumber: m.serviceOrder?.orderNumber ?? null,
        vehicleLabel: m.serviceOrder?.vehicle
          ? `${m.serviceOrder.vehicle.model} (${m.serviceOrder.vehicle.plate})`
          : null,
        userName: m.user?.name ?? null,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
