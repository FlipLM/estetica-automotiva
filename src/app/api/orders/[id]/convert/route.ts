import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId, userId } = session;
    const { id } = params;

    const existing = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: true,
        items: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Orçamento não encontrado." },
        { status: 404 }
      );
    }

    if (!existing.status.startsWith("BUDGET")) {
      return NextResponse.json(
        { error: "Esta ordem de serviço já foi convertida ou já está em atendimento no pátio." },
        { status: 400 }
      );
    }

    // Converte o status para "TODO" (Para Fazer no Pátio) mantendo todos os valores intactos
    const converted = await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.update({
        where: { id },
        data: {
          status: "TODO", // Entra diretamente no Pátio Kanban
          box: existing.box || "Box 1 - Entrada",
        },
        include: {
          vehicle: { include: { customer: true } },
          items: true,
          assignedUser: { select: { id: true, name: true } },
        },
      });

      // Registra trilha de auditoria da conversão
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CONVERT_BUDGET_TO_ORDER",
          entity: "ServiceOrder",
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            plate: existing.vehicle.plate,
            totalAmount: order.totalAmount,
          }),
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      message: "Orçamento convertido em Ordem de Serviço com sucesso! Veículo adicionado ao Pátio.",
      order: converted,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

