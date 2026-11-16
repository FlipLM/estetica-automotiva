import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  AUTH_COOKIE_NAME,
  comparePassword,
  getSession,
  hashPassword,
  signToken,
} from "@/lib/auth";
import { getClientIp, isRateLimitedAsync } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual."),
  newPassword: z
    .string()
    .min(8, "A nova senha deve ter no mínimo 8 caracteres.")
    .max(128, "A nova senha deve ter no máximo 128 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    if (
      await isRateLimitedAsync(
        `change-pw:${session.userId}:${ip}`,
        10,
        15 * 60 * 1000
      )
    ) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "A nova senha deve ser diferente da senha atual." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        tenantId: session.tenantId,
        active: true,
      },
      include: { tenant: true },
    });

    if (!user || !user.tenant.active) {
      return NextResponse.json(
        { error: "Usuário ou empresa inativos." },
        { status: 401 }
      );
    }

    const passwordValid = await comparePassword(
      currentPassword,
      user.passwordHash
    );
    if (!passwordValid) {
      return NextResponse.json(
        { error: "A senha atual informada está incorreta." },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const saved = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
          mustChangePassword: false,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "CHANGE_PASSWORD",
          entity: "User",
          entityId: user.id,
          details: JSON.stringify({
            email: user.email,
            hadProvisionalPassword: user.mustChangePassword,
          }),
        },
      });

      return saved;
    });

    const isTrialExpired =
      user.tenant.plan === "TRIAL" &&
      !!user.tenant.trialExpiresAt &&
      new Date() > new Date(user.tenant.trialExpiresAt);

    const token = await signToken({
      userId: updatedUser.id,
      tenantId: updatedUser.tenantId,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as "ADMIN" | "OPERATOR",
      tenantName: user.tenant.tradingName || user.tenant.name,
      tenantLogo: user.tenant.logoUrl || null,
      plan: user.tenant.plan,
      trialExpiresAt: user.tenant.trialExpiresAt?.toISOString() || null,
      isTrialExpired,
      onboardingCompleted: user.tenant.onboardingCompleted,
      tokenVersion: updatedUser.tokenVersion,
      mustChangePassword: false,
    });

    const needsOnboarding =
      updatedUser.role === "ADMIN" && !user.tenant.onboardingCompleted;
    const redirect = needsOnboarding
      ? "/onboarding"
      : updatedUser.role === "OPERATOR"
      ? "/patio"
      : "/dashboard";

    const isHttps =
      req.url.startsWith("https://") ||
      req.headers.get("x-forwarded-proto") === "https";

    const response = NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso!",
      redirect,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("[CHANGE_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar a senha." },
      { status: 500 }
    );
  }
}
