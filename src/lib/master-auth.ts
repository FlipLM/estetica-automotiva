import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

export const MASTER_COOKIE_NAME = "saas_master_session";

function getMasterSecret(): Uint8Array {
  const base = process.env.MASTER_JWT_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}:master` : "");
  if (!base || base.length < 32) {
    throw new Error("MASTER_JWT_SECRET/JWT_SECRET ausente ou curto demais (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(base);
}

/**
 * Credenciais do gestor master vêm exclusivamente do ambiente (sem valores padrão).
 * Se não configuradas, o login master fica desabilitado.
 */
export function getMasterCredentials(): { email: string; password: string } | null {
  const email = (process.env.MASTER_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.MASTER_ADMIN_PASSWORD || "";
  if (!email || !password) return null;
  return { email, password };
}

/** Comparação em tempo constante (evita timing attack). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
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
    .sign(getMasterSecret());
}

export async function verifyMasterToken(token: string): Promise<MasterSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getMasterSecret(), { algorithms: ["HS256"] });
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
