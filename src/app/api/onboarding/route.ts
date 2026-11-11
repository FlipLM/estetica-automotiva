import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, handleAuthError } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const onboardingSchema = z.object({
  // Passo 1: Identidade da Estética
  companyName: z.string().min(2, "Nome da empresa é obrigatório."),
  tradingName: z.string().nullish(),
  phone: z.string().nullish(),
  whatsapp: z.string().nullish(),
  address: z.string().nullish(),
  logoUrl: z.string().nullish(),

  // Passo 2: Boxes e Vagas
  boxes: z
    .array(
      z.object({
        name: z.string().min(1, "Nome do box obrigatório."),
        type: z.string().nullish().default("GERAL"),
        capacity: z.number().int().min(1).nullish().default(1),
        color: z.string().nullish().default("#16A36A"),
      })
    )
    .nullish()
    .default([]),

  // Passo 3: Colaboradores / Funcionários
  employees: z
    .array(
      z.object({
        name: z.string().min(2, "Nome do colaborador obrigatório."),
        phone: z.string().nullish(),
        role: z.enum(["OPERATOR", "ADMIN"]).nullish().default("OPERATOR"),
        commissionRate: z.number().min(0).max(100).nullish().default(15),
      })
    )
    .nullish()
    .default([]),

  // Passo 4: Catálogo de Serviços
  services: z
    .array(
      z.object({
        name: z.string().min(2, "Nome do serviço obrigatório."),
        category: z.string().nullish().default("LAVAGEM"),
        priceHatch: z.number().min(0).nullish().default(80),
        priceSedan: z.number().min(0).nullish().default(100),
        priceSuvPickup: z.number().min(0).nullish().default(130),
        estimatedMinutes: z.number().int().min(10).nullish().default(60),
        defaultCommission: z.number().min(0).max(100).nullish().default(15),
      })
    )
    .nullish()
    .default([]),

  // Passo 5: Estoque Inicial
  products: z
    .array(
      z.object({
        name: z.string().min(2, "Nome do produto obrigatório."),
        category: z.string().nullish().default("CHEMICAL"),
        unit: z.string().nullish().default("UN"),
        currentStock: z.number().min(0).nullish().default(1),
        minStock: z.number().min(0).nullish().default(1),
        costPrice: z.number().min(0).nullish().default(0),
      })
    )
    .nullish()
    .default([]),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        workBays: { where: { active: true } },
        services: { where: { active: true } },
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
    const session = await requireAdmin();
    const { tenantId } = session;

    const body = await req.json();
    const validated = onboardingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const data = validated.data;

    // 1. Atualiza dados do Tenant e marca onboarding como concluído
    await prisma.tenant.update({
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

    // 2. Sincroniza Boxes (Upsert resiliente para evitar conflitos de FK com OSs existentes)
    if (data.boxes && data.boxes.length > 0) {
      const existingBoxes = await prisma.workBay.findMany({
        where: { tenantId },
      });

      const submittedNames = new Set(data.boxes.map((b) => b.name.trim()));

      for (const boxData of data.boxes) {
        const boxName = boxData.name.trim();
        const existing = existingBoxes.find((b) => b.name === boxName);

        if (existing) {
          await prisma.workBay.update({
            where: { id: existing.id },
            data: {
              type: boxData.type || "GERAL",
              capacity: boxData.capacity || 1,
              color: boxData.color || "#16A36A",
              active: true,
            },
          });
        } else {
          await prisma.workBay.create({
            data: {
              tenantId,
              name: boxName,
              type: boxData.type || "GERAL",
              capacity: boxData.capacity || 1,
              color: boxData.color || "#16A36A",
              active: true,
            },
          });
        }
      }

      // Desativa boxes que não vieram na lista (se houver)
      for (const oldBox of existingBoxes) {
        if (!submittedNames.has(oldBox.name)) {
          try {
            await prisma.workBay.delete({ where: { id: oldBox.id } });
          } catch {
            await prisma.workBay.update({
              where: { id: oldBox.id },
              data: { active: false },
            });
          }
        }
      }
    }

    // 3. Cadastra os Colaboradores informados
    if (data.employees && data.employees.length > 0) {
      const defaultHash = await hashPassword("123456");
      for (const emp of data.employees) {
        if (!emp.name?.trim()) continue;
        const existingUser = await prisma.user.findFirst({
          where: {
            tenantId,
            name: { equals: emp.name.trim() },
          },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              phone: emp.phone || existingUser.phone,
              commissionRate: emp.commissionRate || 15.0,
              role: emp.role || "OPERATOR",
              active: true,
            },
          });
        } else {
          const fakeEmail = `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@detailing.com`;
          await prisma.user.create({
            data: {
              tenantId,
              name: emp.name.trim(),
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
    }

    // 4. Cadastra ou atualiza os Serviços (Upsert resiliente: não deleta itens vinculados a OS)
    if (data.services && data.services.length > 0) {
      const existingServices = await prisma.service.findMany({
        where: { tenantId },
      });

      const submittedServiceNames = new Set(data.services.map((s) => s.name.trim().toLowerCase()));

      for (const srv of data.services) {
        const sName = srv.name.trim();
        const existing = existingServices.find(
          (s) => s.name.trim().toLowerCase() === sName.toLowerCase()
        );

        if (existing) {
          await prisma.service.update({
            where: { id: existing.id },
            data: {
              category: srv.category || "LAVAGEM",
              priceHatch: srv.priceHatch ?? 0,
              priceSedan: srv.priceSedan ?? 0,
              priceSuvPickup: srv.priceSuvPickup ?? 0,
              priceMotorcycle: (srv.priceHatch ?? 0) * 0.6,
              priceSpecial: (srv.priceSuvPickup ?? 0) * 1.3,
              estimatedMinutes: srv.estimatedMinutes || 60,
              defaultCommission: srv.defaultCommission || 15.0,
              active: true,
            },
          });
        } else {
          await prisma.service.create({
            data: {
              tenantId,
              name: sName,
              category: srv.category || "LAVAGEM",
              priceHatch: srv.priceHatch ?? 0,
              priceSedan: srv.priceSedan ?? 0,
              priceSuvPickup: srv.priceSuvPickup ?? 0,
              priceMotorcycle: (srv.priceHatch ?? 0) * 0.6,
              priceSpecial: (srv.priceSuvPickup ?? 0) * 1.3,
              estimatedMinutes: srv.estimatedMinutes || 60,
              defaultCommission: srv.defaultCommission || 15.0,
              active: true,
            },
          });
        }
      }

      // Desativa serviços que não estão mais na lista enviada
      for (const oldSrv of existingServices) {
        if (!submittedServiceNames.has(oldSrv.name.trim().toLowerCase())) {
          try {
            await prisma.service.delete({ where: { id: oldSrv.id } });
          } catch {
            await prisma.service.update({
              where: { id: oldSrv.id },
              data: { active: false },
            });
          }
        }
      }
    }

    // 5. Cadastra ou atualiza Estoque Inicial
    if (data.products && data.products.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: { tenantId },
      });

      const submittedProductNames = new Set(data.products.map((p) => p.name.trim().toLowerCase()));

      for (const prod of data.products) {
        const pName = prod.name.trim();
        const existing = existingProducts.find(
          (p) => p.name.trim().toLowerCase() === pName.toLowerCase()
        );

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              category: prod.category || "CHEMICAL",
              unit: prod.unit || "UN",
              currentStock: prod.currentStock ?? existing.currentStock,
              minStock: prod.minStock ?? existing.minStock,
              costPrice: prod.costPrice ?? existing.costPrice,
            },
          });
        } else {
          await prisma.product.create({
            data: {
              tenantId,
              name: pName,
              category: prod.category || "CHEMICAL",
              unit: prod.unit || "UN",
              currentStock: prod.currentStock || 0,
              minStock: prod.minStock || 1,
              costPrice: prod.costPrice || 0,
            },
          });
        }
      }

      // Se o usuário removeu algum produto do estoque inicial, remove com segurança
      for (const oldProd of existingProducts) {
        if (!submittedProductNames.has(oldProd.name.trim().toLowerCase())) {
          try {
            await prisma.product.delete({ where: { id: oldProd.id } });
          } catch {
            // Se já tem movimentação vinculada, mantém com estoque 0
            await prisma.product.update({
              where: { id: oldProd.id },
              data: { currentStock: 0 },
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configuração da estética automotiva concluída com sucesso!",
    });
  } catch (error: any) {
    console.error("[ONBOARDING_ERROR]", error);
    if (error?.name === "AuthenticationError" || error?.name === "AuthorizationError") {
      return handleAuthError(error);
    }
    return NextResponse.json(
      { error: "Erro interno ao salvar configuração inicial." },
      { status: 500 }
    );
  }
}
