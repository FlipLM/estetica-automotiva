import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Barreira central de autenticação e segurança HTTP (deny-by-default).
 * - Força HTTPS em produção (item 19).
 * - Aplica cabeçalhos de segurança CSP, HSTS, XFO, nosniff, COOP (item 18).
 * - Bloqueia CSRF por validação de Origin em mutações (item 9).
 * - Toda rota é protegida, exceto as listadas em PUBLIC_* (item 6).
 */
const AUTH_COOKIE_NAME = "detailing_saas_token";

const PUBLIC_PAGES = ["/login", "/register", "/gestor-master", "/vulpto_logo.png", "/brand", "/favicon.ico", "/apple-touch-icon.png"];
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/google",
  "/api/master-saas", // protegido internamente por requireMasterAuth / login master
];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' blob: data: https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com"
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Força HTTPS em produção quando atrás de proxy reverso (item 19)
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (
    process.env.NODE_ENV === "production" &&
    forwardedProto === "http" &&
    !req.nextUrl.hostname.includes("localhost") &&
    req.nextUrl.hostname !== "127.0.0.1"
  ) {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  const isApi = pathname.startsWith("/api/");

  // Proteção CSRF: mutações com Origin diferente do host são bloqueadas.
  if (isApi && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {}
      if (!host || originHost !== host) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Origem não permitida." }, { status: 403 })
        );
      }
    }
  }

  const isPublic = isApi ? matches(pathname, PUBLIC_API_PREFIXES) : matches(pathname, PUBLIC_PAGES);
  if (isPublic) return withSecurityHeaders(NextResponse.next());

  if (!(await hasValidSession(req))) {
    if (isApi) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Não autorizado. Faça login para continuar." }, { status: 401 })
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete(AUTH_COOKIE_NAME);
    return withSecurityHeaders(res);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Exclui apenas assets estáticos do Next e modelos 3D. Uploads (fotos de vistoria) exigem login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|vulpto_logo.png|brand/|models/).*)"],
};
