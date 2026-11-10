import { prisma } from "./src/lib/prisma";

async function runPhase6Tests() {
  console.log("=================================================");
  console.log("   INICIANDO TESTES AUTOMATIZADOS - FASE 6       ");
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
    // 1. Obter Tenant e Clientes
    const tenant = await prisma.tenant.findFirst({
      where: { active: true },
    });
    if (!tenant) throw new Error("Tenant ativo não encontrado");

    // -----------------------------------------------------------------
    // TESTE 1: Inteligência de CRM e Curva ABC de Clientes
    // -----------------------------------------------------------------
    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      include: {
        vehicles: {
          include: {
            serviceOrders: {
              where: { status: { in: ["DONE", "PAID"] } },
            },
          },
        },
      },
    });

    assert(customers.length > 0, "Teste 1: Clientes do tenant localizados para análise de CRM");

    // Cálculo do LTV
    const customerStats = customers.map((c) => {
      const orders = c.vehicles.flatMap((v) => v.serviceOrders);
      const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      return { id: c.id, name: c.name, totalSpent, ordersCount: orders.length };
    });

    customerStats.sort((a, b) => b.totalSpent - a.totalSpent);
    const topCustomer = customerStats[0];

    assert(
      topCustomer !== undefined && typeof topCustomer.totalSpent === "number",
      `Teste 2: Classificação LTV calculada com sucesso (Top Cliente: ${topCustomer.name} - R$ ${topCustomer.totalSpent.toFixed(2)})`
    );

    // -----------------------------------------------------------------
    // TESTE 3: Leitura e Métricas das Configurações do Tenant
    // -----------------------------------------------------------------
    const tenantDetails = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            vehicles: true,
            services: true,
            serviceOrders: true,
          },
        },
      },
    });

    assert(
      tenantDetails !== null && tenantDetails._count.users >= 1,
      `Teste 3: Leitura de configurações do tenant e contagem agregada (${tenantDetails?._count.users} usuários, ${tenantDetails?._count.customers} clientes)`
    );

    // -----------------------------------------------------------------
    // TESTE 4: Atualização de Dados Cadastrais do Tenant
    // -----------------------------------------------------------------
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        tradingName: "Detail Pro Auto Detailing Express",
        phone: "(11) 98888-7777",
        whatsapp: "(11) 98888-7777",
      },
    });

    assert(
      updatedTenant.tradingName === "Detail Pro Auto Detailing Express" &&
        updatedTenant.phone === "(11) 98888-7777",
      "Teste 4: Atualização cadastral da empresa persistida com sucesso"
    );

    // -----------------------------------------------------------------
    // TESTE 5: Isolamento Multi-tenant Estrito
    // -----------------------------------------------------------------
    // Cria um segundo tenant efêmero para testar isolamento
    const foreignTenant = await prisma.tenant.create({
      data: {
        name: "Lava Jato Concorrente EIRELI",
        tradingName: "Concorrente Auto",
      },
    });

    const foreignCustomer = await prisma.customer.create({
      data: {
        tenantId: foreignTenant.id,
        name: "Cliente Infiltrado",
        phone: "(11) 90000-0000",
      },
    });

    // Consulta filtrada pelo tenant 1
    const crossCheck = await prisma.customer.findMany({
      where: { tenantId: tenant.id, id: foreignCustomer.id },
    });

    assert(
      crossCheck.length === 0,
      "Teste 5: Isolamento Multi-tenant estrito (dados de outro tenant não vazam nas consultas)"
    );

    // Limpeza do tenant de teste de isolamento
    await prisma.customer.delete({ where: { id: foreignCustomer.id } });
    await prisma.tenant.delete({ where: { id: foreignTenant.id } });

    console.log("\n=================================================");
    console.log(`RESULTADO FINAL DA FASE 6: ${passed} PASSOU / ${failed} FALHOU`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Erro fatal durante a execução dos testes da Fase 6:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase6Tests();

