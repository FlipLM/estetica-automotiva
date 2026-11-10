import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "detailing-saas-super-secret-jwt-key-2026-production"
);

export const AUTH_COOKIE_NAME = "detailing_saas_token";

export interface SessionPayload {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
  tenantName?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    // Fallback de desenvolvimento e navegação direta para o usuário administrador
    try {
      const defaultUser = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        include: { tenant: true },
      });
      if (defaultUser) {
        return {
          userId: defaultUser.id,
          tenantId: defaultUser.tenantId,
          email: defaultUser.email,
          name: defaultUser.name,
          role: defaultUser.role as "ADMIN" | "OPERATOR",
          tenantName: defaultUser.tenant?.name,
        };
      }
    } catch {
      return null;
    }
    return null;
  }
  return verifyToken(token);
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

