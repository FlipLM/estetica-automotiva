import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const employeeUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres."),
  email: z.string().email("E-mail corporativo inválido."),
  password: z.string().min(6).optional().nullable().or(z.literal("")),
  role: z.enum(["ADMIN", "OPERATOR"]).default("OPERATOR"),
  phone: z.string().optional().nullable(),
  commissionRate: z.number().min(0).max(100).default(10.0),
  active: z.boolean().default(true),
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
    const parsed = employeeUpdateSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
    }

    // Se alterou o email, verifica duplicidade
    if (parsed.email.toLowerCase().trim() !== existing.email.toLowerCase().trim()) {
      const emailInUse = await prisma.user.findFirst({
        where: {
          tenantId,
          email: parsed.email.toLowerCase().trim(),
          id: { not: id },
        },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: "Já existe outro colaborador com este e-mail." },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      name: parsed.name,
      email: parsed.email.toLowerCase().trim(),
      role: parsed.role,
      phone: parsed.phone,
      commissionRate: parsed.commissionRate,
      active: parsed.active,
    };

    if (parsed.password && parsed.password.trim().length >= 6) {
      updateData.passwordHash = await hashPassword(parsed.password.trim());
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        commissionRate: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ employee: updated });
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
    const session = await requireAdmin();
    const { tenantId, userId } = session;
    const { id } = params;

    // Não permite que o admin delete a si mesmo
    if (id === userId) {
      return NextResponse.json(
        { error: "Não é permitido excluir o usuário atualmente conectado." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}

