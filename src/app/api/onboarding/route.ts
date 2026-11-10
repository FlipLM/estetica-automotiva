import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const onboardingSchema = z.object({
  // Passo 1: Identidade da Estética
  companyName: z.string().min(2, "Nome da empresa é obrigatório."),
  tradingName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional().nullable(),

  // Passo 2: Boxes e Vagas
  boxes: z
    .array(
      z.object({
        name: z.string().min(1, "Nome do box obrigatório."),
        type: z.string().default("GERAL"),
        capacity: z.number().int().min(1).default(1),
        color: z.string().default("#16A36A"),
      })
    )
    .optional()
    .default([]),

  // Passo 3: Colaboradores / Funcionários
  employees: z
    .array(
      z.object({
        name: z.string().min(2, "Nome do colaborador obrigatório."),
        phone: z.string().optional(),
        role: z.enum(["OPERATOR", "ADMIN"]).default("OPERATOR"),
        commissionRate: z.number().min(0).max(100).default(15),
      })
    )
    .optional()
    .default([]),

  // Passo 4: Catálogo de Serviços
  services: z
    .array(
      z.object({
        name: z.string().min(2, "Nome do serviço obrigatório."),
        category: z.string().default("LAVAGEM"),
        priceHatch: z.number().min(0).default(80),
        priceSedan: z.number().min(0).default(100),
        priceSuvPickup: z.number().min(0).default(130),
        estimatedMinutes: z.number().int().min(10).default(60),
        defaultCommission: z.number().min(0).max(100).default(15),
      })
    )
    .optional()
    .default([]),

  // Passo 5: Estoque Inicial
  products: z
    .array(
      z.object({
        name: z.string().min(2, "Nome do produto obrigatório."),
        category: z.string().default("CHEMICAL"),
        unit: z.string().default("ML"),
        currentStock: z.number().min(0).default(1),
        minStock: z.number().min(0).default(1),
        costPrice: z.number().min(0).default(0),
      })
    )
    .optional()
    .default([]),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        workBays: true,
        services: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            commissionRate: true,
          },
        },
        products: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tradingName: tenant.tradingName,
        phone: tenant.phone,
        whatsapp: tenant.whatsapp,
        address: tenant.address,
        logoUrl: tenant.logoUrl,
        onboardingCompleted: tenant.onboardingCompleted,
        boxes: tenant.workBays,
        services: tenant.services,
        employees: tenant.users.filter((u) => u.id !== session.userId),
        products: tenant.products,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const body = await req.json();
    const validated = onboardingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    await prisma.$transaction(async (tx) => {
      // 1. Atualiza dados do Tenant e marca onboarding como concluído
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          name: data.companyName,
          tradingName: data.tradingName || data.companyName,
          phone: data.phone || null,
          whatsapp: data.whatsapp || data.phone || null,
          address: data.address || null,
          logoUrl: data.logoUrl || null,
          onboardingCompleted: true,
        },
      });

      // 2. Se enviou boxes customizados, sincroniza
      if (data.boxes.length > 0) {
        // Remove boxes antigos que não têm OS vinculada
        await tx.workBay.deleteMany({
          where: { tenantId },
        });

        await tx.workBay.createMany({
          data: data.boxes.map((b) => ({
            tenantId,
            name: b.name,
            type: b.type || "GERAL",
            capacity: b.capacity || 1,
            color: b.color || "#16A36A",
            active: true,
          })),
        });
      }

      // 3. Cadastra os Colaboradores informados
      if (data.employees.length > 0) {
        const defaultHash = await hashPassword("123456");
        for (const emp of data.employees) {
          const fakeEmail = `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@detailing.com`;
          await tx.user.create({
            data: {
              tenantId,
              name: emp.name,
              email: fakeEmail,
              passwordHash: defaultHash,
              role: emp.role || "OPERATOR",
              phone: emp.phone || null,
              commissionRate: emp.commissionRate || 15.0,
              active: true,
            },
          });
        }
      }

      // 4. Cadastra ou atualiza os Serviços
      if (data.services.length > 0) {
        await tx.service.deleteMany({
          where: { tenantId },
        });

        await tx.service.createMany({
          data: data.services.map((s) => ({
            tenantId,
            name: s.name,
            category: s.category || "LAVAGEM",
            priceHatch: s.priceHatch,
            priceSedan: s.priceSedan,
            priceSuvPickup: s.priceSuvPickup,
            priceMotorcycle: s.priceHatch * 0.6,
            priceSpecial: s.priceSuvPickup * 1.3,
            estimatedMinutes: s.estimatedMinutes || 60,
            defaultCommission: s.defaultCommission || 15.0,
          })),
        });
      }

      // 5. Cadastra Estoque Inicial
      if (data.products.length > 0) {
        await tx.product.createMany({
          data: data.products.map((p) => ({
            tenantId,
            name: p.name,
            category: p.category || "CHEMICAL",
            unit: p.unit || "ML",
            currentStock: p.currentStock || 0,
            minStock: p.minStock || 1,
            costPrice: p.costPrice || 0,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Configuração inicial da estética automotiva concluída com sucesso!",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
