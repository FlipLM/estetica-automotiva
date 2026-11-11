import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const orderItemSchema = z.object({
  serviceId: z.string().uuid("ID do serviço inválido."),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0).optional(), // Preço unitário personalizado ou calculado da matriz
  commissionRate: z.number().min(0).max(100).optional(),
});

const orderCreateSchema = z.object({
  vehicleId: z.string().uuid("ID do veículo obrigatório."),
  assignedUserId: z.string().uuid().optional().nullable(),
  status: z.enum([
    "BUDGET_PENDING",
    "BUDGET_APPROVED",
    "TODO",
    "IN_PROGRESS",
    "DONE",
    "PAID",
    "CANCELLED",
  ]).default("TODO"),
  box: z.string().optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  discount: z.number().min(0).default(0),
  scheduledFor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um serviço."),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId, role } = session;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const isBudget = searchParams.get("isBudget") === "true";
    const q = searchParams.get("q") || "";

    const statusFilter = isBudget
      ? { in: ["BUDGET_PENDING", "BUDGET_APPROVED"] }
      : status
      ? status
      : { in: ["TODO", "IN_PROGRESS", "DONE", "PAID"] };

    const orders = await prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: statusFilter,
        OR: q
          ? [
              { vehicle: { plate: { contains: q.toUpperCase().replace("-", "") } } },
              { vehicle: { customer: { name: { contains: q } } } },
              { vehicle: { model: { contains: q } } },
            ]
          : undefined,
      },
      include: {
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
        assignedUser: { select: { id: true, name: true } },
        checklist: {
          select: { id: true, fuelLevel: true, damageRecords: { select: { id: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Se for OPERATOR, omite valores monetários totais
    const sanitized = orders.map((o) => {
      const activeCustomer = o.vehicle.customer || o.vehicle.customerVehicles?.[0]?.customer;
      return {
        ...o,
        vehicle: {
          ...o.vehicle,
          customer: activeCustomer || null,
        },
        totalAmount: role === "ADMIN" ? o.totalAmount : null,
        subtotal: role === "ADMIN" ? o.subtotal : null,
        discount: role === "ADMIN" ? o.discount : null,
        paidAmount: role === "ADMIN" ? o.paidAmount : null,
        items: o.items.map((i) => ({
          ...i,
          unitPrice: role === "ADMIN" ? i.unitPrice : null,
          totalPrice: role === "ADMIN" ? i.totalPrice : null,
          commissionAmount: role === "ADMIN" ? i.commissionAmount : null,
        })),
      };
    });

    return NextResponse.json({ orders: sanitized });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId, userId, role } = session;

    const body = await req.json();
    const validated = orderCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;
    if (data.assignedUserId) {
      const assignee = await prisma.user.findFirst({ where: { id: data.assignedUserId, tenantId, active: true }, select: { id: true } });
      if (!assignee) {
        return NextResponse.json({ error: "Colaborador responsável inválido." }, { status: 400 });
      }
    }

    // Se um box foi selecionado na entrada, valida sua capacidade e bloqueia se estiver cheio
    if (data.box) {
      const targetBay = await prisma.workBay.findFirst({
        where: {
          tenantId,
          active: true,
          OR: [
            { name: { equals: data.box } },
            { id: { equals: data.box } },
          ],
        },
      });

      if (targetBay) {
        const activeCount = await prisma.serviceOrder.count({
          where: {
            tenantId,
            status: { in: ["TODO", "IN_PROGRESS", "DONE"] },
            box: targetBay.name,
          },
        });

        if (activeCount >= targetBay.capacity) {
          return NextResponse.json(
            {
              error: `Bloqueado: O ${targetBay.name} está LOTADO (${activeCount}/${targetBay.capacity} vagas ocupadas). Selecione outro box disponível no pátio.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 1. Busca veículo e sua categoria
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, tenantId },
      include: { customer: true },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Veículo não encontrado neste estabelecimento." },
        { status: 404 }
      );
    }

    // 2. Busca os serviços cadastrados no tenant para congelar snapshots de preço e comissão
    const serviceIds = data.items.map((i) => i.serviceId);
    const catalogServices = await prisma.service.findMany({
      where: { id: { in: serviceIds }, tenantId },
    });

    if (catalogServices.length !== serviceIds.length) {
      return NextResponse.json(
        { error: "Um ou mais serviços selecionados não existem ou foram desativados." },
        { status: 400 }
      );
    }

    // 3. Monta itens congelados aplicando a categoria de porte do veículo
    let subtotal = 0;
    const itemsToCreate = data.items.map((inputItem) => {
      const serv = catalogServices.find((s) => s.id === inputItem.serviceId)!;

      // Se não veio preço manual autorizado, calcula da matriz de preços por porte do carro
      let unitPrice = inputItem.unitPrice;
      if (unitPrice === undefined || unitPrice === null) {
        switch (vehicle.category) {
          case "HATCH":
            unitPrice = serv.priceHatch;
            break;
          case "SEDAN":
            unitPrice = serv.priceSedan;
            break;
          case "SUV_PICKUP":
            unitPrice = serv.priceSuvPickup;
            break;
          case "MOTORCYCLE":
            unitPrice = serv.priceMotorcycle;
            break;
          case "SPECIAL_UTILITY":
            unitPrice = serv.priceSpecial;
            break;
          default:
            unitPrice = serv.priceSedan;
        }
      }

      const totalPrice = unitPrice * inputItem.quantity;
      subtotal += totalPrice;

      const commissionRate = inputItem.commissionRate ?? serv.defaultCommission ?? 10;
      const commissionAmount = (totalPrice * commissionRate) / 100;

      return {
        serviceId: serv.id,
        serviceName: serv.name,
        unitPrice,
        quantity: inputItem.quantity,
        totalPrice,
        commissionRate,
        commissionAmount,
      };
    });

    const discount = data.discount || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    // 4. Gera próximo número sequencial da OS (ex: 1004)
    const highestOrder = await prisma.serviceOrder.findFirst({
      where: { tenantId },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = (highestOrder?.orderNumber || 1000) + 1;

    // 5. Criação Atômica da Ordem de Serviço / Orçamento
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.create({
        data: {
          tenantId,
          orderNumber,
          vehicleId: vehicle.id,
          assignedUserId: data.assignedUserId || userId,
          status: data.status,
          subtotal,
          discount,
          totalAmount,
          box: data.box || "Geral",
          mileage: data.mileage || null,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
          notes: data.notes || null,
          startedAt: data.status === "IN_PROGRESS" ? new Date() : null,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
          vehicle: { include: { customer: true } },
          assignedUser: { select: { id: true, name: true } },
        },
      });

      // Registra auditoria
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: data.status.startsWith("BUDGET") ? "CREATE_BUDGET" : "CREATE_ORDER",
          entity: "ServiceOrder",
          entityId: order.id,
          details: JSON.stringify({
            orderNumber,
            plate: vehicle.plate,
            totalAmount,
            status: data.status,
          }),
        },
      });

      return order;
    });

    return NextResponse.json({ order: createdOrder }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

