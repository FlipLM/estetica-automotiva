import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { getTenantLocalStorageUsage } from "@/lib/storage-quota";

export const dynamic = "force-dynamic";

const updateTenantSchema = z.object({
  name: z.string().min(2, "Nome da empresa é obrigatório"),
  tradingName: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            vehicles: true,
            services: true,
            serviceOrders: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const localUsage = await getTenantLocalStorageUsage(tenant.id);

    return NextResponse.json({
      tenant: {
        ...tenant,
        localStorageUsage: {
          percentUsed: localUsage.percentUsed,
          isLimitReached: localUsage.isLimitReached,
          storageConnected: tenant.storageConnected,
        },
      },
    });
  } catch (error: any) {
    console.error("Erro ao obter configurações da empresa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateTenantSchema.parse(body);

    const updated = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: validated,
    });

    return NextResponse.json({
      message: "Configurações da empresa atualizadas com sucesso",
      tenant: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

