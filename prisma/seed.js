"use strict";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  console.log("[*] Verificando estado atual do banco de dados...");
  const tenantCount = await prisma.tenant.count();
  if (tenantCount > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`[*] ${tenantCount} tenant(s) j\xE1 existente(s) no banco. Seed ignorado para proteger dados de produ\xE7\xE3o.`);
    console.log("[*] Para for\xE7ar a recria\xE7\xE3o do seed demo, execute com FORCE_SEED=true.");
    return;
  }
  console.log("[*] Iniciando seed do banco de dados...");
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
  const tenant = await prisma.tenant.create({
    data: {
      name: "Est\xC3\xBAdio Prime Detailing & Est\xC3\xA9tica Automotiva",
      tradingName: "Prime Detailing",
      document: "45.123.456/0001-89",
      phone: "(11) 98765-4321",
      whatsapp: "5511987654321",
      email: "contato@primedetailing.com.br",
      address: "Av. dos Bandeirantes, 1500 - S\xC3\xA3o Paulo, SP",
      active: true,
      plan: "ACTIVE",
      trialExpiresAt: null,
      isCustomPlan: true,
      onboardingCompleted: true
    }
  });
  console.log(`[+] Tenant criado: ${tenant.name} (${tenant.id})`);
  const passwordHash = await bcrypt.hash("senha123", 10);
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Carlos Eduardo (Dono/Admin)",
      email: "admin@detailing.com",
      passwordHash,
      role: "ADMIN",
      phone: "(11) 99999-0001",
      active: true
    }
  });
  const operator = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Marcos Polidor (Operador de P\xC3\xA1tio)",
      email: "operador@detailing.com",
      passwordHash,
      role: "OPERATOR",
      phone: "(11) 99999-0002",
      commissionRate: 15,
      active: true
    }
  });
  console.log(`[+] Usu\xC3\xA1rios criados: Admin (${admin.email}) e Operador (${operator.email})`);
  const servLavagem = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Lavagem T\xC3\xA9cnica Detalhada",
      description: "Lavagem minuciosa com descontamina\xC3\xA7\xC3\xA3o ferrosa, limpeza de caixas de roda e secagem com ar for\xC3\xA7ado.",
      category: "LAVAGEM",
      estimatedMinutes: 90,
      priceHatch: 90,
      priceSedan: 110,
      priceSuvPickup: 140,
      priceMotorcycle: 60,
      priceSpecial: 170,
      estimatedCost: 18,
      defaultCommission: 10,
      active: true
    }
  });
  const servHigienizacao = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Higieniza\xC3\xA7\xC3\xA3o Interna Completa",
      description: "Extra\xC3\xA7\xC3\xA3o de estofados a quente, higieniza\xC3\xA7\xC3\xA3o de cintos, teto, painel e oxi-sanitiza\xC3\xA7\xC3\xA3o de cabine.",
      category: "HIGIENIZACAO",
      estimatedMinutes: 240,
      priceHatch: 350,
      priceSedan: 420,
      priceSuvPickup: 520,
      priceMotorcycle: 150,
      priceSpecial: 600,
      estimatedCost: 35,
      defaultCommission: 15,
      active: true
    }
  });
  const servPolimento = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Polimento T\xC3\xA9cnico & Corre\xC3\xA7\xC3\xA3o de Pintura",
      description: "Elimina\xC3\xA7\xC3\xA3o de swirls, riscos m\xC3\xA9dios e restaura\xC3\xA7\xC3\xA3o de brilho em 2 ou 3 etapas.",
      category: "POLIMENTO",
      estimatedMinutes: 480,
      priceHatch: 600,
      priceSedan: 750,
      priceSuvPickup: 950,
      priceMotorcycle: 300,
      priceSpecial: 1100,
      estimatedCost: 70,
      defaultCommission: 25,
      active: true
    }
  });
  const servVitrificacao = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Vitrifica\xC3\xA7\xC3\xA3o Cer\xC3\xA2mica 9H (Prote\xC3\xA7\xC3\xA3o 3 Anos)",
      description: "Aplica\xC3\xA7\xC3\xA3o de nano-revestimento cer\xC3\xA2mico com alta hidrofobia e prote\xC3\xA7\xC3\xA3o contra raios UV e seiva.",
      category: "PROTECAO",
      estimatedMinutes: 300,
      priceHatch: 900,
      priceSedan: 1100,
      priceSuvPickup: 1400,
      priceMotorcycle: 450,
      priceSpecial: 1600,
      estimatedCost: 150,
      defaultCommission: 20,
      active: true
    }
  });
  console.log("[+] 4 Servi\xC3\xA7os padr\xC3\xA3o criados com matriz de pre\xC3\xA7os por porte.");
  const c1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Rodrigo Silveira",
      document: "321.654.987-00",
      phone: "(11) 98111-2233",
      whatsapp: "5511981112233",
      email: "rodrigo.silveira@email.com",
      address: "Rua Oscar Freire, 300 - Jardins, SP",
      totalSpent: 860,
      visitsCount: 2
    }
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
      category: "SEDAN"
    }
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
      totalSpent: 1400,
      visitsCount: 1
    }
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
      category: "SUV_PICKUP"
    }
  });
  const c3 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Felipe Albuquerque",
      phone: "(11) 99888-7766",
      whatsapp: "5511998887766",
      totalSpent: 90,
      visitsCount: 1
    }
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
      category: "HATCH"
    }
  });
  console.log("[+] 3 Clientes e 3 Ve\xC3\xADculos criados.");
  const os1 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      orderNumber: 1001,
      vehicleId: v3.id,
      assignedUserId: operator.id,
      status: "TODO",
      subtotal: 90,
      totalAmount: 90,
      box: "Box 1 - Entrada",
      mileage: 28500,
      notes: "Cliente solicitou aten\xC3\xA7\xC3\xA3o especial nas rodas.",
      items: {
        create: [
          {
            serviceId: servLavagem.id,
            serviceName: servLavagem.name,
            unitPrice: 90,
            quantity: 1,
            totalPrice: 90,
            commissionRate: 10,
            commissionAmount: 9
          }
        ]
      }
    }
  });
  const os2 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      orderNumber: 1002,
      vehicleId: v1.id,
      assignedUserId: operator.id,
      status: "IN_PROGRESS",
      subtotal: 1170,
      discount: 70,
      totalAmount: 1100,
      box: "Box 3 - Detailing Room",
      startedAt: /* @__PURE__ */ new Date(),
      mileage: 18400,
      items: {
        create: [
          {
            serviceId: servPolimento.id,
            serviceName: servPolimento.name,
            unitPrice: 750,
            quantity: 1,
            totalPrice: 750,
            commissionRate: 25,
            commissionAmount: 187.5
          },
          {
            serviceId: servHigienizacao.id,
            serviceName: servHigienizacao.name,
            unitPrice: 420,
            quantity: 1,
            totalPrice: 420,
            commissionRate: 15,
            commissionAmount: 63
          }
        ]
      },
      checklist: {
        create: {
          fuelLevel: 65,
          valuablesLeft: "\xC3\u201Cculos de sol no porta-luvas",
          damageRecords: {
            create: [
              {
                area: "FRONT",
                damageType: "CHIP",
                description: "Pequena trinca de pedra no para-choque dianteiro"
              },
              {
                area: "RIGHT_SIDE",
                damageType: "SCRATCH",
                description: "Risco superficial na porta traseira direita"
              }
            ]
          }
        }
      }
    }
  });
  const os3 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      orderNumber: 1003,
      vehicleId: v2.id,
      assignedUserId: operator.id,
      status: "DONE",
      subtotal: 1400,
      totalAmount: 1400,
      box: "Box 2 - Secagem/Finaliza\xC3\xA7\xC3\xA3o",
      startedAt: new Date(Date.now() - 36e5 * 5),
      completedAt: /* @__PURE__ */ new Date(),
      mileage: 9500,
      items: {
        create: [
          {
            serviceId: servVitrificacao.id,
            serviceName: servVitrificacao.name,
            unitPrice: 1400,
            quantity: 1,
            totalPrice: 1400,
            commissionRate: 20,
            commissionAmount: 280,
            completed: true
          }
        ]
      }
    }
  });
  await prisma.expense.createMany({
    data: [
      {
        tenantId: tenant.id,
        description: "Aluguel do Galp\xC3\xA3o da Est\xC3\xA9tica",
        category: "RENT",
        amount: 3500,
        dueDate: /* @__PURE__ */ new Date(),
        paid: true,
        paidAt: /* @__PURE__ */ new Date()
      },
      {
        tenantId: tenant.id,
        description: "Conta de \xC3\x81gua Sabesp (Consumo Alto)",
        category: "UTILITIES",
        amount: 620,
        dueDate: /* @__PURE__ */ new Date(),
        paid: true,
        paidAt: /* @__PURE__ */ new Date()
      },
      {
        tenantId: tenant.id,
        description: "Compra de Shampoos e Desengraxantes Vonixx",
        category: "PRODUCTS",
        amount: 850,
        dueDate: /* @__PURE__ */ new Date(),
        paid: true,
        paidAt: /* @__PURE__ */ new Date()
      }
    ]
  });
  console.log("[+] Seed finalizado com sucesso!");
  console.log("--------------------------------------------------");
  console.log("Credenciais para teste no ambiente local:");
  console.log("Admin:    admin@detailing.com    / senha123");
  console.log("Operador: operador@detailing.com / senha123");
  console.log("--------------------------------------------------");
}
main().catch((e) => {
  console.error("[-] Erro no seed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
