import { NextRequest, NextResponse } from "next/server";
import {
  getMasterCredentials,
  signMasterToken,
  isMasterAuthenticated,
  MASTER_COOKIE_NAME,
} from "@/lib/master-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const authState = await isMasterAuthenticated();
  return NextResponse.json(authState);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe o e-mail e a senha do Administrador Geral." },
        { status: 400 }
      );
    }

    const masterCreds = getMasterCredentials();
    const inputEmail = String(email).trim().toLowerCase();
    const inputPassword = String(password);

    // Validação estrita de credenciais próprias do Gestor Master
    const isEmailValid = inputEmail === masterCreds.email;
    const isPasswordValid = inputPassword === masterCreds.password;

    if (!isEmailValid || !isPasswordValid) {
      return NextResponse.json(
        { error: "E-mail ou senha de administrador incorretos." },
        { status: 401 }
      );
    }

    const token = await signMasterToken(masterCreds.email, "Proprietário do SaaS");

    const response = NextResponse.json({
      success: true,
      message: "Login de Administrador Geral efetuado com sucesso.",
      user: {
        email: masterCreds.email,
        name: "Proprietário do SaaS",
      },
    });

    // Grava exclusivamente o cookie isolado da sessão master
    response.cookies.set({
      name: MASTER_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 4, // 4 horas
    });

    return response;
  } catch (error: any) {
    console.error("[MASTER_LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "Falha interna ao processar autenticação master." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Sessão master encerrada com sucesso.",
  });

  response.cookies.set({
    name: MASTER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
