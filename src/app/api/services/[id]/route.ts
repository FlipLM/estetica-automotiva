import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

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
  active: z.boolean().optional().default(true),
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

    const updated = await prisma.service.update({
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
        active: data.active,
      },
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

