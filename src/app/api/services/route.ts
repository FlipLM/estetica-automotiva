import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const recipeItemSchema = z.object({
  productId: z.string().uuid("Produto inválido na ficha técnica."),
  quantityPerService: z.number().positive("Quantidade do insumo deve ser maior que zero."),
  notes: z.string().trim().max(200).nullish(),
});

const serviceCreateSchema = z.object({
  name: z.string().min(2, "Nome do serviço deve ter no mínimo 2 caracteres."),
  description: z.string().optional().nullable(),
  category: z.enum(["LAVAGEM", "HIGIENIZACAO", "POLIMENTO", "PROTECAO", "OUTROS"], {
    errorMap: () => ({ message: "Categoria de serviço inválida." }),
  }),
  estimatedMinutes: z.number().int().min(5, "Tempo estimado mínimo de 5 minutos."),
  priceHatch: z.number().min(0, "Preço Hatch inválido."),
  priceSedan: z.number().min(0, "Preço Sedan inválido."),
  priceSuvPickup: z.number().min(0, "Preço SUV/Picape inválido."),
  priceMotorcycle: z.number().min(0, "Preço Moto inválido."),
  priceSpecial: z.number().min(0, "Preço Especial inválido."),
  estimatedCost: z.number().min(0).optional().default(0),
  defaultCommission: z.number().min(0).max(100).optional().default(10),
  maintenanceIntervalDays: z
    .union([
      z.number().int().min(1, "Ciclo mínimo de 1 dia.").max(3650, "Ciclo máximo de 3650 dias."),
      z.null(),
    ])
    .optional(),
  active: z.boolean().optional().default(true),
  recipes: z.array(recipeItemSchema).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId, role } = session;
    const isAdmin = role === "ADMIN";

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") === "true";

    const rawServices = await prisma.service.findMany({
      where: {
        tenantId,
        category: category || undefined,
        active: activeOnly ? true : undefined,
      },
      include: {
        recipes: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                costPrice: true,
                currentStock: true,
                active: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const services = rawServices.map((s) => ({
      ...s,
      estimatedCost: isAdmin ? s.estimatedCost : 0,
      recipes: s.recipes.map((r) => ({
        id: r.id,
        productId: r.productId,
        quantityPerService: r.quantityPerService,
        notes: r.notes,
        product: {
          ...r.product,
          costPrice: isAdmin ? r.product.costPrice : 0,
        },
      })),
    }));

    return NextResponse.json({ services });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Apenas Administradores podem cadastrar novos serviços e definir tabela de preços
    const session = await requireAdmin();
    const { tenantId } = session;

    const body = await req.json();
    const validated = serviceCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    const recipeList = data.recipes ?? [];

    // Dedup por productId e validação multi-tenant dos insumos vinculados
    const uniqueRecipes = new Map<string, { productId: string; quantityPerService: number; notes: string | null }>();
    for (const r of recipeList) {
      uniqueRecipes.set(r.productId, {
        productId: r.productId,
        quantityPerService: r.quantityPerService,
        notes: r.notes?.trim() || null,
      });
    }

    let calculatedRecipeCost = 0;
    if (uniqueRecipes.size > 0) {
      const productIds = Array.from(uniqueRecipes.keys());
      const validProducts = await prisma.product.findMany({
        where: { tenantId, id: { in: productIds } },
        select: { id: true, costPrice: true },
      });
      if (validProducts.length !== productIds.length) {
        return NextResponse.json(
          { error: "Um ou mais produtos da ficha técnica não foram encontrados." },
          { status: 400 }
        );
      }
      const priceMap = new Map(validProducts.map((p) => [p.id, p.costPrice]));
      Array.from(uniqueRecipes.values()).forEach((r) => {
        calculatedRecipeCost += r.quantityPerService * (priceMap.get(r.productId) || 0);
      });
    }

    const effectiveEstimatedCost =
      data.estimatedCost > 0
        ? data.estimatedCost
        : Math.round(calculatedRecipeCost * 100) / 100;

    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.service.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description || null,
          category: data.category,
          estimatedMinutes: data.estimatedMinutes,
          priceHatch: data.priceHatch,
          priceSedan: data.priceSedan,
          priceSuvPickup: data.priceSuvPickup,
          priceMotorcycle: data.priceMotorcycle,
          priceSpecial: data.priceSpecial,
          estimatedCost: effectiveEstimatedCost,
          defaultCommission: data.defaultCommission,
          maintenanceIntervalDays: data.maintenanceIntervalDays ?? null,
          active: data.active,
        },
      });

      if (uniqueRecipes.size > 0) {
        await tx.serviceProductRecipe.createMany({
          data: Array.from(uniqueRecipes.values()).map((r) => ({
            tenantId,
            serviceId: created.id,
            productId: r.productId,
            quantityPerService: r.quantityPerService,
            notes: r.notes,
          })),
        });
      }

      return tx.service.findUnique({
        where: { id: created.id },
        include: {
          recipes: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  costPrice: true,
                  currentStock: true,
                  active: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

