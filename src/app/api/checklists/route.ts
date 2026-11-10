import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const damageSchema = z.object({
  area: z.string().min(1, "Área obrigatória."),
  damageType: z.string().min(1, "Tipo de dano obrigatório."),
  coordinateX: z.number().min(0).max(100).optional().nullable(),
  coordinateY: z.number().min(0).max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().default([]),
});

const checklistCreateSchema = z.object({
  serviceOrderId: z.string().uuid().optional().nullable(),
  vehicleId: z.string().uuid("ID do veículo obrigatório."),
  mileage: z.number().int().min(0).optional().nullable(),
  fuelLevel: z.number().int().min(0).max(100).default(50),
  valuablesLeft: z.string().optional().nullable(),
  photosUrls: z.array(z.string()).optional().default([]),
  customerConfirmed: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
  damages: z.array(damageSchema).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const plate = searchParams.get("plate");
    const customerId = searchParams.get("customerId");
    const q = searchParams.get("q");

    // Monta filtros flexíveis (por cliente, placa ou termo geral de busca)
    const whereClause: any = {
      serviceOrder: {
        tenantId,
      },
    };

    if (customerId) {
      whereClause.serviceOrder.vehicle = {
        OR: [
          { customerId },
          { customerVehicles: { some: { customerId } } },
        ],
      };
    } else if (plate) {
      whereClause.serviceOrder.vehicle = {
        plate: { contains: plate.toUpperCase().replace("-", "").trim() },
      };
    } else if (q && q.trim()) {
      const term = q.trim();
      const cleanPlate = term.toUpperCase().replace("-", "").replace(/\s+/g, "");
      whereClause.serviceOrder.OR = [
        { vehicle: { plate: { contains: cleanPlate } } },
        { vehicle: { model: { contains: term } } },
        { vehicle: { customer: { name: { contains: term } } } },
        { vehicle: { customer: { phone: { contains: term } } } },
        { vehicle: { customer: { document: { contains: term } } } },
      ];
    }

    const checklists = await prisma.checklist.findMany({
      where: whereClause,
      include: {
        serviceOrder: {
          include: {
            vehicle: {
              include: {
                customer: true,
                customerVehicles: { include: { customer: true } },
              },
            },
            assignedUser: { select: { id: true, name: true } },
          },
        },
        damageRecords: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const sanitized = checklists.map((chk) => {
      const activeCustomer =
        chk.serviceOrder.vehicle.customer ||
        chk.serviceOrder.vehicle.customerVehicles?.[0]?.customer;

      const parsedDamages = chk.damageRecords.map((d) => {
        let photos: string[] = [];
        if (d.photosUrls) {
          try {
            photos = JSON.parse(d.photosUrls);
          } catch (e) {
            photos = [];
          }
        }
        if (photos.length === 0 && d.photoUrl) {
          photos = [d.photoUrl];
        }
        return {
          ...d,
          photos,
          photoUrl: photos[0] || d.photoUrl || null,
        };
      });

      return {
        ...chk,
        serviceOrder: {
          ...chk.serviceOrder,
          vehicle: {
            ...chk.serviceOrder.vehicle,
            customer: activeCustomer || null,
          },
        },
        damageRecords: parsedDamages,
      };
    });

    return NextResponse.json({ checklists: sanitized });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId, userId } = session;

    const body = await req.json();
    const validated = checklistCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // 1. Garante que o veículo pertence a este tenant
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

    let targetOrderId = data.serviceOrderId;

    // 2. Se não veio uma OS existente, cria a OS de recepção de pátio na hora
    if (!targetOrderId) {
      const highestOrder = await prisma.serviceOrder.findFirst({
        where: { tenantId },
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });

      const nextNumber = (highestOrder?.orderNumber || 1000) + 1;

      const newOrder = await prisma.serviceOrder.create({
        data: {
          tenantId,
          orderNumber: nextNumber,
          vehicleId: vehicle.id,
          assignedUserId: userId,
          status: "TODO",
          mileage: data.mileage || null,
          box: "Recepção / Vistoria",
          notes: data.notes || "Entrada com vistoria digital 360",
        },
      });

      targetOrderId = newOrder.id;
    } else {
      // Se já veio OS, atualiza a KM dela se informada
      if (data.mileage) {
        await prisma.serviceOrder.update({
          where: { id: targetOrderId },
          data: { mileage: data.mileage },
        });
      }
    }

    // 3. Cria a Vistoria e as Avarias em uma transação atômica com suporte a múltiplas fotos
    const checklist = await prisma.$transaction(async (tx) => {
      // Se já existia checklist para esta OS, remove para reescrever
      await tx.damageRecord.deleteMany({
        where: { checklist: { serviceOrderId: targetOrderId! } },
      });
      await tx.checklist.deleteMany({
        where: { serviceOrderId: targetOrderId! },
      });

      const created = await tx.checklist.create({
        data: {
          serviceOrderId: targetOrderId!,
          fuelLevel: data.fuelLevel,
          valuablesLeft: data.valuablesLeft || null,
          photosUrls: JSON.stringify(data.photosUrls || []),
          customerConfirmed: data.customerConfirmed,
          confirmedAt: data.customerConfirmed ? new Date() : null,
          notes: data.notes || null,
          damageRecords: {
            create: data.damages.map((d) => {
              const photosArray =
                d.photos && d.photos.length > 0
                  ? d.photos
                  : d.photoUrl
                    ? [d.photoUrl]
                    : [];
              return {
                area: d.area,
                damageType: d.damageType,
                coordinateX: d.coordinateX || null,
                coordinateY: d.coordinateY || null,
                description: d.description || null,
                photoUrl: photosArray[0] || null,
                photosUrls: JSON.stringify(photosArray),
              };
            }),
          },
        },
        include: {
          damageRecords: true,
          serviceOrder: {
            include: {
              vehicle: {
                include: { customer: true },
              },
            },
          },
        },
      });

      // Registra trilha de auditoria
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CREATE_CHECKLIST",
          entity: "Checklist",
          entityId: created.id,
          details: JSON.stringify({
            orderNumber: created.serviceOrder.orderNumber,
            plate: vehicle.plate,
            damagesCount: data.damages.length,
          }),
        },
      });

      return created;
    });

    return NextResponse.json({ checklist }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
