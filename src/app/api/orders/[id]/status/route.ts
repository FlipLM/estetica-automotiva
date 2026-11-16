import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";
import { calculatePaymentFeeBreakdown, roundMoney } from "@/lib/payment-fees";

export const dynamic = "force-dynamic";

const statusUpdateSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "PAID", "CANCELLED"]),
  paymentMethod: z
    .enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "TRANSFER"])
    .optional(),
  installments: z.coerce.number().int().min(1).max(12).optional().default(1),
  feeRate: z.coerce.number().min(0).max(100).optional(),
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

    const { status, paymentMethod, installments, feeRate } = validated.data;

    // Apenas Administradores podem liquidar como PAGO ou estornar uma OS já paga
    if (status === "PAID" && role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Apenas administradores podem dar baixa de pagamento na Ordem de Serviço.",
        },
        { status: 403 }
      );
    }

    const existing = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        payments: true,
        commissions: true,
        tenant: {
          select: {
            debitFeeRate: true,
            credit1xFeeRate: true,
            credit2to6FeeRate: true,
            credit7to12FeeRate: true,
          },
        },
        assignedUser: { select: { id: true, name: true } },
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

    // Idempotência: OS já está PAID e requisição pede PAID novamente -> não duplica pagamento, comissão nem métricas
    if (existing.status === "PAID" && status === "PAID") {
      return NextResponse.json({ order: existing, idempotent: true });
    }

    const isReversalFromPaid = existing.status === "PAID" && status !== "PAID";

    if (isReversalFromPaid) {
      if (role !== "ADMIN") {
        return NextResponse.json(
          {
            error:
              "Apenas administradores podem estornar o pagamento de uma Ordem de Serviço.",
          },
          { status: 403 }
        );
      }

      const hasPaidCommission = existing.commissions.some(
        (c) => c.status === "PAID"
      );
      if (hasPaidCommission) {
        return NextResponse.json(
          {
            error:
              "Não é possível alterar o status desta OS pois já existe comissão liquidada (paga) ao colaborador.",
          },
          { status: 400 }
        );
      }
    }

    const existingPaidSum = roundMoney(
      existing.payments.reduce((acc, p) => acc + p.amount, 0)
    );
    const effectiveAlreadyPaid = Math.max(
      existing.paidAmount || 0,
      existingPaidSum
    );

    if (
      status === "CANCELLED" &&
      existing.status !== "PAID" &&
      effectiveAlreadyPaid > 0.009
    ) {
      return NextResponse.json(
        {
          error: `Não é possível cancelar esta OS pois existem pagamentos parciais registrados (R$ ${effectiveAlreadyPaid.toFixed(
            2
          )}). Estorne os pagamentos antes de cancelar.`,
        },
        { status: 400 }
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
      if (!existing.completedAt) {
        updateData.completedAt = now;
      }
    } else if (isReversalFromPaid) {
      updateData.paidAt = null;
      updateData.paidAmount = 0;
    }

    const remainingToPay = roundMoney(
      Math.max(0, existing.totalAmount - effectiveAlreadyPaid)
    );

    const result = await prisma.$transaction(async (tx) => {
      let deletedPaymentsCount = 0;
      let deletedCommissionsCount = 0;
      let reversalAmount = 0;

      if (isReversalFromPaid) {
        reversalAmount =
          existingPaidSum > 0
            ? existingPaidSum
            : existing.paidAmount > 0
            ? existing.paidAmount
            : existing.totalAmount;

        const deletedPayments = await tx.payment.deleteMany({
          where: { serviceOrderId: id },
        });
        deletedPaymentsCount = deletedPayments.count;

        const deletedCommissions = await tx.commission.deleteMany({
          where: { serviceOrderId: id, status: "PENDING" },
        });
        deletedCommissionsCount = deletedCommissions.count;

        const targetCustomerId =
          existing.vehicle.customerId ||
          existing.vehicle.customerVehicles?.[0]?.customerId;

        if (targetCustomerId) {
          const customer = await tx.customer.findUnique({
            where: { id: targetCustomerId },
            select: { totalSpent: true, visitsCount: true },
          });

          if (customer) {
            await tx.customer.update({
              where: { id: targetCustomerId },
              data: {
                totalSpent: Math.max(0, customer.totalSpent - reversalAmount),
                visitsCount: Math.max(0, customer.visitsCount - 1),
              },
            });
          }
        }
      }

      const updatedOrder = await tx.serviceOrder.update({
        where: { id },
        data: updateData,
        include: {
          vehicle: { include: { customer: true } },
          assignedUser: { select: { id: true, name: true } },
          items: true,
        },
      });

      // Se passou para PAID (vindo de outro status), quita apenas o saldo restante (se houver)
      if (status === "PAID" && existing.status !== "PAID") {
        const chosenMethod = paymentMethod || "PIX";
        if (remainingToPay > 0.009) {
          const feeBreakdown = calculatePaymentFeeBreakdown({
            amount: remainingToPay,
            method: chosenMethod,
            installments,
            overrideFeeRate: feeRate,
            tenantRates: existing.tenant,
          });

          await tx.payment.create({
            data: {
              serviceOrderId: id,
              amount: remainingToPay,
              method: chosenMethod,
              installments: feeBreakdown.installments,
              feeRate: feeBreakdown.feeRate,
              feeAmount: feeBreakdown.feeAmount,
              netAmount: feeBreakdown.netAmount,
              paidAt: now,
              notes:
                effectiveAlreadyPaid > 0
                  ? `Quitação do saldo restante da OS #${existing.orderNumber}`
                  : `Baixa de pagamento da OS #${existing.orderNumber}`,
            },
          });
        }

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

        // Apura comissões para o colaborador responsável sobre o valor vendido (sem descontar taxa da maquininha)
        if (existing.assignedUserId && existing.commissions.length === 0) {
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
          action: isReversalFromPaid
            ? "REVERSE_ORDER_PAYMENT"
            : "UPDATE_ORDER_STATUS",
          entity: "ServiceOrder",
          entityId: id,
          details: JSON.stringify({
            orderNumber: existing.orderNumber,
            oldStatus: existing.status,
            newStatus: status,
            ...(status === "PAID" ? { remainingToPay } : {}),
            ...(isReversalFromPaid
              ? {
                  reversalAmount,
                  deletedPaymentsCount,
                  deletedCommissionsCount,
                }
              : {}),
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
