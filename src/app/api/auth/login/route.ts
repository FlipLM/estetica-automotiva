import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    // Busca usuário ativo no banco
    const user = await prisma.user.findFirst({
      where: { email, active: true },
      include: { tenant: true },
    });

    if (!user || !user.tenant.active) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou conta inativa." },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    // Gera o token JWT com os dados da sessão
    const token = await signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "OPERATOR",
      tenantName: user.tenant.tradingName || user.tenant.name,
      plan: user.tenant.plan,
      trialExpiresAt: user.tenant.trialExpiresAt?.toISOString() || null,
    });

    // Registra auditoria de login
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    const isHttps =
      req.url.startsWith("https://") ||
      req.headers.get("x-forwarded-proto") === "https";

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          tradingName: user.tenant.tradingName,
          plan: user.tenant.plan,
          trialExpiresAt: user.tenant.trialExpiresAt,
        },
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

