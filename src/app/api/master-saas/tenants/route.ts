import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMasterAuth } from "@/lib/master-auth";
import { hashPassword } from "@/lib/auth";
import { randomBytes } from "crypto";

function generateTempPassword(): string {
  // 12 caracteres sem ambiguidade visual (sem 0/O/1/l/I)
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export const dynamic = "force-dynamic";

const createLeadSchema = z.object({
  companyName: z.string().min(3, "Nome da estética deve ter no mínimo 3 caracteres."),
  tradingName: z.string().nullish(),
  adminName: z.string().min(3, "Nome do proprietário deve ter no mínimo 3 caracteres."),
  email: z.string().email("E-mail corporativo inválido."),
  password: z.string().min(8).nullish(),
  phone: z.string().nullish(),
  trialDays: z.number().int().min(1).max(90).nullish().default(3),
});

export async function GET() {
  try {
    await requireMasterAuth();

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
              id: mainUser.id,
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Acesso negado ao Console Master." },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireMasterAuth();

    const body = await req.json();
    const validated = createLeadSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const { companyName, tradingName, adminName, email, password, phone, trialDays } = validated.data;

    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe uma conta cadastrada com este e-mail no sistema." },
        { status: 409 }
      );
    }

    const days = trialDays || 3;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Senha temporária aleatória (não previsível). Pode ser informada manualmente pelo gestor.
    const rawPassword = password || generateTempPassword();
    const passwordHash = await hashPassword(rawPassword);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName.trim(),
          tradingName: (tradingName || companyName).trim(),
          phone: phone ? phone.trim() : null,
          whatsapp: phone ? phone.trim().replace(/\D/g, "") : null,
          plan: "TRIAL",
          trialExpiresAt: expiresAt,
          isCustomPlan: false,
          active: true,
          onboardingCompleted: false, // O lead DEVE passar pelo onboarding após o primeiro login
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: adminName.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: "ADMIN",
          phone: phone ? phone.trim() : null,
          active: true,
        },
      });
      return { tenant, user };
    });

    const host = req.headers.get("host") || "vulpto.duckdns.org";
    const protocol = host.includes("localhost") ? "http" : "https";
    const loginUrl = `${protocol}://${host}/login`;

    const whatsappMessage = `Olá, *${adminName.trim()}*! 👋\n\nSeu acesso exclusivo de avaliação ao *Vulpto* está pronto:\n\n🏢 *Estética:* ${companyName.trim()}\n🌐 *Link de Acesso:* ${loginUrl}\n👤 *Usuário:* ${email.trim()}\n🔑 *Senha Temporária:* ${rawPassword}\n⏳ *Período de Demonstração:* ${days} dias gratuitos\n\nVocê já pode acessar pelo computador ou pelo celular para testar a recepção com vistoria 360º de avarias, fotos, pátio Kanban ao vivo e impressão de orçamentos oficiais.\n\nQualquer dúvida estou à disposição!`;

    return NextResponse.json({
      success: true,
      message: `Acesso temporário de ${days} dias gerado com sucesso!`,
      lead: {
        tenantId: result.tenant.id,
        companyName: result.tenant.name,
        adminName: result.user.name,
        email: result.user.email,
        password: rawPassword,
        trialDays: days,
        trialExpiresAt: expiresAt.toISOString(),
        loginUrl,
        whatsappMessage,
      },
    });
  } catch (error: any) {
    console.error("[MASTER_CREATE_LEAD_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar acesso temporário." },
      { status: 500 }
    );
  }
}

