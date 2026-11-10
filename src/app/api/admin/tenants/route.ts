import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
            serviceOrders: true,
          },
        },
      },
    });

    const formatted = tenants.map((t) => {
      const isExpired =
        t.plan === "TRIAL" &&
        t.trialExpiresAt &&
        new Date() > new Date(t.trialExpiresAt);

      let remainingHours = 0;
      if (t.plan === "TRIAL" && t.trialExpiresAt) {
        const diffMs = new Date(t.trialExpiresAt).getTime() - Date.now();
        remainingHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
      }

      const mainUser = t.users.find((u) => u.role === "ADMIN") || t.users[0];

      return {
        id: t.id,
        name: t.name,
        tradingName: t.tradingName,
        document: t.document,
        phone: t.phone,
        plan: t.plan,
        isCustomPlan: t.isCustomPlan,
        trialExpiresAt: t.trialExpiresAt,
        isExpired: !!isExpired,
        remainingHours,
        createdAt: t.createdAt,
        owner: mainUser
          ? {
              name: mainUser.name,
              email: mainUser.email,
              phone: mainUser.phone,
            }
          : null,
        stats: {
          vehiclesCount: t._count.vehicles,
          ordersCount: t._count.serviceOrders,
          usersCount: t.users.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      tenants: formatted,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
