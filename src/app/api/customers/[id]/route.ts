import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const customerUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres."),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido.").optional().nullable().or(z.literal("")),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
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

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        vehicles: {
          include: {
            serviceOrders: {
              include: {
                items: true,
                assignedUser: { select: { id: true, name: true } },
                checklist: {
                  include: {
                    damageRecords: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
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
    const validated = customerUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Garante que o cliente pertence a este tenant
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        document: data.document || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || data.phone || null,
        email: data.email || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ customer: updated });
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

    const existing = await prisma.customer.findFirst({
      where: { id, tenantId },
      include: { vehicles: { include: { serviceOrders: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    // Verifica se possui ordens de serviço ativas
    const hasOrders = existing.vehicles.some((v) => v.serviceOrders.length > 0);
    if (hasOrders) {
      return NextResponse.json(
        { error: "Não é possível excluir cliente que já possui ordens de serviço registradas no histórico." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Cliente removido com sucesso." });
  } catch (error) {
    return handleAuthError(error);
  }
}

