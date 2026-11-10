import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const statusUpdateSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "PAID", "CANCELLED"]),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "TRANSFER"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId, userId, role } = session;
    const { id } = params;

    const body = await req.json();
    const validated = statusUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status, paymentMethod } = validated.data;

    // Apenas Administradores podem liquidar como PAGO diretamente se envolver baixa financeira
    if (status === "PAID" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem dar baixa de pagamento na Ordem de Serviço." },
        { status: 403 }
      );
    }

    const existing = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        vehicle: {
          include: {
            customer: true,
            customerVehicles: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    const now = new Date();
    const updateData: any = { status };

    if (status === "IN_PROGRESS" && !existing.startedAt) {
      updateData.startedAt = now;
    } else if (status === "DONE" && !existing.completedAt) {
      updateData.completedAt = now;
    } else if (status === "PAID") {
      updateData.paidAt = now;
      updateData.paidAmount = existing.totalAmount;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.serviceOrder.update({
        where: { id },
        data: updateData,
        include: {
          vehicle: { include: { customer: true } },
          assignedUser: { select: { id: true, name: true } },
          items: true,
        },
      });

      // Se passou para PAID e foi informado método de pagamento, gera o registro de Payment real
      if (status === "PAID") {
        await tx.payment.create({
          data: {
            serviceOrderId: id,
            amount: existing.totalAmount,
            method: paymentMethod || "PIX",
            paidAt: now,
            notes: `Baixa de pagamento da OS #${existing.orderNumber}`,
          },
        });

        // Atualiza métricas acumuladas do cliente (totalSpent e visitsCount)
        const targetCustomerId =
          existing.vehicle.customerId ||
          existing.vehicle.customerVehicles?.[0]?.customerId;

        if (targetCustomerId) {
          await tx.customer.update({
            where: { id: targetCustomerId },
            data: {
              totalSpent: { increment: existing.totalAmount },
              visitsCount: { increment: 1 },
              lastVisitAt: now,
            },
          });
        }

        // Apura comissões para o colaborador responsável pelos serviços
        if (existing.assignedUserId) {
          const totalCommission = existing.items.reduce(
            (acc, curr) => acc + (curr.commissionAmount || 0),
            0
          );

          if (totalCommission > 0) {
            await tx.commission.create({
              data: {
                serviceOrderId: id,
                userId: existing.assignedUserId,
                amount: totalCommission,
                status: "PENDING",
              },
            });
          }
        }
      }

      // Registra trilha de auditoria
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "UPDATE_ORDER_STATUS",
          entity: "ServiceOrder",
          entityId: id,
          details: JSON.stringify({
            orderNumber: existing.orderNumber,
            oldStatus: existing.status,
            newStatus: status,
          }),
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({ order: result });
  } catch (error) {
    return handleAuthError(error);
  }
}

