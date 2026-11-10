import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const registerSchema = z.object({
  companyName: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres."),
  tradingName: z.string().optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  adminName: z.string().min(3, "Seu nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verifica se já existe um usuário com esse email globalmente ou no mesmo tenant
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado no sistema." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    // Cria o Tenant, Administrador e estrutura inicial do MVP (Trial de 3 Dias)
    const result = await prisma.$transaction(async (tx) => {
      const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 72 horas

      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          tradingName: data.tradingName || data.companyName,
          document: data.document,
          phone: data.phone,
          active: true,
          plan: "TRIAL",
          trialExpiresAt,
          isCustomPlan: false,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.adminName,
          email: data.email,
          passwordHash,
          role: "ADMIN",
          phone: data.phone,
          active: true,
        },
      });

      // 1. Boxes / Vagas Operacionais Padrão para o Pátio do Lead
      await tx.workBay.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: "Box 1 - Lavagem & Descontaminação",
            type: "LAVAGEM",
            capacity: 1,
            active: true,
          },
          {
            tenantId: tenant.id,
            name: "Box 2 - Polimento & Correção",
            type: "POLIMENTO",
            capacity: 1,
            active: true,
          },
          {
            tenantId: tenant.id,
            name: "Box 3 - Secagem, Vistoria & Entrega",
            type: "GERAL",
            capacity: 1,
            active: true,
          },
        ],
      });

      // 2. Serviços Essenciais Pré-Cadastrados para Estética Automotiva
      const sLavagem = await tx.service.create({
        data: {
          tenantId: tenant.id,
          name: "Lavagem Técnica Detalhada",
          category: "LAVAGEM",
          estimatedMinutes: 90,
          priceHatch: 90.0,
          priceSedan: 110.0,
          priceSuvPickup: 140.0,
          priceMotorcycle: 60.0,
          priceSpecial: 180.0,
          defaultCommission: 10.0,
        },
      });

      const sPolimento = await tx.service.create({
        data: {
          tenantId: tenant.id,
          name: "Polimento Comercial & Brilho",
          category: "POLIMENTO",
          estimatedMinutes: 180,
          priceHatch: 450.0,
          priceSedan: 550.0,
          priceSuvPickup: 650.0,
          priceMotorcycle: 200.0,
          priceSpecial: 800.0,
          defaultCommission: 15.0,
        },
      });

      await tx.service.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: "Higienização Interna Completa",
            category: "HIGIENIZACAO",
            estimatedMinutes: 240,
            priceHatch: 350.0,
            priceSedan: 420.0,
            priceSuvPickup: 500.0,
            priceMotorcycle: 150.0,
            priceSpecial: 600.0,
            defaultCommission: 15.0,
          },
          {
            tenantId: tenant.id,
            name: "Vitrificação Cerâmica 9H (Pintura)",
            category: "VITRIFICACAO",
            estimatedMinutes: 360,
            priceHatch: 1200.0,
            priceSedan: 1450.0,
            priceSuvPickup: 1750.0,
            priceMotorcycle: 600.0,
            priceSpecial: 2200.0,
            defaultCommission: 20.0,
          },
          {
            tenantId: tenant.id,
            name: "Cristalização & Repelência de Parabrisa",
            category: "CRISTALIZACAO",
            estimatedMinutes: 45,
            priceHatch: 120.0,
            priceSedan: 140.0,
            priceSuvPickup: 160.0,
            priceMotorcycle: 80.0,
            priceSpecial: 190.0,
            defaultCommission: 10.0,
          },
        ],
      });

      // 3. Cliente e Veículo de Demonstração para Teste Imediato do Lead
      const demoCustomer = await tx.customer.create({
        data: {
          tenantId: tenant.id,
          name: "Cliente Exemplo (Demonstração)",
          phone: "(11) 98888-7777",
          whatsapp: "5511988887777",
          email: "cliente.exemplo@detailpro.com.br",
          document: "123.456.789-00",
        },
      });

      const demoVehicle = await tx.vehicle.create({
        data: {
          tenantId: tenant.id,
          customerId: demoCustomer.id,
          plate: "BRA2E19",
          model: "Corolla Altis Hybrid",
          brand: "Toyota",
          category: "SEDAN",
          color: "Preto Metálico",
          year: 2024,
        },
      });

      // Ordem de Serviço de Exemplo no Pátio
      const demoOrder = await tx.serviceOrder.create({
        data: {
          tenantId: tenant.id,
          vehicleId: demoVehicle.id,
          orderNumber: 1001,
          status: "IN_PROGRESS",
          box: "Box 1 - Lavagem & Descontaminação",
          mileage: 18500,
          subtotal: 660.0,
          discount: 0,
          totalAmount: 660.0,
          paidAmount: 0,
          assignedUserId: user.id,
          notes: "Veículo de demonstração para testar Kanban do Pátio, Vistoria e Orçamento.",
        },
      });

      await tx.serviceOrderItem.createMany({
        data: [
          {
            serviceOrderId: demoOrder.id,
            serviceId: sLavagem.id,
            serviceName: "Lavagem Técnica Detalhada",
            unitPrice: 110.0,
            quantity: 1,
            totalPrice: 110.0,
            commissionAmount: 11.0,
            completed: true,
          },
          {
            serviceOrderId: demoOrder.id,
            serviceId: sPolimento.id,
            serviceName: "Polimento Comercial & Brilho",
            unitPrice: 550.0,
            quantity: 1,
            totalPrice: 550.0,
            commissionAmount: 82.5,
            completed: false,
          },
        ],
      });

      return { tenant, user };
    });

    const token = await signToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      name: result.user.name,
      role: "ADMIN",
      tenantName: result.tenant.tradingName || result.tenant.name,
      plan: "TRIAL",
      trialExpiresAt: result.tenant.trialExpiresAt?.toISOString() || null,
    });

    const isHttps =
      req.url.startsWith("https://") ||
      req.headers.get("x-forwarded-proto") === "https";

    const response = NextResponse.json({
      success: true,
      token,
      message: "Empresa e administrador cadastrados com sucesso!",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          plan: result.tenant.plan,
          trialExpiresAt: result.tenant.trialExpiresAt,
        },
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao cadastrar empresa." },
      { status: 500 }
    );
  }
}

