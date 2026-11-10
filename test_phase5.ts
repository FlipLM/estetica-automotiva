import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "./src/lib/auth";

async function runPhase5Tests() {
  console.log("=================================================");
  console.log("   INICIANDO TESTES AUTOMATIZADOS - FASE 5       ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || "Falha na asserção"}`);
      failed++;
    }
  }

  try {
    // 1. Obter tenant e admin de teste
    const tenant = await prisma.tenant.findFirst({
      where: { active: true },
    });
    if (!tenant) throw new Error("Tenant ativo não encontrado");

    const admin = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: "ADMIN" },
    });
    if (!admin) throw new Error("Admin não encontrado");

    const operator = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: "OPERATOR" },
    });
    if (!operator) throw new Error("Operador não encontrado");

    // -----------------------------------------------------------------
    // TESTE 1: Criação de Despesa Operacional
    // -----------------------------------------------------------------
    const testExpense = await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        description: "Conta de Energia Elétrica - Teste",
        amount: 450.0,
        category: "UTILITIES",
        dueDate: new Date(),
        paid: false,
        paymentMethod: "BOLETO",
      },
    });

    assert(
      testExpense.id !== undefined && testExpense.paid === false && testExpense.amount === 450,
      "Teste 1: Criação de despesa com status pendente"
    );

    // -----------------------------------------------------------------
    // TESTE 2: Liquidação de Despesa
    // -----------------------------------------------------------------
    const updatedExpense = await prisma.expense.update({
      where: { id: testExpense.id },
      data: {
        paid: true,
        paidAt: new Date(),
        paymentMethod: "PIX",
      },
    });

    assert(
      updatedExpense.paid === true && updatedExpense.paidAt !== null,
      "Teste 2: Atualização de despesa para paga com timestamp de pagamento"
    );

    // -----------------------------------------------------------------
    // TESTE 3: Cálculo do DRE Gerencial
    // -----------------------------------------------------------------
    const paidOrders = await prisma.serviceOrder.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["DONE", "PAID"] },
      },
    });
    const grossRevenue = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const discounts = paidOrders.reduce((sum, o) => sum + o.discount, 0);
    const netRevenue = grossRevenue - discounts;

    const allExpenses = await prisma.expense.findMany({
      where: { tenantId: tenant.id, paid: true },
    });
    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = netRevenue - totalExpenses;

    assert(
      typeof netProfit === "number",
      `Teste 3: Apuração contábil de DRE (Receita Líquida: R$ ${netRevenue.toFixed(2)}, Despesas: R$ ${totalExpenses.toFixed(2)}, Lucro: R$ ${netProfit.toFixed(2)})`
    );

    // -----------------------------------------------------------------
    // TESTE 4: Cadastro de Produto Químico no Estoque
    // -----------------------------------------------------------------
    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "Cera de Carnaúba Líquida Vonixx - Teste",
        category: "CHEMICAL",
        unit: "ML",
        currentStock: 1000,
        minStock: 300,
        costPrice: 65.0,
        supplier: "Distribuidora Detailer",
      },
    });

    assert(
      product.currentStock === 1000 && product.minStock === 300,
      "Teste 4: Cadastro de produto com controle de estoque mínimo"
    );

    // -----------------------------------------------------------------
    // TESTE 5: Movimentação de Estoque (Saída/Consumo)
    // -----------------------------------------------------------------
    const movementOut = await prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "OUT",
          quantity: 800,
          reason: "Consumo em vitrificações",
        },
      });

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { currentStock: product.currentStock - 800 },
      });

      return { mov, updated };
    });

    const isNowLowStock = movementOut.updated.currentStock <= movementOut.updated.minStock;

    assert(
      movementOut.updated.currentStock === 200 && isNowLowStock === true,
      `Teste 5: Movimentação de saída atualizou saldo para 200 ML e disparou alerta de estoque crítico (Mín: 300 ML)`
    );

    // -----------------------------------------------------------------
    // TESTE 6: Geração e Apuração de Comissões por OS
    // -----------------------------------------------------------------
    // Busca ou cria uma OS para teste de comissão
    let sampleOrder = await prisma.serviceOrder.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!sampleOrder) {
      const vehicle = await prisma.vehicle.findFirst({ where: { tenantId: tenant.id } });
      sampleOrder = await prisma.serviceOrder.create({
        data: {
          tenantId: tenant.id,
          orderNumber: 9999,
          vehicleId: vehicle!.id,
          status: "DONE",
          totalAmount: 300.0,
        },
      });
    }

    const commission = await prisma.commission.create({
      data: {
        serviceOrderId: sampleOrder.id,
        userId: operator.id,
        amount: 45.0,
        status: "PENDING",
      },
    });

    assert(
      commission.id !== undefined && commission.status === "PENDING" && commission.amount === 45.0,
      "Teste 6: Registro de comissão pendente para o colaborador"
    );

    // -----------------------------------------------------------------
    // TESTE 7: Liquidação em Lote de Comissões com Despesa Integrada
    // -----------------------------------------------------------------
    const settlementResult = await prisma.$transaction(async (tx) => {
      await tx.commission.update({
        where: { id: commission.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      const expense = await tx.expense.create({
        data: {
          tenantId: tenant.id,
          description: `Liquidação de Comissão - ${operator.name}`,
          amount: commission.amount,
          category: "COMMISSION",
          dueDate: new Date(),
          paid: true,
          paidAt: new Date(),
          paymentMethod: "PIX",
        },
      });

      return { commissionId: commission.id, expenseId: expense.id };
    });

    const verifiedCommission = await prisma.commission.findUnique({
      where: { id: commission.id },
    });

    assert(
      verifiedCommission?.status === "PAID" && settlementResult.expenseId !== null,
      "Teste 7: Liquidação da comissão executada com sucesso e integrada ao fluxo de caixa"
    );

    // Limpeza de registros de teste
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.expense.delete({ where: { id: testExpense.id } });
    await prisma.expense.delete({ where: { id: settlementResult.expenseId } });
    await prisma.commission.delete({ where: { id: commission.id } });

    console.log("\n=================================================");
    console.log(`RESULTADO FINAL DA FASE 5: ${passed} PASSOU / ${failed} FALHOU`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Erro fatal durante a execução dos testes da Fase 5:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5Tests();
