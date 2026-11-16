import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const recipeItemSchema = z.object({
  productId: z.string().uuid("Produto inválido na ficha técnica."),
  quantityPerService: z.number().positive("Quantidade do insumo deve ser maior que zero."),
  notes: z.string().trim().max(200).nullish(),
});

const serviceUpdateSchema = z.object({
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;
    const { id } = params;

    const body = await req.json();
    const validated = serviceUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    const existing = await prisma.service.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    const uniqueRecipes = new Map<string, { productId: string; quantityPerService: number; notes: string | null }>();
    if (data.recipes !== undefined) {
      for (const r of data.recipes) {
        uniqueRecipes.set(r.productId, {
          productId: r.productId,
          quantityPerService: r.quantityPerService,
          notes: r.notes?.trim() || null,
        });
      }

      if (uniqueRecipes.size > 0) {
        const productIds = Array.from(uniqueRecipes.keys());
        const validProducts = await prisma.product.findMany({
          where: { tenantId, id: { in: productIds } },
          select: { id: true },
        });
        if (validProducts.length !== productIds.length) {
          return NextResponse.json(
            { error: "Um ou mais produtos da ficha técnica não foram encontrados." },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.recipes !== undefined) {
        await tx.serviceProductRecipe.deleteMany({
          where: { serviceId: id, tenantId },
        });
        if (uniqueRecipes.size > 0) {
          await tx.serviceProductRecipe.createMany({
            data: Array.from(uniqueRecipes.values()).map((r) => ({
              tenantId,
              serviceId: id,
              productId: r.productId,
              quantityPerService: r.quantityPerService,
              notes: r.notes,
            })),
          });
        }
      }

      return tx.service.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          category: data.category,
          estimatedMinutes: data.estimatedMinutes,
          priceHatch: data.priceHatch,
          priceSedan: data.priceSedan,
          priceSuvPickup: data.priceSuvPickup,
          priceMotorcycle: data.priceMotorcycle,
          priceSpecial: data.priceSpecial,
          estimatedCost: data.estimatedCost,
          defaultCommission: data.defaultCommission,
          maintenanceIntervalDays:
            data.maintenanceIntervalDays === undefined
              ? existing.maintenanceIntervalDays
              : data.maintenanceIntervalDays,
          active: data.active,
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
          },
        },
      });
    });

    return NextResponse.json({ service: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;
    const { id } = params;

    const existing = await prisma.service.findFirst({
      where: { id, tenantId },
      include: { orderItems: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    // Se já foi utilizado em alguma OS, fazemos soft-delete desativando para preservar histórico
    if (existing.orderItems.length > 0) {
      await prisma.service.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({
        success: true,
        message: "Serviço desativado para preservar o histórico financeiro das OS já realizadas.",
      });
    }

    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Serviço removido com sucesso." });
  } catch (error) {
    return handleAuthError(error);
  }
}

