import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const MASTER_COOKIE_NAME = "saas_master_session";

const MASTER_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "master-saas-super-secret-key-2026-secure"
);

// Chave Mestre Secreta (Configurada via ENV ou fallback seguro)
export function getMasterSecretKey(): string {
  return process.env.SAAS_MASTER_KEY || "detailpro-master-secret-2026";
}

export function isValidMasterKey(providedKey: string): boolean {
  if (!providedKey) return false;
  const currentKey = getMasterSecretKey().trim();
  return providedKey.trim() === currentKey;
}

export async function signMasterToken(): Promise<string> {
  return new SignJWT({ role: "SUPER_ADMIN", isMaster: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(MASTER_JWT_SECRET);
}

export async function verifyMasterToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, MASTER_JWT_SECRET);
    return payload.isMaster === true;
  } catch {
    return false;
  }
}

export async function isMasterAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(MASTER_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyMasterToken(token);
}

export async function requireMasterAuth(): Promise<void> {
  const isAuth = await isMasterAuthenticated();
  if (!isAuth) {
    throw new Error("Acesso não autorizado ao Console Master.");
  }
}
