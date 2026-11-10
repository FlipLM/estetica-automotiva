import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const addItemSchema = z.object({
  serviceId: z.string().uuid("ID de serviço inválido."),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0).optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
});

// GET: Lista itens da OS
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;
    const { id } = params;

    const order = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: true,
        items: {
          include: { service: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      totalAmount: order.totalAmount,
      vehicle: {
        plate: order.vehicle.plate,
        model: order.vehicle.model,
        category: order.vehicle.category,
      },
      items: order.items,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST: Adiciona novo serviço a uma OS existente
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId, role } = session;
    const { id } = params;

    const body = await req.json();
    const validated = addItemSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { serviceId, quantity, commissionRate } = validated.data;
    let { unitPrice } = validated.data;

    // 1. Localiza a OS
    const order = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: { vehicle: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    if (order.status === "PAID") {
      return NextResponse.json(
        { error: "Esta OS já foi paga e encerrada. Para adicionar novos serviços, reabra a OS ou gere uma nova ordem de serviço." },
        { status: 400 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Não é possível adicionar serviços a uma OS cancelada." },
        { status: 400 }
      );
    }

    // 2. Localiza o serviço cadastrado no catálogo
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId, active: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado ou inativo no catálogo." },
        { status: 404 }
      );
    }

    // 3. Determina o preço unitário conforme a categoria do veículo caso não tenha sido fornecido
    if (unitPrice === undefined || unitPrice === null) {
      switch (order.vehicle.category) {
        case "HATCH":
          unitPrice = service.priceHatch;
          break;
        case "SEDAN":
          unitPrice = service.priceSedan;
          break;
        case "SUV_PICKUP":
          unitPrice = service.priceSuvPickup;
          break;
        case "MOTORCYCLE":
          unitPrice = service.priceMotorcycle;
          break;
        case "SPECIAL_UTILITY":
          unitPrice = service.priceSpecial;
          break;
        default:
          unitPrice = service.priceSedan;
      }
    }

    const totalPrice = unitPrice * quantity;
    const finalCommissionRate = commissionRate ?? service.defaultCommission ?? 10;
    const commissionAmount = (totalPrice * finalCommissionRate) / 100;

    // 4. Criação do item e recálculo dos totais da OS dentro de uma transação
    const result = await prisma.$transaction(async (tx) => {
      const newItem = await tx.serviceOrderItem.create({
        data: {
          serviceOrderId: id,
          serviceId: service.id,
          serviceName: service.name,
          unitPrice,
          quantity,
          totalPrice,
          commissionRate: finalCommissionRate,
          commissionAmount,
          completed: false,
        },
      });

      // Recalcula totais
      const allItems = await tx.serviceOrderItem.findMany({
        where: { serviceOrderId: id },
      });

      const newSubtotal = allItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
      const newTotalAmount = Math.max(0, newSubtotal - order.discount);

      const updatedOrder = await tx.serviceOrder.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          totalAmount: newTotalAmount,
        },
        include: {
          items: true,
          vehicle: { include: { customer: true } },
        },
      });

      return { newItem, updatedOrder };
    });

    return NextResponse.json({
      success: true,
      message: `Serviço "${service.name}" adicionado com sucesso à OS #${order.orderNumber}!`,
      item: result.newItem,
      order: result.updatedOrder,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE: Remove um serviço de uma OS existente
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId, role } = session;
    const { id } = params;

    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "ID do item não informado." },
        { status: 400 }
      );
    }

    const order = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de serviço não encontrada." },
        { status: 404 }
      );
    }

    if (order.status === "PAID") {
      return NextResponse.json(
        { error: "Não é possível remover itens de uma OS já quitada." },
        { status: 400 }
      );
    }

    const item = await prisma.serviceOrderItem.findFirst({
      where: { id: itemId, serviceOrderId: id },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado nesta OS." },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.serviceOrderItem.delete({
        where: { id: itemId },
      });

      const allItems = await tx.serviceOrderItem.findMany({
        where: { serviceOrderId: id },
      });

      const newSubtotal = allItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
      const newTotalAmount = Math.max(0, newSubtotal - order.discount);

      const updatedOrder = await tx.serviceOrder.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          totalAmount: newTotalAmount,
        },
        include: { items: true },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Item removido com sucesso da OS.",
      order: result,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

