import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const vehicleUpdateSchema = z.object({
  brand: z.string().optional().nullable(),
  model: z.string().min(1, "Modelo é obrigatório."),
  color: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  category: z.enum(["HATCH", "SEDAN", "SUV_PICKUP", "MOTORCYCLE", "SPECIAL_UTILITY"], {
    errorMap: () => ({ message: "Categoria de veículo inválida." }),
  }),
  notes: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;
    const { id } = params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        serviceOrders: {
          include: {
            items: true,
            assignedUser: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;
    const { id } = params;

    const body = await req.json();
    const validated = vehicleUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    const existing = await prisma.vehicle.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 }
      );
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        brand: data.brand || null,
        model: data.model,
        color: data.color || null,
        year: data.year || null,
        category: data.category,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ vehicle: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;
    const { id } = params;

    const existing = await prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: { serviceOrders: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 }
      );
    }

    if (existing.serviceOrders.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir veículo que já possui ordens de serviço registradas." },
        { status: 400 }
      );
    }

    await prisma.vehicle.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Veículo removido com sucesso." });
  } catch (error) {
    return handleAuthError(error);
  }
}

