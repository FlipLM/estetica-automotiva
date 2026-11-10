import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

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

    // Cria o Tenant e o Administrador em uma transação atômica
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.companyName,
          tradingName: data.tradingName || data.companyName,
          document: data.document,
          phone: data.phone,
          active: true,
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

      // Cria alguns serviços essenciais pré-cadastrados para o novo tenant
      await tx.service.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: "Lavagem Técnica Detalhada",
            category: "LAVAGEM",
            estimatedMinutes: 90,
            priceHatch: 80.0,
            priceSedan: 100.0,
            priceSuvPickup: 130.0,
            priceMotorcycle: 50.0,
            priceSpecial: 160.0,
            defaultCommission: 10.0,
          },
          {
            tenantId: tenant.id,
            name: "Higienização Interna",
            category: "HIGIENIZACAO",
            estimatedMinutes: 240,
            priceHatch: 350.0,
            priceSedan: 420.0,
            priceSuvPickup: 500.0,
            priceMotorcycle: 150.0,
            priceSpecial: 600.0,
            defaultCommission: 15.0,
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
    });

    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Empresa e administrador cadastrados com sucesso!",
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
        },
      },
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao cadastrar empresa." },
      { status: 500 }
    );
  }
}

