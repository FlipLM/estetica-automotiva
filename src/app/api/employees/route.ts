import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, handleAuthError } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const employeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres."),
  email: z.string().email("E-mail corporativo inválido."),
  password: z.string().min(6, "Senha provisória deve ter no mínimo 6 caracteres.").default("123456"),
  role: z.enum(["ADMIN", "OPERATOR"]).default("OPERATOR"),
  phone: z.string().optional().nullable(),
  commissionRate: z.number().min(0).max(100).default(10.0),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const employees = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        commissionRate: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            assignedOrders: true,
            commissions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId } = session;

    const body = await req.json();
    const parsed = employeeSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: {
        tenantId,
        email: parsed.email.toLowerCase().trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um colaborador cadastrado com este e-mail." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.password);

    const employee = await prisma.user.create({
      data: {
        tenantId,
        name: parsed.name,
        email: parsed.email.toLowerCase().trim(),
        passwordHash,
        role: parsed.role,
        phone: parsed.phone,
        commissionRate: parsed.commissionRate,
        active: parsed.active,
      },
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

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}

