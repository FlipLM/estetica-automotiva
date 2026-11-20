import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Barreira central de autenticação e segurança HTTP (deny-by-default).
 * - Libera a Landing Page pública em "/" mantendo todo o painel e APIs protegidos.
 * - Força HTTPS em produção (item 19).
 * - Aplica cabeçalhos de segurança CSP, HSTS, XFO, nosniff, COOP (item 18).
 * - Bloqueia CSRF por validação de Origin em mutações (item 9).
 * - Toda rota é protegida, exceto "/" e as listadas em PUBLIC_* (item 6).
 */
const AUTH_COOKIE_NAME = "detailing_saas_token";

const PUBLIC_PAGES = [
  "/login",
  "/register",
  "/esqueci-senha",
  "/redefinir-senha",
  "/gestor-master",
  "/vulpto_logo.png",
  "/vulpto_full_logo.png",
  "/vulpto_rounded_logo.png",
  "/vulpto_logo_vector.svg",
  "/brand",
  "/models",
  "/favicon.ico",
  "/apple-touch-icon.png",
];
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/google",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
  "/api/master-saas", // protegido internamente por requireMasterAuth / login master
];

const CHANGE_PASSWORD_ALLOWED_APIS = [
  "/api/auth/change-password",
  "/api/auth/logout",
  "/api/auth/me",
];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

async function getVerifiedSessionPayload(
  req: NextRequest
): Promise<{ mustChangePassword?: boolean } | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );
    return payload as { mustChangePassword?: boolean };
  } catch {
    return null;
  }
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' blob: data: https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com"
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
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

  const isPublic = isApi
    ? matches(pathname, PUBLIC_API_PREFIXES)
    : pathname === "/" || matches(pathname, PUBLIC_PAGES);
  if (isPublic) {
    if (pathname === "/login") {
      const payload = await getVerifiedSessionPayload(req);
      if (payload?.mustChangePassword === true) {
        const url = req.nextUrl.clone();
        url.pathname = "/trocar-senha";
        url.search = "";
        return withSecurityHeaders(NextResponse.redirect(url));
      }
    }
    return withSecurityHeaders(NextResponse.next());
  }

  const sessionPayload = await getVerifiedSessionPayload(req);
  if (!sessionPayload) {
    if (isApi) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Não autorizado. Faça login para continuar." },
          { status: 401 }
        )
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

  // Troca obrigatória de senha provisória: libera apenas /trocar-senha e APIs de troca/sessão
  if (sessionPayload.mustChangePassword === true) {
    if (isApi) {
      if (!matches(pathname, CHANGE_PASSWORD_ALLOWED_APIS)) {
        return withSecurityHeaders(
          NextResponse.json(
            {
              error:
                "Troca obrigatória de senha pendente. Defina sua senha pessoal antes de continuar.",
              redirect: "/trocar-senha",
            },
            { status: 403 }
          )
        );
      }
    } else if (pathname !== "/trocar-senha") {
      const url = req.nextUrl.clone();
      url.pathname = "/trocar-senha";
      url.search = "";
      return withSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Exclui assets estáticos do Next, logos da marca e modelos 3D. Uploads (fotos de vistoria) exigem login.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|vulpto_logo.png|vulpto_full_logo.png|vulpto_rounded_logo.png|vulpto_logo_vector.svg|brand/|models/).*)",
  ],
};
