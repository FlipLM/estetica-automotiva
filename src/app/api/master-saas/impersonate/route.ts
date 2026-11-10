import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAuth } from "@/lib/master-auth";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireMasterAuth();

    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "TenantId é obrigatório." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          where: { role: "ADMIN" },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    const adminUser = tenant.users[0] || (await prisma.user.findFirst({ where: { tenantId } }));

    if (!adminUser) {
      return NextResponse.json({ error: "Nenhum usuário encontrado para esta oficina." }, { status: 404 });
    }

    const sessionPayload = {
      userId: adminUser.id,
      tenantId: tenant.id,
      email: adminUser.email,
      name: `${adminUser.name} (Modo Suporte Master)`,
      role: "ADMIN" as const,
      tenantName: tenant.tradingName || tenant.name,
      plan: tenant.plan,
      trialExpiresAt: tenant.trialExpiresAt ? tenant.trialExpiresAt.toISOString() : null,
      isTrialExpired: false, // Dono do SaaS nunca fica bloqueado em modo suporte
      onboardingCompleted: true,
    };

    const token = await signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: `Acessando oficina ${tenant.name} em Modo Suporte Master.`,
      redirectUrl: "/patio",
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    });

    return response;
  } catch (error: any) {
    console.error("[IMPERSONATE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao entrar na oficina." },
      { status: 500 }
    );
  }
}

