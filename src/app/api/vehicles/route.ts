import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const vehicleCreateSchema = z.object({
  customerId: z.string().uuid("ID do cliente inválido."),
  plate: z
    .string()
    .min(7, "Placa deve ter no mínimo 7 caracteres.")
    .max(8, "Placa inválida.")
    .transform((val) => val.toUpperCase().replace("-", "").trim()),
  brand: z.string().optional().nullable(),
  model: z.string().min(1, "Modelo é obrigatório."),
  color: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  category: z.enum(["HATCH", "SEDAN", "SUV_PICKUP", "MOTORCYCLE", "SPECIAL_UTILITY"], {
    errorMap: () => ({ message: "Categoria de veículo inválida." }),
  }),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const plate = searchParams.get("plate");
    const customerId = searchParams.get("customerId");

    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId,
        plate: plate ? { contains: plate.toUpperCase().replace("-", "").trim() } : undefined,
        OR: customerId
          ? [
              { customerId },
              { customerVehicles: { some: { customerId } } },
            ]
          : undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            whatsapp: true,
            document: true,
          },
        },
        customerVehicles: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                whatsapp: true,
                document: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const body = await req.json();
    const validated = vehicleCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verifica se o cliente existe e pertence a este tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente associado não encontrado." },
        { status: 404 }
      );
    }

    // Verifica se já existe um veículo cadastrado com esta placa no estabelecimento
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { tenantId, plate: data.plate },
      include: { customer: true },
    });

    if (existingVehicle) {
      // Como um veículo pode pertencer a múltiplos clientes (famílias, empresas, motoristas adicionais),
      // vincula o cliente ao veículo existente via CustomerVehicle
      await prisma.customerVehicle.upsert({
        where: {
          customerId_vehicleId: {
            customerId: data.customerId,
            vehicleId: existingVehicle.id,
          },
        },
        create: {
          tenantId,
          customerId: data.customerId,
          vehicleId: existingVehicle.id,
          isPrimary: false,
        },
        update: {},
      });

      const updatedVehicle = await prisma.vehicle.findUnique({
        where: { id: existingVehicle.id },
        include: {
          customer: true,
          customerVehicles: {
            include: { customer: true },
          },
        },
      });

      return NextResponse.json(
        {
          vehicle: updatedVehicle,
          message: `Veículo placa ${data.plate} já existia e foi vinculado com sucesso ao cliente ${customer.name}.`,
          linkedExisting: true,
        },
        { status: 200 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        customerId: data.customerId,
        plate: data.plate,
        brand: data.brand || null,
        model: data.model,
        color: data.color || null,
        year: data.year || null,
        category: data.category,
        notes: data.notes || null,
        customerVehicles: {
          create: {
            tenantId,
            customerId: data.customerId,
            isPrimary: true,
          },
        },
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

