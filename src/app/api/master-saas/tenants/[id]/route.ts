import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAuth } from "@/lib/master-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMasterAuth();
    const { id } = params;
    const body = await req.json();
    const { action, additionalDays } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    if (action === "ACTIVATE_PRO") {
      await prisma.tenant.update({
        where: { id },
        data: {
          plan: "ACTIVE",
          trialExpiresAt: null,
          isCustomPlan: true,
          active: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Plano PRO Vitalício/Ativo liberado com sucesso para ${tenant.name}!`,
      });
    }

    if (action === "EXTEND_TRIAL") {
      const days = Number(additionalDays) || 3;
      const baseDate =
        tenant.trialExpiresAt && new Date(tenant.trialExpiresAt) > new Date()
          ? new Date(tenant.trialExpiresAt)
          : new Date();

      baseDate.setDate(baseDate.getDate() + days);

      await prisma.tenant.update({
        where: { id },
        data: {
          plan: "TRIAL",
          trialExpiresAt: baseDate,
          active: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Período de testes de ${tenant.name} prorrogado em +${days} dias!`,
        newExpiresAt: baseDate.toISOString(),
      });
    }

    if (action === "BLOCK") {
      await prisma.tenant.update({
        where: { id },
        data: {
          plan: "BLOCKED",
          active: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Acesso da empresa ${tenant.name} bloqueado.`,
      });
    }

    if (action === "UNBLOCK") {
      await prisma.tenant.update({
        where: { id },
        data: {
          plan: "ACTIVE",
          active: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Acesso da empresa ${tenant.name} reativado com sucesso.`,
      });
    }

    return NextResponse.json({ error: "Ação não reconhecida." }, { status: 400 });
  } catch (error: any) {
    console.error("[MASTER_UPDATE_TENANT_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar dados do tenant." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireMasterAuth();
    const { id } = params;

    await prisma.tenant.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Empresa excluída do sistema.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao remover empresa." },
      { status: 500 }
    );
  }
}
