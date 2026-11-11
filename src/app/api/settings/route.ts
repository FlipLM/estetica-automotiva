import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { getTenantLocalStorageUsage, safeDeleteLocalTenantFile } from "@/lib/storage-quota";

export const dynamic = "force-dynamic";

const optionalText = z
  .string()
  .nullish()
  .transform((val) => {
    if (!val || val.trim() === "") return null;
    return val.trim();
  });

const optionalEmail = z
  .string()
  .nullish()
  .transform((val) => {
    if (!val || val.trim() === "") return null;
    return val.trim();
  })
  .refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "E-mail de contato informado é inválido"
  );

const updateTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Razão Social / Nome da empresa deve ter pelo menos 2 caracteres"),
  tradingName: optionalText,
  document: optionalText,
  phone: optionalText,
  whatsapp: optionalText,
  email: optionalEmail,
  address: optionalText,
  logoUrl: optionalText,
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

    // Se o logo mudou ou foi removido, limpa o arquivo antigo local para liberar cota
    const existing = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { logoUrl: true },
    });

    if (existing?.logoUrl && existing.logoUrl !== validated.logoUrl) {
      await safeDeleteLocalTenantFile(session.tenantId, existing.logoUrl);
    }

    const updated = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: validated,
    });

    const localUsage = await getTenantLocalStorageUsage(session.tenantId);

    return NextResponse.json({
      message: "Configurações da empresa atualizadas com sucesso",
      tenant: {
        ...updated,
        localStorageUsage: {
          percentUsed: localUsage.percentUsed,
          isLimitReached: localUsage.isLimitReached,
          storageConnected: updated.storageConnected,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || "Dados inválidos no formulário.";
      return NextResponse.json({ error: msg, details: error.errors }, { status: 400 });
    }
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
