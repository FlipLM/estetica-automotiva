import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const updateTenantSchema = z.object({
  plan: z.enum(["TRIAL", "ACTIVE", "EXPIRED", "BLOCKED"]).optional(),
  extendDays: z.number().int().positive().optional(),
  isCustomPlan: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const tenantId = params.id;
    const body = await req.json();
    const validated = updateTenantSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!currentTenant) {
      return NextResponse.json(
        { error: "Empresa / Lead não encontrado." },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (validated.data.plan) {
      updateData.plan = validated.data.plan;
    }

    if (validated.data.isCustomPlan !== undefined) {
      updateData.isCustomPlan = validated.data.isCustomPlan;
    }

    if (validated.data.active !== undefined) {
      updateData.active = validated.data.active;
    }

    if (validated.data.extendDays) {
      const baseTime = currentTenant.trialExpiresAt && currentTenant.trialExpiresAt > new Date()
        ? currentTenant.trialExpiresAt.getTime()
        : Date.now();

      updateData.trialExpiresAt = new Date(baseTime + validated.data.extendDays * 24 * 60 * 60 * 1000);
      updateData.plan = "TRIAL";
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Lead / Empresa atualizada com sucesso!",
      tenant: updated,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
