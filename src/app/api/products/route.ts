import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createProductSchema = z.object({
  name: z.string().min(2, "Nome do produto é obrigatório"),
  category: z.enum(["CHEMICAL", "ACCESSORY", "TOOL"]).default("CHEMICAL"),
  unit: z.enum(["ML", "L", "G", "KG", "UN"]).default("ML"),
  currentStock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(5),
  costPrice: z.number().min(0).default(0),
  supplier: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const whereCondition: any = {
      tenantId: session.tenantId,
    };

    if (category) {
      whereCondition.category = category;
    }

    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { supplier: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        movements: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const enriched = products.map((p) => ({
      ...p,
      isLowStock: p.currentStock <= p.minStock,
      totalInventoryValue: p.currentStock * p.costPrice,
    }));

    const finalProducts = lowStockOnly ? enriched.filter((p) => p.isLowStock) : enriched;

    const lowStockCount = enriched.filter((p) => p.isLowStock).length;
    const totalInventoryValue = enriched.reduce((sum, p) => sum + p.totalInventoryValue, 0);

    return NextResponse.json({
      summary: {
        totalProducts: enriched.length,
        lowStockCount,
        totalInventoryValue,
      },
      products: finalProducts,
    });
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores podem cadastrar produtos no estoque" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createProductSchema.parse(body);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          tenantId: session.tenantId,
          name: validated.name,
          category: validated.category,
          unit: validated.unit,
          currentStock: validated.currentStock,
          minStock: validated.minStock,
          costPrice: validated.costPrice,
          supplier: validated.supplier,
        },
      });

      // Se iniciou com estoque maior que 0, registra a movimentação inicial
      if (validated.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: "IN",
            quantity: validated.currentStock,
            reason: "Saldo inicial de implantação",
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      { message: "Produto cadastrado com sucesso", product },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 });
    }
    console.error("Erro ao cadastrar produto:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

