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
  totalPaidInitial: z.number().min(0).optional(),
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
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const enriched = products.map((p) => {
      const inMovements = p.movements.filter((m) => m.type === "IN");
      const outMovements = p.movements.filter(
        (m) => m.type === "OUT" || m.type === "OS_CONSUMPTION"
      );
      const lossMovements = p.movements.filter((m) => m.type === "LOSS");
      const activeLossMovements = lossMovements.filter((m) => !m.recovered);

      // Cálculo do Custo Médio Unitário Ponderado entre todas as entradas
      const totalInQty = inMovements.reduce((acc, m) => acc + m.quantity, 0);
      const totalInSpent = inMovements.reduce((acc, m) => {
        const movTotal =
          m.totalCost !== null && m.totalCost !== undefined
            ? m.totalCost
            : m.quantity * (m.unitCost ?? p.costPrice);
        return acc + movTotal;
      }, 0);

      const averageUnitCost =
        totalInQty > 0 ? totalInSpent / totalInQty : p.costPrice;

      // Se o produto não tinha movimentação IN explícita (ex: seed antigo), considera o saldo atual * costPrice como gasto base
      const effectiveTotalSpentOnEntries =
        inMovements.length > 0 ? totalInSpent : p.currentStock * p.costPrice;

      const totalOutQty = outMovements.reduce((acc, m) => acc + m.quantity, 0);
      const totalOutValue = outMovements.reduce((acc, m) => {
        const movCost =
          m.totalCost !== null && m.totalCost !== undefined
            ? m.totalCost
            : m.quantity * (m.unitCost ?? averageUnitCost);
        return acc + movCost;
      }, 0);

      const totalLossQty = activeLossMovements.reduce(
        (acc, m) => acc + m.quantity,
        0
      );
      const totalLossValue = activeLossMovements.reduce((acc, m) => {
        const movCost =
          m.totalCost !== null && m.totalCost !== undefined
            ? m.totalCost
            : m.quantity * (m.unitCost ?? averageUnitCost);
        return acc + movCost;
      }, 0);

      const totalInventoryValue = p.currentStock * averageUnitCost;

      return {
        ...p,
        averageUnitCost,
        isLowStock: p.currentStock <= p.minStock,
        totalInventoryValue,
        stats: {
          entriesCount: inMovements.length,
          totalInQty,
          totalInSpent: effectiveTotalSpentOnEntries,
          outputsCount: outMovements.length,
          totalOutQty,
          totalOutValue,
          lossesCount: lossMovements.length,
          activeLossesCount: activeLossMovements.length,
          totalLossQty,
          totalLossValue,
        },
      };
    });

    const finalProducts = lowStockOnly
      ? enriched.filter((p) => p.isLowStock)
      : enriched;

    const lowStockCount = enriched.filter((p) => p.isLowStock).length;
    const totalInventoryValue = enriched.reduce(
      (sum, p) => sum + p.totalInventoryValue,
      0
    );
    const totalSpentEntries = enriched.reduce(
      (sum, p) => sum + p.stats.totalInSpent,
      0
    );
    const totalConsumedValue = enriched.reduce(
      (sum, p) => sum + p.stats.totalOutValue,
      0
    );
    const totalLossValue = enriched.reduce(
      (sum, p) => sum + p.stats.totalLossValue,
      0
    );

    // Ranking dos principais gastos com insumos (por valor investido em entradas + consumo)
    const topExpensesByProduct = [...enriched]
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        supplier: p.supplier,
        averageUnitCost: p.averageUnitCost,
        totalInSpent: p.stats.totalInSpent,
        totalInQty: p.stats.totalInQty || p.currentStock,
        totalOutValue: p.stats.totalOutValue,
        totalOutQty: p.stats.totalOutQty,
        totalLossValue: p.stats.totalLossValue,
        currentStock: p.currentStock,
      }))
      .sort((a, b) => b.totalInSpent - a.totalInSpent);

    // Gastos por categoria
    const categoryBreakdown = ["CHEMICAL", "ACCESSORY", "TOOL"].map((cat) => {
      const catProducts = enriched.filter((p) => p.category === cat);
      return {
        category: cat,
        productsCount: catProducts.length,
        totalSpent: catProducts.reduce((s, p) => s + p.stats.totalInSpent, 0),
        totalConsumed: catProducts.reduce(
          (s, p) => s + p.stats.totalOutValue,
          0
        ),
        inventoryValue: catProducts.reduce(
          (s, p) => s + p.totalInventoryValue,
          0
        ),
      };
    });

    return NextResponse.json({
      summary: {
        totalProducts: enriched.length,
        lowStockCount,
        totalInventoryValue,
        totalSpentEntries,
        totalConsumedValue,
        totalLossValue,
      },
      analytics: {
        topExpensesByProduct,
        categoryBreakdown,
      },
      products: finalProducts,
    });
  } catch (error: any) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createProductSchema.parse(body);

    // Se informou valor total pago na entrada inicial e quantidade > 0, calcula o custo unitário exato
    const computedUnitCost =
      validated.totalPaidInitial !== undefined &&
      validated.totalPaidInitial > 0 &&
      validated.currentStock > 0
        ? validated.totalPaidInitial / validated.currentStock
        : validated.costPrice;

    const computedTotalCost =
      validated.totalPaidInitial !== undefined && validated.totalPaidInitial > 0
        ? validated.totalPaidInitial
        : validated.currentStock * computedUnitCost;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          tenantId: session.tenantId,
          name: validated.name,
          category: validated.category,
          unit: validated.unit,
          currentStock: validated.currentStock,
          minStock: validated.minStock,
          costPrice: computedUnitCost,
          supplier: validated.supplier,
        },
      });

      if (validated.currentStock > 0) {
        // Se houver valor pago no lote inicial, registra automaticamente uma despesa no Financeiro (Contas a Pagar / DRE)
        let expenseId: string | null = null;
        if (computedTotalCost > 0) {
          const expense = await tx.expense.create({
            data: {
              tenantId: session.tenantId,
              description: `Compra de Insumo: ${validated.name} (${validated.currentStock} ${validated.unit})`,
              amount: computedTotalCost,
              category: "PRODUCTS",
              dueDate: new Date(),
              paid: true,
              paidAt: new Date(),
              notes: validated.supplier
                ? `Entrada inicial no estoque via fornecedor: ${validated.supplier}`
                : "Entrada inicial de saldo no cadastro do produto",
            },
          });
          expenseId = expense.id;
        }

        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: "IN",
            quantity: validated.currentStock,
            unitCost: computedUnitCost,
            totalCost: computedTotalCost,
            reason: "Saldo inicial de cadastro",
            expenseId: expenseId,
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
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao cadastrar produto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
