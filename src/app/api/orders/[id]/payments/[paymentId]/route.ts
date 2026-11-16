import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import { roundMoney } from "@/lib/payment-fees";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const session = await requireAdmin();
    const { tenantId, userId } = session;
    const { id, paymentId } = params;

    const order = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        payments: true,
        commissions: true,
        vehicle: {
          include: {
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

    const targetPayment = order.payments.find((p) => p.id === paymentId);
    if (!targetPayment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado nesta Ordem de Serviço." },
        { status: 404 }
      );
    }

    const remainingPayments = order.payments.filter((p) => p.id !== paymentId);
    const newPaidAmount = roundMoney(
      remainingPayments.reduce((acc, p) => acc + p.amount, 0)
    );
    const willReopenFromPaid =
      order.status === "PAID" && newPaidAmount < order.totalAmount - 0.01;

    if (willReopenFromPaid) {
      const hasPaidCommission = order.commissions.some(
        (c) => c.status === "PAID"
      );
      if (hasPaidCommission) {
        return NextResponse.json(
          {
            error:
              "Não é possível estornar este pagamento pois já existe comissão liquidada (paga) ao colaborador.",
          },
          { status: 400 }
        );
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id: paymentId },
      });

      let deletedCommissionsCount = 0;

      if (willReopenFromPaid) {
        const deletedCommissions = await tx.commission.deleteMany({
          where: { serviceOrderId: id, status: "PENDING" },
        });
        deletedCommissionsCount = deletedCommissions.count;

        const targetCustomerId =
          order.vehicle.customerId ||
          order.vehicle.customerVehicles?.[0]?.customerId;

        if (targetCustomerId) {
          const customer = await tx.customer.findUnique({
            where: { id: targetCustomerId },
            select: { totalSpent: true, visitsCount: true },
          });
          if (customer) {
            await tx.customer.update({
              where: { id: targetCustomerId },
              data: {
                totalSpent: Math.max(0, customer.totalSpent - order.totalAmount),
                visitsCount: Math.max(0, customer.visitsCount - 1),
              },
            });
          }
        }
      }

      const savedOrder = await tx.serviceOrder.update({
        where: { id },
        data: willReopenFromPaid
          ? {
              status: order.completedAt ? "DONE" : "IN_PROGRESS",
              paidAt: null,
              paidAmount: newPaidAmount,
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

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "REVERSE_PAYMENT",
          entity: "Payment",
          entityId: paymentId,
          details: JSON.stringify({
            serviceOrderId: id,
            orderNumber: order.orderNumber,
            reversedAmount: targetPayment.amount,
            method: targetPayment.method,
            reopenedFromPaid: willReopenFromPaid,
            newPaidAmount,
            deletedCommissionsCount,
          }),
        },
      });

      return savedOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Pagamento estornado com sucesso.",
      order: updatedOrder,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
