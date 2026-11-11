import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const boxSchema = z.object({
  name: z.string().min(2, "Nome do box deve ter no mínimo 2 caracteres."),
  type: z.string().default("GERAL"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  capacity: z.coerce.number().int().min(1, "A capacidade mínima é de 1 vaga.").default(1),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    let boxes = await prisma.workBay.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });


    // Busca ordens de serviço ativas no pátio (TODO, IN_PROGRESS, DONE) para calcular lotação em tempo real
    const activeOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: { in: ["TODO", "IN_PROGRESS", "DONE"] },
        box: { not: null },
      },
      select: {
        id: true,
        orderNumber: true,
        box: true,
        status: true,
        vehicle: {
          select: {
            plate: true,
            model: true,
          },
        },
      },
    });

    const enrichedBoxes = boxes.map((b) => {
      const currentOrders = activeOrders.filter(
        (o) =>
          o.box === b.name ||
          o.box === b.id ||
          (b.name && o.box && o.box.trim().toLowerCase() === b.name.trim().toLowerCase())
      );
      const occupiedCount = currentOrders.length;
      const isFull = occupiedCount >= b.capacity;
      const availableSlots = Math.max(0, b.capacity - occupiedCount);

      return {
        ...b,
        occupiedCount,
        availableSlots,
        isFull,
        currentOrders: currentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          plate: o.vehicle.plate,
          model: o.vehicle.model,
        })),
      };
    });

    return NextResponse.json({ boxes: enrichedBoxes });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const body = await req.json();
    const parsed = boxSchema.parse(body);

    // Verifica se já existe box com este nome
    const existing = await prisma.workBay.findFirst({
      where: {
        tenantId,
        name: { equals: parsed.name },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um box ou baia cadastrado com este nome." },
        { status: 400 }
      );
    }

    const box = await prisma.workBay.create({
      data: {
        tenantId,
        name: parsed.name,
        type: parsed.type,
        description: parsed.description,
        color: parsed.color || "#a3e635",
        capacity: parsed.capacity,
        active: parsed.active,
      },
    });

    return NextResponse.json({ box }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}

