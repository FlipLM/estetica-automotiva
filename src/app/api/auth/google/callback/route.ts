import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { GOOGLE_STATE_COOKIE, getAppOrigin } from "@/lib/google-oauth";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function fail(req: NextRequest, code: string) {
  const res = NextResponse.redirect(new URL(`/login?error=${code}`, getAppOrigin(req)));
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  try {
    if (isRateLimited(`google:${getClientIp(req)}`, 20, 15 * 60 * 1000)) return fail(req, "google_rate_limited");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const jwtSecret = process.env.JWT_SECRET;
    if (!clientId || !clientSecret || !jwtSecret) return fail(req, "google_not_configured");

    const url = req.nextUrl;
    if (url.searchParams.get("error")) return fail(req, "google_denied");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const flowCookie = req.cookies.get(GOOGLE_STATE_COOKIE)?.value;
    if (!code || !state || !flowCookie) return fail(req, "google_invalid_request");

    // 1) Valida o cookie de fluxo e o parâmetro state (anti-CSRF)
    let flow: { state: string; nonce: string; verifier: string; next?: string };
    try {
      const { payload } = await jwtVerify(flowCookie, new TextEncoder().encode(jwtSecret), { algorithms: ["HS256"] });
      flow = payload as any;
    } catch {
      return fail(req, "google_expired");
    }
    if (flow.state !== state) return fail(req, "google_invalid_state");

    // 2) Troca o code por tokens (PKCE)
    const redirectUri = `${getAppOrigin(req)}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: flow.verifier,
      }),
    });
    if (!tokenRes.ok) return fail(req, "google_token_error");
    const tokenData = await tokenRes.json();
    if (!tokenData.id_token) return fail(req, "google_token_error");

    // 3) Verifica assinatura, issuer, audience, expiração e nonce do id_token
    const { payload: idt } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
      algorithms: ["RS256"],
    });
    if (idt.nonce !== flow.nonce) return fail(req, "google_invalid_nonce");
    if (idt.email_verified !== true || !idt.email || !idt.sub) return fail(req, "google_email_unverified");

    const googleId = String(idt.sub);
    const email = String(idt.email).trim().toLowerCase();
    const displayName = String(idt.name || email.split("@")[0]);

    // 4) Resolve o usuário: por googleId → por e-mail verificado (vincula) → novo cadastro
    let user = await prisma.user.findUnique({ where: { googleId }, include: { tenant: true } });

    if (!user) {
      const byEmail = await prisma.user.findFirst({
        where: { OR: [{ email }, { email: String(idt.email) }], active: true },
        include: { tenant: true },
      });
      if (byEmail) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { googleId },
          include: { tenant: true },
        });
        await prisma.auditLog.create({
          data: {
            tenantId: byEmail.tenantId,
            userId: byEmail.id,
            action: "GOOGLE_LINK",
            entity: "User",
            entityId: byEmail.id,
            details: JSON.stringify({ email }),
          },
        });
      }
    }

    if (!user) {
      // Novo usuário: cria tenant TRIAL com onboarding obrigatório
      const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      // Senha aleatória inutilizável (login por senha fica indisponível até definição futura)
      const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
      user = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: `Estética de ${displayName}`,
            tradingName: `Estética de ${displayName}`,
            active: true,
            plan: "TRIAL",
            trialExpiresAt,
            isCustomPlan: false,
            onboardingCompleted: false,
          },
        });
        return tx.user.create({
          data: {
            tenantId: tenant.id,
            name: displayName,
            email,
            passwordHash,
            googleId,
            role: "ADMIN",
            active: true,
          },
          include: { tenant: true },
        });
      });
    }

    if (!user.active || !user.tenant.active) return fail(req, "google_inactive");

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role, provider: "google" }),
      },
    });

    const token = await signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "OPERATOR",
      tenantName: user.tenant.tradingName || user.tenant.name,
      plan: user.tenant.plan,
      trialExpiresAt: user.tenant.trialExpiresAt?.toISOString() || null,
    });

    let dest = user.role === "OPERATOR" ? "/patio" : "/dashboard";
    if (!user.tenant.onboardingCompleted) dest = "/onboarding";
    else if (flow.next && flow.next.startsWith("/") && !flow.next.startsWith("//")) dest = flow.next;

    const res = NextResponse.redirect(new URL(dest, getAppOrigin(req)));
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: redirectUri.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/api/auth/google", maxAge: 0 });
    return res;
  } catch (error) {
    console.error("[GOOGLE_CALLBACK_ERROR]", error);
    return fail(req, "google_error");
  }
}

