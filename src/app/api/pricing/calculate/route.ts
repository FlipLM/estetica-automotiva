import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const calculatePriceSchema = z.object({
  serviceId: z.string().uuid("ID de serviço inválido."),
  vehicleId: z.string().uuid().optional().nullable(),
  category: z
    .enum(["HATCH", "SEDAN", "SUV_PICKUP", "MOTORCYCLE", "SPECIAL_UTILITY"])
    .optional()
    .nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const body = await req.json();
    const validated = calculatePriceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { serviceId, vehicleId, category } = validated.data;

    let targetCategory = category;

    // Se informou vehicleId, busca a categoria cadastrada no carro
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, tenantId },
        select: { category: true, model: true, plate: true },
      });

      if (!vehicle) {
        return NextResponse.json(
          { error: "Veículo informado não encontrado." },
          { status: 404 }
        );
      }
      targetCategory = vehicle.category as any;
    }

    if (!targetCategory) {
      return NextResponse.json(
        { error: "É obrigatório informar o veículo ou a categoria de porte (HATCH, SEDAN, SUV_PICKUP, etc.)." },
        { status: 400 }
      );
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    // Aplicação da Matriz de Preços por Categoria de Porte
    let calculatedPrice = service.priceSedan;
    switch (targetCategory) {
      case "HATCH":
        calculatedPrice = service.priceHatch;
        break;
      case "SEDAN":
        calculatedPrice = service.priceSedan;
        break;
      case "SUV_PICKUP":
        calculatedPrice = service.priceSuvPickup;
        break;
      case "MOTORCYCLE":
        calculatedPrice = service.priceMotorcycle;
        break;
      case "SPECIAL_UTILITY":
        calculatedPrice = service.priceSpecial;
        break;
    }

    const commissionAmount = (calculatedPrice * (service.defaultCommission || 0)) / 100;

    return NextResponse.json({
      serviceId: service.id,
      serviceName: service.name,
      categoryApplied: targetCategory,
      unitPrice: calculatedPrice,
      estimatedMinutes: service.estimatedMinutes,
      commissionRate: service.defaultCommission,
      commissionAmount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

