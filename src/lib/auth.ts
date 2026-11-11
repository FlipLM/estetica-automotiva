import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET ausente ou curto demais (mínimo 32 caracteres). Configure no ambiente.");
  }
  return new TextEncoder().encode(secret);
}
export const AUTH_COOKIE_NAME = "detailing_saas_token";

export interface SessionPayload {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
  tenantName?: string;
  tenantLogo?: string | null;
  plan?: string;
  trialExpiresAt?: string | null;
  isTrialExpired?: boolean;
  onboardingCompleted?: boolean;
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
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  // Sem token válido não existe sessão: NUNCA há fallback para usuário padrão.
  if (!token) return null;

  const session = await verifyToken(token);
  if (!session || !session.userId || !session.tenantId) return null;

  try {
    // Revalida usuário e tenant no banco a cada requisição (desativação/mudança de perfil têm efeito imediato).
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        role: true,
        active: true,
        tenant: {
          select: {
            name: true,
            tradingName: true,
            logoUrl: true,
            plan: true,
            trialExpiresAt: true,
            active: true,
            onboardingCompleted: true,
          },
        },
      },
    });

    if (!user || !user.active || !user.tenant.active || user.tenantId !== session.tenantId) {
      return null;
    }

    const tenant = user.tenant;
    const isTrialExpired =
      tenant.plan === "TRIAL" &&
      !!tenant.trialExpiresAt &&
      new Date() > new Date(tenant.trialExpiresAt);

    return {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "OPERATOR",
      tenantName: tenant.tradingName || tenant.name,
      tenantLogo: tenant.logoUrl || null,
      plan: tenant.plan,
      trialExpiresAt: tenant.trialExpiresAt?.toISOString() || null,
      isTrialExpired,
      onboardingCompleted: tenant.onboardingCompleted,
    };
  } catch {
    // Falha de banco: nega acesso (fail-closed) em vez de confiar apenas no JWT.
    return null;
  }
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

