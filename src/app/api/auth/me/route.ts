import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      tenant: {
        select: {
          id: true,
          name: true,
          tradingName: true,
          document: true,
          phone: true,
          whatsapp: true,
          logoUrl: true,
          plan: true,
          trialExpiresAt: true,
          isCustomPlan: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      ...user,
      plan: user.tenant.plan,
      trialExpiresAt: user.tenant.trialExpiresAt,
      isTrialExpired: session.isTrialExpired,
    },
  });
}
