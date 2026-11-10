import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const customerCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres."),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido.").optional().nullable().or(z.literal("")),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const rawCustomers = await prisma.customer.findMany({
      where: {
        tenantId,
        OR: query
          ? [
              { name: { contains: query } },
              { phone: { contains: query } },
              { whatsapp: { contains: query } },
              { document: { contains: query } },
              { vehicles: { some: { plate: { contains: query.toUpperCase().replace("-", "").trim() } } } },
              { customerVehicles: { some: { vehicle: { plate: { contains: query.toUpperCase().replace("-", "").trim() } } } } },
            ]
          : undefined,
      },
      include: {
        vehicles: {
          select: {
            id: true,
            plate: true,
            model: true,
            brand: true,
            category: true,
            color: true,
            year: true,
          },
        },
        customerVehicles: {
          include: {
            vehicle: {
              select: {
                id: true,
                plate: true,
                model: true,
                brand: true,
                category: true,
                color: true,
                year: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    // Unifica e deduplica veículos vinculados direta ou indiretamente ao cliente
    const customers = rawCustomers.map((c) => {
      const vMap = new Map();
      c.vehicles.forEach((v) => vMap.set(v.id, v));
      c.customerVehicles.forEach((cv) => {
        if (cv.vehicle) {
          vMap.set(cv.vehicle.id, cv.vehicle);
        }
      });
      return {
        id: c.id,
        name: c.name,
        document: c.document,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        address: c.address,
        notes: c.notes,
        totalSpent: c.totalSpent,
        visitsCount: c.visitsCount,
        lastVisitAt: c.lastVisitAt,
        createdAt: c.createdAt,
        vehicles: Array.from(vMap.values()),
      };
    });

    return NextResponse.json({ customers });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;

    const body = await req.json();
    const validated = customerCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: data.name,
        document: data.document || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || data.phone || null,
        email: data.email || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address || null,
        notes: data.notes || null,
      },
      include: {
        vehicles: true,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

