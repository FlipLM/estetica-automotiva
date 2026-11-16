import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { getDaysFromTodayEnd } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const contactLogSchema = z.object({
  customerId: z.string().min(1, "Cliente obrigatório."),
  vehicleId: z.string().optional().nullable(),
  serviceOrderId: z.string().optional().nullable(),
  campaign: z.enum([
    "TODAY",
    "BUDGET_RECOVERY",
    "COATING_WARRANTY",
    "CHURN_RISK",
    "POST_SALE",
    "RAINY_DAY",
    "BIRTHDAY",
    "VIP",
    "MANUAL",
  ]),
  outcome: z.enum(["SENT", "POSTPONED", "NO_INTEREST"]).default("SENT"),
  message: z.string().max(4000).optional().nullable(),
  snoozeDays: z.number().int().min(1).max(365).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { tenantId, userId } = session;

    const body = await req.json();
    const parsed = contactLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Garante isolamento multi-tenant de todas as referências recebidas
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
      select: { id: true, name: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, tenantId },
        select: { id: true },
      });
      if (!vehicle) {
        return NextResponse.json(
          { error: "Veículo não encontrado para esta empresa." },
          { status: 404 }
        );
      }
    }

    if (data.serviceOrderId) {
      const order = await prisma.serviceOrder.findFirst({
        where: { id: data.serviceOrderId, tenantId },
        select: { id: true },
      });
      if (!order) {
        return NextResponse.json(
          { error: "Ordem de serviço não encontrada para esta empresa." },
          { status: 404 }
        );
      }
    }

    let snoozeUntil: Date | null = null;
    if (data.outcome === "POSTPONED") {
      snoozeUntil = getDaysFromTodayEnd(data.snoozeDays ?? 15);
    } else if (data.outcome === "NO_INTEREST") {
      snoozeUntil = getDaysFromTodayEnd(data.snoozeDays ?? 60);
    }

    const log = await prisma.$transaction(async (tx) => {
      const created = await tx.crmContactLog.create({
        data: {
          tenantId,
          customerId: customer.id,
          vehicleId: data.vehicleId || null,
          serviceOrderId: data.serviceOrderId || null,
          userId,
          campaign: data.campaign,
          outcome: data.outcome,
          message: data.message?.trim() || null,
          snoozeUntil,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CRM_CONTACT_LOGGED",
          entity: "CrmContactLog",
          entityId: created.id,
          details: JSON.stringify({
            customerId: customer.id,
            customerName: customer.name,
            campaign: data.campaign,
            outcome: data.outcome,
            snoozeUntil,
          }),
        },
      });

      return created;
    });

    return NextResponse.json({ contactLog: log }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
