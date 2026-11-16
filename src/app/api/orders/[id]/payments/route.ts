import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { parseDateInput } from "@/lib/date-utils";
import { calculatePaymentFeeBreakdown, roundMoney } from "@/lib/payment-fees";

export const dynamic = "force-dynamic";

const addPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("O valor do pagamento deve ser maior que zero."),
  method: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "TRANSFER"]),
  installments: z.coerce.number().int().min(1).max(12).optional().default(1),
  feeRate: z.coerce.number().min(0).max(100).optional(),
  paidAt: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const { tenantId, userId } = session;
    const { id } = params;

    const body = await req.json();
    const parsed = addPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let paidAtDate = new Date();
    if (data.paidAt) {
      try {
        paidAtDate = parseDateInput(data.paidAt);
      } catch {
        return NextResponse.json(
          { error: "Data de pagamento inválida." },
          { status: 400 }
        );
      }
    }

    const order = await prisma.serviceOrder.findFirst({
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
        vehicle: {
          include: {
            customer: true,
            customerVehicles: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Não é possível registrar pagamento em uma OS cancelada." },
        { status: 400 }
      );
    }

    if (order.status === "PAID") {
      return NextResponse.json(
        { error: "Esta OS já está totalmente quitada." },
        { status: 400 }
      );
    }

    const existingPaidSum = roundMoney(
      order.payments.reduce((acc, p) => acc + p.amount, 0)
    );
    const currentPaidAmount = Math.max(order.paidAmount || 0, existingPaidSum);
    const remaining = roundMoney(
      Math.max(0, order.totalAmount - currentPaidAmount)
    );

    if (remaining <= 0) {
      return NextResponse.json(
        { error: "Não há saldo restante para receber nesta OS." },
        { status: 400 }
      );
    }

    if (data.amount > remaining + 0.01) {
      return NextResponse.json(
        {
          error: `O valor informado (R$ ${data.amount.toFixed(
            2
          )}) excede o saldo restante da OS (R$ ${remaining.toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    const appliedAmount = roundMoney(Math.min(data.amount, remaining));
    const newPaidAmount = roundMoney(
      Math.min(order.totalAmount, currentPaidAmount + appliedAmount)
    );
    const isSettled = newPaidAmount >= order.totalAmount - 0.01;

    const feeBreakdown = calculatePaymentFeeBreakdown({
      amount: appliedAmount,
      method: data.method,
      installments: data.installments,
      overrideFeeRate: data.feeRate,
      tenantRates: order.tenant,
    });

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          serviceOrderId: id,
          amount: appliedAmount,
          method: data.method,
          installments: feeBreakdown.installments,
          feeRate: feeBreakdown.feeRate,
          feeAmount: feeBreakdown.feeAmount,
          netAmount: feeBreakdown.netAmount,
          paidAt: paidAtDate,
          notes:
            data.notes?.trim() ||
            (isSettled
              ? `Quitação da OS #${order.orderNumber}`
              : `Pagamento parcial / sinal da OS #${order.orderNumber}`),
        },
      });

      const updatedOrder = await tx.serviceOrder.update({
        where: { id },
        data: isSettled
          ? {
              status: "PAID",
              paidAt: paidAtDate,
              paidAmount: order.totalAmount,
              completedAt: order.completedAt ?? paidAtDate,
            }
          : {
              paidAmount: newPaidAmount,
            },
        include: {
          vehicle: { include: { customer: true } },
          assignedUser: { select: { id: true, name: true } },
          items: true,
          payments: { orderBy: { paidAt: "asc" } },
        },
      });

      if (isSettled) {
        const targetCustomerId =
          order.vehicle.customerId ||
          order.vehicle.customerVehicles?.[0]?.customerId;

        if (targetCustomerId) {
          await tx.customer.update({
            where: { id: targetCustomerId },
            data: {
              totalSpent: { increment: order.totalAmount },
              visitsCount: { increment: 1 },
              lastVisitAt: paidAtDate,
            },
          });
        }

        // Comissão sempre sobre o valor vendido dos serviços (sem descontar taxa da maquininha)
        if (order.assignedUserId && order.commissions.length === 0) {
          const totalCommission = order.items.reduce(
            (acc, curr) => acc + (curr.commissionAmount || 0),
            0
          );
          if (totalCommission > 0) {
            await tx.commission.create({
              data: {
                serviceOrderId: id,
                userId: order.assignedUserId,
                amount: totalCommission,
                status: "PENDING",
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: isSettled ? "SETTLE_ORDER_PAYMENT" : "ADD_PARTIAL_PAYMENT",
          entity: "Payment",
          entityId: payment.id,
          details: JSON.stringify({
            serviceOrderId: id,
            orderNumber: order.orderNumber,
            amount: appliedAmount,
            method: data.method,
            installments: feeBreakdown.installments,
            feeRate: feeBreakdown.feeRate,
            feeAmount: feeBreakdown.feeAmount,
            netAmount: feeBreakdown.netAmount,
            settled: isSettled,
          }),
        },
      });

      return { payment, updatedOrder };
    });

    return NextResponse.json(
      {
        payment: result.payment,
        order: result.updatedOrder,
        settled: isSettled,
        remaining: Math.max(
          0,
          roundMoney(order.totalAmount - result.updatedOrder.paidAmount)
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
