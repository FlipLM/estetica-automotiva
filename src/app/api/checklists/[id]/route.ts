import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = session;
    const { id } = params;

    const checklist = await prisma.checklist.findFirst({
      where: {
        id,
        serviceOrder: { tenantId },
      },
      include: {
        damageRecords: true,
        serviceOrder: {
          include: {
            tenant: true,
            vehicle: {
              include: {
                customer: true,
                customerVehicles: { include: { customer: true } },
              },
            },
            assignedUser: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    if (!checklist) {
      return NextResponse.json(
        { error: "Vistoria não encontrada." },
        { status: 404 }
      );
    }

    const activeCustomer =
      checklist.serviceOrder.vehicle.customer ||
      checklist.serviceOrder.vehicle.customerVehicles?.[0]?.customer;

    const parsedDamages = checklist.damageRecords.map((d) => {
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
      let anchor3D = null;
      if ((d as any).anchor3D) {
        try {
          anchor3D = typeof (d as any).anchor3D === "string" ? JSON.parse((d as any).anchor3D) : (d as any).anchor3D;
        } catch {
          anchor3D = null;
        }
      }
      return {
        ...d,
        photos,
        photoUrl: photos[0] || d.photoUrl || null,
        anchor3D,
      };
    });

    const sanitized = {
      ...checklist,
      serviceOrder: {
        ...checklist.serviceOrder,
        vehicle: {
          ...checklist.serviceOrder.vehicle,
          customer: activeCustomer || null,
        },
      },
      damageRecords: parsedDamages,
    };

    return NextResponse.json({ checklist: sanitized });
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
    const { tenantId } = session;
    const { id } = params;

    const body = await req.json();

    const existing = await prisma.checklist.findFirst({
      where: { id, serviceOrder: { tenantId } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Vistoria não encontrada." },
        { status: 404 }
      );
    }

    const updated = await prisma.checklist.update({
      where: { id },
      data: {
        fuelLevel: body.fuelLevel !== undefined ? body.fuelLevel : existing.fuelLevel,
        valuablesLeft: body.valuablesLeft !== undefined ? body.valuablesLeft : existing.valuablesLeft,
        customerConfirmed: body.customerConfirmed !== undefined ? body.customerConfirmed : existing.customerConfirmed,
        confirmedAt: body.customerConfirmed ? new Date() : existing.confirmedAt,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    return NextResponse.json({ checklist: updated });
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
    const { tenantId } = session;
    const { id } = params;

    const existing = await prisma.checklist.findFirst({
      where: { id, serviceOrder: { tenantId } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Vistoria não encontrada." },
        { status: 404 }
      );
    }

    await prisma.damageRecord.deleteMany({ where: { checklistId: id } });
    await prisma.checklist.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Vistoria removida com sucesso." });
  } catch (error) {
    return handleAuthError(error);
  }
}

