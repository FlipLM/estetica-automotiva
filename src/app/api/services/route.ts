import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

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
  active: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") === "true";

    const services = await prisma.service.findMany({
      where: {
        tenantId,
        category: category || undefined,
        active: activeOnly ? true : undefined,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

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

    const service = await prisma.service.create({
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
        estimatedCost: data.estimatedCost,
        defaultCommission: data.defaultCommission,
        active: data.active,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

