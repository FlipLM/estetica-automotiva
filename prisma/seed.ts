import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[*] Verificando estado atual do banco de dados...");
  const tenantCount = await prisma.tenant.count();
  if (tenantCount > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`[*] ${tenantCount} tenant(s) já existente(s) no banco. Seed ignorado para proteger dados de produção.`);
    console.log("[*] Para forçar a recriação do seed demo, execute com FORCE_SEED=true.");
    return;
  }
  console.log("[*] Iniciando seed do banco de dados...");

  // Limpa registros anteriores para evitar duplicidade em reexecuÃ§Ãµes
  await prisma.auditLog.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.commission.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.damageRecord.deleteMany({});
  await prisma.checklist.deleteMany({});
  await prisma.serviceOrderItem.deleteMany({});
  await prisma.serviceOrder.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 1. CriaÃ§Ã£o do Tenant Demonstrativo Oficial (Master Tenant Ativo Permanente)
  const tenant = await prisma.tenant.create({
    data: {
      name: "EstÃºdio Prime Detailing & EstÃ©tica Automotiva",
      tradingName: "Prime Detailing",
      document: "45.123.456/0001-89",
      phone: "(11) 98765-4321",
      whatsapp: "5511987654321",
      email: "contato@primedetailing.com.br",
      address: "Av. dos Bandeirantes, 1500 - SÃ£o Paulo, SP",
      active: true,
      plan: "ACTIVE",
      trialExpiresAt: null,
      isCustomPlan: true,
      onboardingCompleted: true,
    },
  });

  console.log(`[+] Tenant criado: ${tenant.name} (${tenant.id})`);

  // 2. CriaÃ§Ã£o de UsuÃ¡rios: 1 Admin e 1 Operador
  const passwordHash = await bcrypt.hash("senha123", 10);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Carlos Eduardo (Dono/Admin)",
      email: "admin@detailing.com",
      passwordHash,
      role: "ADMIN",
      phone: "(11) 99999-0001",
      active: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Marcos Polidor (Operador de PÃ¡tio)",
      email: "operador@detailing.com",
      passwordHash,
      role: "OPERATOR",
      phone: "(11) 99999-0002",
      commissionRate: 15.0,
      active: true,
    },
  });

  console.log(`[+] UsuÃ¡rios criados: Admin (${admin.email}) e Operador (${operator.email})`);

  // 3. CatÃ¡logo de ServiÃ§os com Matriz de PreÃ§os
  const servLavagem = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Lavagem TÃ©cnica Detalhada",
      description: "Lavagem minuciosa com descontaminaÃ§Ã£o ferrosa, limpeza de caixas de roda e secagem com ar forÃ§ado.",
      category: "LAVAGEM",
      estimatedMinutes: 90,
      priceHatch: 90.0,
      priceSedan: 110.0,
      priceSuvPickup: 140.0,
      priceMotorcycle: 60.0,
      priceSpecial: 170.0,
      estimatedCost: 18.0,
      defaultCommission: 10.0,
      active: true,
    },
  });

  const servHigienizacao = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "HigienizaÃ§Ã£o Interna Completa",
      description: "ExtraÃ§Ã£o de estofados a quente, higienizaÃ§Ã£o de cintos, teto, painel e oxi-sanitizaÃ§Ã£o de cabine.",
      category: "HIGIENIZACAO",
      estimatedMinutes: 240,
      priceHatch: 350.0,
      priceSedan: 420.0,
      priceSuvPickup: 520.0,
      priceMotorcycle: 150.0,
      priceSpecial: 600.0,
      estimatedCost: 35.0,
      defaultCommission: 15.0,
      active: true,
    },
  });

  const servPolimento = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Polimento TÃ©cnico & CorreÃ§Ã£o de Pintura",
      description: "EliminaÃ§Ã£o de swirls, riscos mÃ©dios e restauraÃ§Ã£o de brilho em 2 ou 3 etapas.",
      category: "POLIMENTO",
      estimatedMinutes: 480,
      priceHatch: 600.0,
      priceSedan: 750.0,
      priceSuvPickup: 950.0,
      priceMotorcycle: 300.0,
      priceSpecial: 1100.0,
      estimatedCost: 70.0,
      defaultCommission: 25.0,
      active: true,
    },
  });

  const servVitrificacao = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "VitrificaÃ§Ã£o CerÃ¢mica 9H (ProteÃ§Ã£o 3 Anos)",
      description: "AplicaÃ§Ã£o de nano-revestimento cerÃ¢mico com alta hidrofobia e proteÃ§Ã£o contra raios UV e seiva.",
      category: "PROTECAO",
      estimatedMinutes: 300,
      priceHatch: 900.0,
      priceSedan: 1100.0,
      priceSuvPickup: 1400.0,
      priceMotorcycle: 450.0,
      priceSpecial: 1600.0,
      estimatedCost: 150.0,
      defaultCommission: 20.0,
      active: true,
    },
  });

  console.log("[+] 4 ServiÃ§os padrÃ£o criados com matriz de preÃ§os por porte.");

  // 4. Clientes e VeÃ­culos
  const c1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Rodrigo Silveira",
      document: "321.654.987-00",
      phone: "(11) 98111-2233",
      whatsapp: "5511981112233",
      email: "rodrigo.silveira@email.com",
      address: "Rua Oscar Freire, 300 - Jardins, SP",
      totalSpent: 860.0,
      visitsCount: 2,
    },
  });

  const v1 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      customerId: c1.id,
      plate: "BRA2E19",
      brand: "Toyota",
      model: "Corolla XEi",
      color: "Prata",
      year: 2023,
      category: "SEDAN",
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Camila Fernandes",
      document: "123.456.789-11",
      phone: "(11) 97222-3344",
      whatsapp: "5511972223344",
      email: "camila.fernandes@email.com",
      address: "Av. Paulista, 1000 - Bela Vista, SP",
      totalSpent: 1400.0,
      visitsCount: 1,
    },
  });

  const v2 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      customerId: c2.id,
      plate: "JEP4F90",
      brand: "Jeep",
      model: "Compass Longitude",
      color: "Preto",
      year: 2024,
      category: "SUV_PICKUP",
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Felipe Albuquerque",
      phone: "(11) 99888-7766",
      whatsapp: "5511998887766",
      totalSpent: 90.0,
      visitsCount: 1,
    },
  });

  const v3 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      customerId: c3.id,
      plate: "ONX1A23",
      brand: "Chevrolet",
      model: "Onix Premier",
      color: "Branco",
      year: 2022,
      category: "HATCH",
    },
  });

  console.log("[+] 3 Clientes e 3 VeÃ­culos criados.");

  // 5. Ordens de ServiÃ§o nos diferentes status do PÃ¡tio
  // OS 1: Para Fazer (Hatch - Onix)
  const os1 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      orderNumber: 1001,
      vehicleId: v3.id,
      assignedUserId: operator.id,
      status: "TODO",
      subtotal: 90.0,
      totalAmount: 90.0,
      box: "Box 1 - Entrada",
      mileage: 28500,
      notes: "Cliente solicitou atenÃ§Ã£o especial nas rodas.",
      items: {
        create: [
          {
            serviceId: servLavagem.id,
            serviceName: servLavagem.name,
            unitPrice: 90.0,
            quantity: 1,
            totalPrice: 90.0,
            commissionRate: 10.0,
            commissionAmount: 9.0,
          },
        ],
      },
    },
  });

  // OS 2: Em ServiÃ§o (Sedan - Corolla - Polimento + HigienizaÃ§Ã£o)
  const os2 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      orderNumber: 1002,
      vehicleId: v1.id,
      assignedUserId: operator.id,
      status: "IN_PROGRESS",
      subtotal: 1170.0,
      discount: 70.0,
      totalAmount: 1100.0,
      box: "Box 3 - Detailing Room",
      startedAt: new Date(),
      mileage: 18400,
      items: {
        create: [
          {
            serviceId: servPolimento.id,
            serviceName: servPolimento.name,
            unitPrice: 750.0,
            quantity: 1,
            totalPrice: 750.0,
            commissionRate: 25.0,
            commissionAmount: 187.5,
          },
          {
            serviceId: servHigienizacao.id,
            serviceName: servHigienizacao.name,
            unitPrice: 420.0,
            quantity: 1,
            totalPrice: 420.0,
            commissionRate: 15.0,
            commissionAmount: 63.0,
          },
        ],
      },
      checklist: {
        create: {
          fuelLevel: 65,
          valuablesLeft: "Ã“culos de sol no porta-luvas",
          damageRecords: {
            create: [
              {
                area: "FRONT",
                damageType: "CHIP",
                description: "Pequena trinca de pedra no para-choque dianteiro",
              },
              {
                area: "RIGHT_SIDE",
                damageType: "SCRATCH",
                description: "Risco superficial na porta traseira direita",
              },
            ],
          },
        },
      },
    },
  });

  // OS 3: ConcluÃ­do (SUV - Compass - VitrificaÃ§Ã£o)
  const os3 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      orderNumber: 1003,
      vehicleId: v2.id,
      assignedUserId: operator.id,
      status: "DONE",
      subtotal: 1400.0,
      totalAmount: 1400.0,
      box: "Box 2 - Secagem/FinalizaÃ§Ã£o",
      startedAt: new Date(Date.now() - 3600000 * 5),
      completedAt: new Date(),
      mileage: 9500,
      items: {
        create: [
          {
            serviceId: servVitrificacao.id,
            serviceName: servVitrificacao.name,
            unitPrice: 1400.0,
            quantity: 1,
            totalPrice: 1400.0,
            commissionRate: 20.0,
            commissionAmount: 280.0,
            completed: true,
          },
        ],
      },
    },
  });

  // 6. Despesas Iniciais para teste do DRE
  await prisma.expense.createMany({
    data: [
      {
        tenantId: tenant.id,
        description: "Aluguel do GalpÃ£o da EstÃ©tica",
        category: "RENT",
        amount: 3500.0,
        dueDate: new Date(),
        paid: true,
        paidAt: new Date(),
      },
      {
        tenantId: tenant.id,
        description: "Conta de Ãgua Sabesp (Consumo Alto)",
        category: "UTILITIES",
        amount: 620.0,
        dueDate: new Date(),
        paid: true,
        paidAt: new Date(),
      },
      {
        tenantId: tenant.id,
        description: "Compra de Shampoos e Desengraxantes Vonixx",
        category: "PRODUCTS",
        amount: 850.0,
        dueDate: new Date(),
        paid: true,
        paidAt: new Date(),
      },
    ],
  });

  console.log("[+] Seed finalizado com sucesso!");
  console.log("--------------------------------------------------");
  console.log("Credenciais para teste no ambiente local:");
  console.log("Admin:    admin@detailing.com    / senha123");
  console.log("Operador: operador@detailing.com / senha123");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("[-] Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


