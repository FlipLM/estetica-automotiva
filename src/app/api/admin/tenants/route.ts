import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const createLeadSchema = z.object({
  companyName: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres."),
  tradingName: z.string().optional(),
  adminName: z.string().min(3, "Nome do contato deve ter no mínimo 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6).optional().default("teste123"),
  phone: z.string().optional(),
  trialDays: z.number().int().min(1).max(90).default(3),
});

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

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const validated = createLeadSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verifica se já existe usuário com esse e-mail
    const existing = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um usuário cadastrado com este e-mail." },
        { status: 409 }
      );
    }

    const plainPassword = data.password || "teste123";
    const passwordHash = await hashPassword(plainPassword);
    const trialExpiresAt = new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria Tenant do Lead
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          tradingName: data.tradingName || data.companyName,
          phone: data.phone,
          whatsapp: data.phone,
          active: true,
          plan: "TRIAL",
          trialExpiresAt,
          isCustomPlan: false,
          onboardingCompleted: false,
        },
      });

      // 2. Cria Usuário Administrador da Oficina
      const adminUser = await tx.user.create({
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

      // 3. Pré-configuração Padrão do Pátio (Boxes Iniciais)
      await tx.workBay.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: "Box 01 - Lavagem & Detalhamento",
            type: "LAVAGEM",
            color: "#3B82F6",
            capacity: 1,
            active: true,
          },
          {
            tenantId: tenant.id,
            name: "Box 02 - Polimento Técnico",
            type: "POLIMENTO",
            color: "#D97706",
            capacity: 1,
            active: true,
          },
          {
            tenantId: tenant.id,
            name: "Box 03 - Vitrificação & Secagem",
            type: "GERAL",
            color: "#16A36A",
            capacity: 1,
            active: true,
          },
        ],
      });

      // 4. Catálogo de Serviços Essenciais
      await tx.service.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: "Lavagem Técnica Detalhada",
            category: "LAVAGEM",
            estimatedMinutes: 90,
            priceHatch: 90.0,
            priceSedan: 110.0,
            priceSuvPickup: 140.0,
            priceMotorcycle: 60.0,
            priceSpecial: 180.0,
            defaultCommission: 15.0,
          },
          {
            tenantId: tenant.id,
            name: "Polimento Comercial (Brilho & Proteção)",
            category: "POLIMENTO",
            estimatedMinutes: 180,
            priceHatch: 450.0,
            priceSedan: 550.0,
            priceSuvPickup: 680.0,
            priceMotorcycle: 250.0,
            priceSpecial: 850.0,
            defaultCommission: 20.0,
          },
          {
            tenantId: tenant.id,
            name: "Higienização Interna Completa",
            category: "HIGIENIZACAO",
            estimatedMinutes: 240,
            priceHatch: 350.0,
            priceSedan: 420.0,
            priceSuvPickup: 500.0,
            priceMotorcycle: 150.0,
            priceSpecial: 600.0,
            defaultCommission: 15.0,
          },
          {
            tenantId: tenant.id,
            name: "Vitrificação Cerâmica 9H (Pintura)",
            category: "VITRIFICACAO",
            estimatedMinutes: 360,
            priceHatch: 1200.0,
            priceSedan: 1450.0,
            priceSuvPickup: 1750.0,
            priceMotorcycle: 600.0,
            priceSpecial: 2200.0,
            defaultCommission: 20.0,
          },
        ],
      });

      return { tenant, user: adminUser };
    });

    const accessUrl = "https://detailpro.duckdns.org/login";

    const whatsappMessage = `Olá, *${data.adminName}*!\n\nSeu acesso exclusivo para testar o *DetailPro SaaS* para a estética *${data.companyName}* já está liberado por *${data.trialDays} dias*!\n\n🔗 *Link de Acesso*: ${accessUrl}\n👤 *E-mail*: ${data.email}\n🔑 *Senha*: ${plainPassword}\n\nAo entrar pela primeira vez, você passará por um passo a passo rápido para personalizar o logotipo da sua estética, quantidade de boxes e serviços. Qualquer dúvida estamos à disposição!`;

    return NextResponse.json({
      success: true,
      message: `Acesso temporário de ${data.trialDays} dias gerado com sucesso!`,
      lead: {
        tenantId: result.tenant.id,
        companyName: result.tenant.name,
        adminName: result.user.name,
        email: result.user.email,
        plainPassword,
        phone: data.phone,
        trialDays: data.trialDays,
        trialExpiresAt,
        accessUrl,
        whatsappMessage,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

