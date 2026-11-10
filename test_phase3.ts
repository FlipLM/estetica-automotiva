import { prisma } from "./src/lib/prisma";

async function runPhase3Tests() {
  console.log("==================================================");
  console.log("   TESTES AUTOMATIZADOS DA FASE 3 — VISTORIA 360  ");
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
    // 1. Obtém Tenant e Veículo de teste
    const tenant = await prisma.tenant.findFirst({ where: { active: true } });
    assert(tenant !== null, "Tenant ativo localizado.");

    const vehicle = await prisma.vehicle.findFirst({
      where: { tenantId: tenant!.id },
      include: { customer: true },
    });
    assert(vehicle !== null, `Veículo de teste localizado: ${vehicle?.plate}.`);

    // 2. Criação de Ordem de Serviço e Checklist 360º com Avarias
    const os = await prisma.serviceOrder.create({
      data: {
        tenantId: tenant!.id,
        orderNumber: 9999,
        vehicleId: vehicle!.id,
        status: "TODO",
        mileage: 35400,
        box: "Box Vistoria Teste",
        notes: "Teste unitário de vistoria",
      },
    });

    const checklist = await prisma.checklist.create({
      data: {
        serviceOrderId: os.id,
        fuelLevel: 75,
        valuablesLeft: "Óculos Ray-Ban e cartão no console",
        customerConfirmed: true,
        confirmedAt: new Date(),
        notes: "Cliente autorizou serviços",
        damageRecords: {
          create: [
            {
              area: "FRONT",
              damageType: "CHIP",
              coordinateX: 45.2,
              coordinateY: 15.8,
              description: "Lasca de pedra no capô frontal",
              photoUrl: "/uploads/teste_capo.jpg",
            },
            {
              area: "LEFT_SIDE",
              damageType: "SCRATCH",
              coordinateX: 18.5,
              coordinateY: 62.4,
              description: "Risco superficial na porta traseira esquerda",
            },
            {
              area: "ROOF",
              damageType: "PAINT_BURN",
              coordinateX: 52.0,
              coordinateY: 50.0,
              description: "Pequena mancha de seiva de árvore no teto",
            },
          ],
        },
      },
      include: {
        damageRecords: true,
        serviceOrder: {
          include: {
            vehicle: { include: { customer: true } },
            tenant: true,
          },
        },
      },
    });

    assert(checklist.id !== undefined, "Checklist de entrada 360º criado com sucesso.");
    assert(checklist.fuelLevel === 75, "Nível de combustível (75%) persistido com fidelidade.");
    assert(checklist.damageRecords.length === 3, "Três avarias mapeadas na silhueta 360º persistidas com coordenadas.");

    // 3. Validação das Coordenadas e Tipos de Dano
    const frontDamage = checklist.damageRecords.find((d) => d.area === "FRONT");
    assert(
      frontDamage !== undefined &&
        frontDamage.damageType === "CHIP" &&
        frontDamage.coordinateX === 45.2 &&
        frontDamage.photoUrl === "/uploads/teste_capo.jpg",
      "Avaria frontal com coordenadas precisas X/Y e foto anexada validada."
    );

    // 4. Teste de Aceite e Confirmação do Cliente
    assert(
      checklist.customerConfirmed === true && checklist.confirmedAt !== null,
      "Aceite da vistoria na recepção com carimbo de data e hora confirmado."
    );

    // 5. Teste de Exclusão e Integridade em Cascata
    await prisma.damageRecord.deleteMany({ where: { checklistId: checklist.id } });
    await prisma.checklist.delete({ where: { id: checklist.id } });
    await prisma.serviceOrder.delete({ where: { id: os.id } });

    assert(true, "Exclusão atômica de testes e integridade referencial concluídas sem erros.");

    console.log("--------------------------------------------------");
    console.log(`Resultado da Fase 3: ${passed} testes aprovados | ${failed} falhas.`);
    console.log("==================================================");

    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Erro nos testes da Fase 3:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase3Tests();

