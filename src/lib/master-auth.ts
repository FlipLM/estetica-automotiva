import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { AUTH_COOKIE_NAME, getSession } from "./auth";

export const MASTER_COOKIE_NAME = "saas_master_session";

const MASTER_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "master-saas-super-secret-key-2026-secure"
);

export interface MasterSessionPayload {
  userId?: string;
  email: string;
  name?: string;
  isMaster: true;
}

export async function signMasterToken(payload: { email: string; userId?: string; name?: string }): Promise<string> {
  return new SignJWT({ ...payload, isMaster: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(MASTER_JWT_SECRET);
}

export async function verifyMasterToken(token: string): Promise<MasterSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, MASTER_JWT_SECRET);
    if (payload.isMaster === true) {
      return payload as unknown as MasterSessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function isMasterAuthenticated(): Promise<{ authenticated: boolean; user?: any }> {
  const cookieStore = cookies();
  
  // 1. Verifica cookie de sessão master dedicada
  const masterToken = cookieStore.get(MASTER_COOKIE_NAME)?.value;
  if (masterToken) {
    const payload = await verifyMasterToken(masterToken);
    if (payload) {
      return { authenticated: true, user: { email: payload.email, name: payload.name || "Administrador Master" } };
    }
  }

  // 2. Verifica se o usuário já está logado como ADMIN na sessão principal
  const regularSession = await getSession();
  if (regularSession && regularSession.role === "ADMIN") {
    return {
      authenticated: true,
      user: {
        id: regularSession.userId,
        email: regularSession.email,
        name: regularSession.name,
      },
    };
  }

  return { authenticated: false };
}

export async function requireMasterAuth(): Promise<void> {
  const { authenticated } = await isMasterAuthenticated();
  if (!authenticated) {
    throw new Error("Acesso negado. Faça login como Administrador para acessar este painel.");
  }
}
