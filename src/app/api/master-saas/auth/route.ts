import { NextRequest, NextResponse } from "next/server";
import { isValidMasterKey, signMasterToken, isMasterAuthenticated, MASTER_COOKIE_NAME } from "@/lib/master-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await isMasterAuthenticated();
  return NextResponse.json({ authenticated: isAuth });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { masterKey } = body;

    if (!masterKey || !isValidMasterKey(masterKey)) {
      return NextResponse.json(
        { error: "Chave mestre de segurança incorreta." },
        { status: 401 }
      );
    }

    const token = await signMasterToken();

    const response = NextResponse.json({
      success: true,
      message: "Autenticação Master concedida com sucesso.",
    });

    response.cookies.set({
      name: MASTER_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error: any) {
    console.error("[MASTER_AUTH_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno no servidor de autenticação master." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Sessão master encerrada." });
  response.cookies.delete(MASTER_COOKIE_NAME);
  return response;
}
