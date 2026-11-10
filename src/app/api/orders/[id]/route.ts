import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId, role } = session;
    const { id } = params;

    const order = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        tenant: true,
        vehicle: {
          include: {
            customer: true,
            customerVehicles: {
              include: { customer: true },
            },
          },
        },
        items: {
          include: { service: true },
        },
        assignedUser: { select: { id: true, name: true, phone: true } },
        checklist: {
          include: { damageRecords: true },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    const activeCustomer = order.vehicle.customer || order.vehicle.customerVehicles?.[0]?.customer;

    const sanitized = {
      ...order,
      vehicle: {
        ...order.vehicle,
        customer: activeCustomer || null,
      },
      totalAmount: role === "ADMIN" ? order.totalAmount : null,
      subtotal: role === "ADMIN" ? order.subtotal : null,
      discount: role === "ADMIN" ? order.discount : null,
      paidAmount: role === "ADMIN" ? order.paidAmount : null,
      payments: role === "ADMIN" ? order.payments : [],
      items: order.items.map((i) => ({
        ...i,
        unitPrice: role === "ADMIN" ? i.unitPrice : null,
        totalPrice: role === "ADMIN" ? i.totalPrice : null,
        commissionAmount: role === "ADMIN" ? i.commissionAmount : null,
      })),
    };

    return NextResponse.json({ order: sanitized });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId, userId, role } = session;
    const { id } = params;

    const body = await req.json();

    const existing = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    // Se estiver transferindo para outro box, valida a capacidade máxima e bloqueia se estiver cheio
    if (body.box && body.box !== existing.box) {
      const targetBay = await prisma.workBay.findFirst({
        where: {
          tenantId,
          active: true,
          OR: [
            { name: { equals: body.box } },
            { id: { equals: body.box } },
          ],
        },
      });

      if (targetBay) {
        const activeCount = await prisma.serviceOrder.count({
          where: {
            tenantId,
            id: { not: id },
            status: { in: ["TODO", "IN_PROGRESS", "DONE"] },
            box: targetBay.name,
          },
        });

        if (activeCount >= targetBay.capacity) {
          return NextResponse.json(
            {
              error: `Bloqueado: O ${targetBay.name} está LOTADO (${activeCount}/${targetBay.capacity} vagas ocupadas).`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Atualização com controle de campos
    const updated = await prisma.serviceOrder.update({
      where: { id },
      data: {
        assignedUserId: body.assignedUserId !== undefined ? body.assignedUserId : existing.assignedUserId,
        box: body.box !== undefined ? body.box : existing.box,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        mileage: body.mileage !== undefined ? body.mileage : existing.mileage,
        // Desconto só pode ser alterado por Administrador
        discount: role === "ADMIN" && body.discount !== undefined ? body.discount : existing.discount,
        totalAmount:
          role === "ADMIN" && body.discount !== undefined
            ? Math.max(0, existing.subtotal - body.discount)
            : existing.totalAmount,
      },
      include: {
        items: true,
        vehicle: { include: { customer: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId, role } = session;
    const { id } = params;

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir ordens de serviço." },
        { status: 403 }
      );
    }

    const existing = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: { payments: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    if (existing.payments.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir uma OS que já possui pagamentos registrados no financeiro." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.serviceOrderItem.deleteMany({ where: { serviceOrderId: id } }),
      prisma.serviceOrder.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: "OS removida com sucesso." });
  } catch (error) {
    return handleAuthError(error);
  }
}

