import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

const registerSchema = z.object({
  companyName: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres."),
  tradingName: z.string().optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  adminName: z.string().min(3, "Seu nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("E-mail inválido.").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  website: z.string().max(0, "Detecção anti-bot acionada.").optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (isRateLimited(`register:${getClientIp(req)}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas de cadastro. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verifica se já existe um usuário com esse email globalmente
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado no sistema." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    // Cria apenas o Tenant limpo e o Administrador (sem dados mockados; tudo é configurado no Onboarding)
    const result = await prisma.$transaction(async (tx) => {
      const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 72 horas

      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          tradingName: data.tradingName || data.companyName,
          document: data.document,
          phone: data.phone,
          active: true,
          plan: "TRIAL",
          trialExpiresAt,
          isCustomPlan: false,
          onboardingCompleted: false,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.adminName,
          email: data.email,
          passwordHash,
          role: "ADMIN",
          phone: data.phone,
          active: true,
        },
      });

      return { tenant, user };
    });

    const token = await signToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      name: result.user.name,
      role: "ADMIN",
      tenantName: result.tenant.tradingName || result.tenant.name,
      plan: "TRIAL",
      trialExpiresAt: result.tenant.trialExpiresAt?.toISOString() || null,
      onboardingCompleted: false,
    });

    const isHttps =
      req.url.startsWith("https://") ||
      req.headers.get("x-forwarded-proto") === "https";

    const response = NextResponse.json({
      success: true,
      redirect: "/onboarding",
      message: "Empresa e administrador cadastrados com sucesso!",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          plan: result.tenant.plan,
          trialExpiresAt: result.tenant.trialExpiresAt,
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
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar conta." },
      { status: 500 }
    );
  }
}
