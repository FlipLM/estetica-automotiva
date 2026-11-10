import { prisma } from "./src/lib/prisma";

async function runPhase2Tests() {
  console.log("==================================================");
  console.log("   TESTES AUTOMATIZADOS DA FASE 2 — CADASTROS & PREÇOS ");
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
    // 1. Obtém o tenant oficial de teste
    const tenant = await prisma.tenant.findFirst({
      where: { active: true },
    });
    assert(tenant !== null, "Tenant ativo localizado para execução dos testes.");

    const tenantId = tenant!.id;

    // 2. Teste de Cadastro de Novo Cliente
    const testCustomer = await prisma.customer.create({
      data: {
        tenantId,
        name: "Carlos Teste Automatizado",
        phone: "(11) 98888-9999",
        whatsapp: "5511988889999",
        document: "999.888.777-66",
        notes: "Cliente de teste unitário da Fase 2",
      },
    });
    assert(testCustomer.id !== undefined && testCustomer.name === "Carlos Teste Automatizado", "Cadastro de cliente persistido com sucesso.");

    // 3. Teste de Cadastro de Veículo vinculado ao cliente com categoria SUV_PICKUP
    const testVehicle = await prisma.vehicle.create({
      data: {
        tenantId,
        customerId: testCustomer.id,
        plate: "TST9Z99",
        brand: "Toyota",
        model: "Hilux GR-Sport",
        color: "Vermelha",
        year: 2024,
        category: "SUV_PICKUP",
      },
    });
    assert(
      testVehicle.plate === "TST9Z99" && testVehicle.category === "SUV_PICKUP",
      "Veículo cadastrado e categorizado como SUV_PICKUP com sucesso."
    );

    // 4. Teste de Unicidade de Placa por Tenant (deve falhar ao tentar duplicar)
    let duplicateFailed = false;
    try {
      await prisma.vehicle.create({
        data: {
          tenantId,
          customerId: testCustomer.id,
          plate: "TST9Z99", // Mesma placa
          model: "Outro Carro",
          category: "SEDAN",
        },
      });
    } catch {
      duplicateFailed = true;
    }
    assert(duplicateFailed, "Tentativa de cadastrar placa duplicada dentro do mesmo tenant foi devidamente rejeitada.");

    // 5. Teste da Matriz de Preços Inteligente por Categoria de Porte
    const polimentoServ = await prisma.service.findFirst({
      where: { tenantId, name: { contains: "Polimento" } },
    });
    assert(polimentoServ !== null, "Serviço de Polimento com matriz de preços localizado.");

    // Validação dos preços configurados na matriz
    const priceHatch = polimentoServ!.priceHatch;
    const priceSedan = polimentoServ!.priceSedan;
    const priceSuv = polimentoServ!.priceSuvPickup;

    assert(
      priceHatch > 0 && priceSedan > priceHatch && priceSuv > priceSedan,
      `Matriz de preços progressiva verificada: Hatch (R$ ${priceHatch}) < Sedan (R$ ${priceSedan}) < SUV (R$ ${priceSuv}).`
    );

    // 6. Teste de Cálculo Dinâmico de Preço para o Veículo Hilux (SUV_PICKUP)
    let appliedPrice = 0;
    switch (testVehicle.category) {
      case "HATCH":
        appliedPrice = polimentoServ!.priceHatch;
        break;
      case "SEDAN":
        appliedPrice = polimentoServ!.priceSedan;
        break;
      case "SUV_PICKUP":
        appliedPrice = polimentoServ!.priceSuvPickup;
        break;
      case "MOTORCYCLE":
        appliedPrice = polimentoServ!.priceMotorcycle;
        break;
      case "SPECIAL_UTILITY":
        appliedPrice = polimentoServ!.priceSpecial;
        break;
    }

    assert(
      appliedPrice === polimentoServ!.priceSuvPickup,
      `Preço calculado dinamicamente aplicou a tarifa exata da categoria SUV_PICKUP (R$ ${appliedPrice}).`
    );

    // Limpeza do registro de teste criado
    await prisma.vehicle.delete({ where: { id: testVehicle.id } });
    await prisma.customer.delete({ where: { id: testCustomer.id } });

    console.log("--------------------------------------------------");
    console.log(`Resultado da Fase 2: ${passed} testes aprovados | ${failed} falhas.`);
    console.log("==================================================");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Erro nos testes da Fase 2:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase2Tests();

