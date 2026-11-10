import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const MASTER_COOKIE_NAME = "saas_master_session";

const MASTER_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "master-saas-super-secret-key-2026-secure"
);

export function getMasterCredentials() {
  return {
    email: (process.env.MASTER_ADMIN_EMAIL || "admin@detailpro.com").trim().toLowerCase(),
    password: process.env.MASTER_ADMIN_PASSWORD || "M@sterDetailPro2026!",
  };
}

export interface MasterSessionPayload {
  email: string;
  name: string;
  isMaster: true;
}

export async function signMasterToken(email: string, name: string = "Administrador Geral"): Promise<string> {
  return new SignJWT({ email, name, isMaster: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h") // Sessão master dura 4 horas
    .sign(MASTER_JWT_SECRET);
}

export async function verifyMasterToken(token: string): Promise<MasterSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, MASTER_JWT_SECRET);
    if (payload.isMaster === true && payload.email) {
      return payload as unknown as MasterSessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Autenticação 100% PRÓPRIA e ISOLADA.
 * NÃO herda cookies de oficina, NÃO possui bypass nem fallback.
 * Exige obrigatoriamente o token assinado da sessão master.
 */
export async function isMasterAuthenticated(): Promise<{ authenticated: boolean; user?: any }> {
  const cookieStore = cookies();
  const masterToken = cookieStore.get(MASTER_COOKIE_NAME)?.value;

  if (!masterToken) {
    return { authenticated: false };
  }

  const payload = await verifyMasterToken(masterToken);
  if (!payload) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    user: {
      email: payload.email,
      name: payload.name || "Administrador Geral",
    },
  };
}

export async function requireMasterAuth(): Promise<MasterSessionPayload> {
  const cookieStore = cookies();
  const masterToken = cookieStore.get(MASTER_COOKIE_NAME)?.value;

  if (!masterToken) {
    throw new Error("Sessão master não encontrada. Efetue login para continuar.");
  }

  const payload = await verifyMasterToken(masterToken);
  if (!payload) {
    throw new Error("Sessão master expirada ou inválida. Faça login novamente.");
  }

  return payload;
}
