import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { signMasterToken, isMasterAuthenticated, MASTER_COOKIE_NAME } from "@/lib/master-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const authState = await isMasterAuthenticated();
  return NextResponse.json(authState);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios para acessar o painel de administração." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Busca usuário administrador no banco de dados
    const user = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        active: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "E-mail não encontrado ou usuário inativo." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso restrito. Este usuário não possui privilégios de Administrador." },
        { status: 403 }
      );
    }

    // 2. Valida a senha digitada
    const passwordValid = await comparePassword(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Senha incorreta. Verifique suas credenciais." },
        { status: 401 }
      );
    }

    // 3. Emite os cookies de autenticação master e geral
    const masterToken = await signMasterToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const generalToken = await signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: "ADMIN",
      tenantName: user.tenant.name,
      plan: user.tenant.plan,
      trialExpiresAt: user.tenant.trialExpiresAt ? user.tenant.trialExpiresAt.toISOString() : null,
      isTrialExpired: false,
      onboardingCompleted: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login de Administrador realizado com sucesso.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Grava cookie master e cookie regular
    response.cookies.set({
      name: MASTER_COOKIE_NAME,
      value: masterToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: generalToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("[MASTER_LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar o login." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
  response.cookies.delete(MASTER_COOKIE_NAME);
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
