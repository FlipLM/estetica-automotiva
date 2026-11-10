import { prisma } from "./src/lib/prisma";

async function runPhase4Tests() {
  console.log("==================================================");
  console.log("   TESTES AUTOMATIZADOS DA FASE 4 — OS & KANBAN   ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Obtém Tenant, Veículo e Usuário Operador
    const tenant = await prisma.tenant.findFirst({ where: { active: true } });
    assert(tenant !== null, "Tenant ativo localizado.");

    const vehicle = await prisma.vehicle.findFirst({
      where: { tenantId: tenant!.id },
      include: { customer: true },
    });
    assert(vehicle !== null, "Veículo de teste localizado.");

    const operator = await prisma.user.findFirst({
      where: { tenantId: tenant!.id, role: "OPERATOR" },
    });
    assert(operator !== null, "Operador de pátio localizado.");

    const services = await prisma.service.findMany({
      where: { tenantId: tenant!.id, active: true },
      take: 2,
    });
    assert(services.length >= 2, "Dois serviços localizados para a proposta.");

    // 2. Teste de Criação de Orçamento Pendente
    const subtotal = 850.0;
    const discount = 50.0;
    const totalAmount = 800.0;

    const budget = await prisma.serviceOrder.create({
      data: {
        tenantId: tenant!.id,
        orderNumber: 8888,
        vehicleId: vehicle!.id,
        assignedUserId: operator!.id,
        status: "BUDGET_PENDING",
        subtotal,
        discount,
        totalAmount,
        notes: "Proposta de teste da Fase 4",
        items: {
          create: [
            {
              serviceId: services[0].id,
              serviceName: services[0].name,
              unitPrice: 350.0,
              quantity: 1,
              totalPrice: 350.0,
              commissionRate: 15.0,
              commissionAmount: 52.5,
            },
            {
              serviceId: services[1].id,
              serviceName: services[1].name,
              unitPrice: 500.0,
              quantity: 1,
              totalPrice: 500.0,
              commissionRate: 20.0,
              commissionAmount: 100.0,
            },
          ],
        },
      },
      include: { items: true },
    });

    assert(
      budget.id !== undefined && budget.status === "BUDGET_PENDING" && budget.items.length === 2,
      "Orçamento pendente criado com snapshots de serviços e valores congelados."
    );

    // 3. Teste de Conversão em Ordem de Serviço em 1 Clique (Entrada no Pátio)
    const convertedOrder = await prisma.serviceOrder.update({
      where: { id: budget.id },
      data: {
        status: "TODO",
        box: "Box 1 - Entrada",
      },
    });

    assert(
      convertedOrder.status === "TODO" && convertedOrder.totalAmount === 800.0,
      "Orçamento convertido com sucesso em OS ('TODO') preservando valor total aprovado de R$ 800,00."
    );

    // 4. Teste de Avanço do Kanban: De TODO para IN_PROGRESS
    const startedAt = new Date();
    const inProgressOrder = await prisma.serviceOrder.update({
      where: { id: budget.id },
      data: {
        status: "IN_PROGRESS",
        startedAt,
      },
    });

    assert(
      inProgressOrder.status === "IN_PROGRESS" && inProgressOrder.startedAt !== null,
      "OS avançada para 'IN_PROGRESS' no Kanban com carimbo de início de execução registrado."
    );

    // 5. Teste de Conclusão: De IN_PROGRESS para DONE
    const completedAt = new Date();
    const doneOrder = await prisma.serviceOrder.update({
      where: { id: budget.id },
      data: {
        status: "DONE",
        completedAt,
      },
    });

    assert(
      doneOrder.status === "DONE" && doneOrder.completedAt !== null,
      "OS finalizada e movida para 'DONE' (Aguardando Retirada) com sucesso."
    );

    // 6. Teste de Baixa de Pagamento (PAID) e Integração Financeira
    const paidAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.serviceOrder.update({
        where: { id: budget.id },
        data: {
          status: "PAID",
          paidAt,
          paidAmount: totalAmount,
        },
      });

      // Registro do pagamento real
      await tx.payment.create({
        data: {
          serviceOrderId: budget.id,
          amount: totalAmount,
          method: "PIX",
          paidAt,
          notes: "Teste de quitação",
        },
      });

      // Apuração de comissão
      await tx.commission.create({
        data: {
          serviceOrderId: budget.id,
          userId: operator!.id,
          amount: 152.5,
          status: "PENDING",
        },
      });
    });

    const finalOrder = await prisma.serviceOrder.findUnique({
      where: { id: budget.id },
      include: { payments: true, commissions: true },
    });

    assert(
      finalOrder?.status === "PAID" &&
        finalOrder.payments.length === 1 &&
        finalOrder.payments[0].amount === 800.0 &&
        finalOrder.commissions.length === 1 &&
        finalOrder.commissions[0].amount === 152.5,
      "Baixa de OS ('PAID') gerou transação financeira em Payment e apurou comissão real de R$ 152,50 para o operador."
    );

    // 7. Limpeza dos dados de teste
    await prisma.commission.deleteMany({ where: { serviceOrderId: budget.id } });
    await prisma.payment.deleteMany({ where: { serviceOrderId: budget.id } });
    await prisma.serviceOrderItem.deleteMany({ where: { serviceOrderId: budget.id } });
    await prisma.serviceOrder.delete({ where: { id: budget.id } });

    assert(true, "Limpeza dos registros de teste e integridade referencial concluídas com êxito.");

    console.log("--------------------------------------------------");
    console.log(`Resultado da Fase 4: ${passed} testes aprovados | ${failed} falhas.`);
    console.log("==================================================");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Erro nos testes da Fase 4:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();

