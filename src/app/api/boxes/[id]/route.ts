import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const boxUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres."),
  type: z.string().default("GERAL"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  capacity: z.coerce.number().int().min(1, "A capacidade mínima é de 1 vaga.").default(1),
  active: z.boolean().default(true),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;
    const { id } = params;

    const body = await req.json();
    const parsed = boxUpdateSchema.parse(body);

    const existing = await prisma.workBay.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Box não encontrado." }, { status: 404 });
    }

    const updated = await prisma.workBay.update({
      where: { id },
      data: {
        name: parsed.name,
        type: parsed.type,
        description: parsed.description,
        color: parsed.color || "#a3e635",
        capacity: parsed.capacity,
        active: parsed.active,
      },
    });

    return NextResponse.json({ box: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
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

    const existing = await prisma.workBay.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Box não encontrado." }, { status: 404 });
    }

    await prisma.workBay.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}

