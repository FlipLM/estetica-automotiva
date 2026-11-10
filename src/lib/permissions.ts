import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "./auth";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Garante que a requisição venha de um usuário autenticado.
 * Retorna o payload da sessão contendo tenantId e role.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Não autorizado. Faça login para continuar.", 401);
  }
  return session;
}

/**
 * Garante que a requisição seja feita por um Administrador/Dono da empresa.
 * Se for um OPERATOR tentando acessar faturamento, relatórios ou usuários, bloqueia com 403.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw new AuthError("Acesso negado. Apenas administradores podem acessar este recurso financeiro/estratégico.", 403);
  }
  return session;
}

/**
 * Helper para lidar com erros de autenticação e autorização em Route Handlers.
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error("Erro inesperado no servidor:", error);
  return NextResponse.json(
    { error: "Erro interno no servidor." },
    { status: 500 }
  );
}

