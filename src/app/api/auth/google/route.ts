import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { randomBytes, createHash } from "crypto";
import { GOOGLE_STATE_COOKIE, getAppOrigin } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.JWT_SECRET;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !secret) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", getAppOrigin(req)));
  }

  const state = b64url(randomBytes(24));
  const nonce = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const next = req.nextUrl.searchParams.get("next") || "";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";

  // Cookie assinado e de curta duração com os parâmetros do fluxo (state/nonce/PKCE)
  const flowToken = await new SignJWT({ state, nonce, verifier, next: safeNext })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(secret));

  const redirectUri = `${getAppOrigin(req)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  res.cookies.set(GOOGLE_STATE_COOKIE, flowToken, {
    httpOnly: true,
    secure: redirectUri.startsWith("https://"),
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
