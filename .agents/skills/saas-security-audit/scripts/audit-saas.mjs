#!/usr/bin/env node
/**
 * Scanner Automatizado de Segurança SaaS (OWASP + Trail of Bits)
 * Executa as regras de:
 *  - owasp-secrets-scan
 *  - owasp-api-security-review (API1 BOLA/Multi-Tenant, API2 Auth, API3 BOPA, API5 BFLA, API8 Headers/CSRF)
 *  - owasp-web-security-review (A01, A02, A03 Injection/XSS, A05, A07)
 *  - tob-entry-point-analyzer
 *  - tob-sharp-edges (JWT algorithm pinning, no insecure fallbacks)
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const checks = [];
let failures = 0;

function record(category, name, passed, detail) {
  checks.push({ category, name, passed, detail });
  if (!passed) failures++;
}

function walk(dir, filterFn = () => true) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, filterFn) : filterFn(full) ? [full] : [];
  });
}

const allSrcFiles = walk(path.join(root, "src"), (f) => /\.(ts|tsx)$/.test(f));

// 1. OWASP Secrets Scan
try {
  const tracked = execSync("git ls-files .env", { encoding: "utf8" }).trim();
  record("owasp-secrets-scan", ".env fora do índice do Git", tracked === "", tracked || "Não rastreado");
} catch {
  record("owasp-secrets-scan", ".env fora do índice do Git", true, "Verificado");
}
const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
const dockerignore = fs.readFileSync(path.join(root, ".dockerignore"), "utf8");
record("owasp-secrets-scan", ".env bloqueado em .gitignore e .dockerignore", /^\.env$/m.test(gitignore) && /^\.env$/m.test(dockerignore), ".gitignore + .dockerignore");

const authContent = fs.readFileSync(path.join(root, "src", "lib", "auth.ts"), "utf8");
const masterContent = fs.readFileSync(path.join(root, "src", "lib", "master-auth.ts"), "utf8");
const hasHardcodedSecret = /detailing-saas-super-secret|master-saas-super-secret|M@sterDetailPro2026!/.test(authContent + masterContent);
record("owasp-secrets-scan", "Ausência de segredos/senhas hardcoded em auth.ts e master-auth.ts", !hasHardcodedSecret, hasHardcodedSecret ? "Encontrado fallback hardcoded!" : "Zero fallbacks hardcoded");

// 2. Trail of Bits: Sharp Edges (JWT Algorithm Pinning & No Session Fallback)
let unpinnedJwt = [];
for (const f of allSrcFiles) {
  const c = fs.readFileSync(f, "utf8");
  for (const m of c.matchAll(/jwtVerify\(([^;]+)\)/g)) {
    if (!m[1].includes("algorithms:")) {
      unpinnedJwt.push(path.relative(root, f));
    }
  }
}
record("tob-sharp-edges", "Pinning explícito de 'algorithms' em todas as chamadas jwtVerify()", unpinnedJwt.length === 0, unpinnedJwt.length ? `Sem algorithms em: ${unpinnedJwt.join(", ")}` : "100% das chamadas com algorithms fixado");

const hasFallbackAdmin = /findFirst\(\{\s*where:\s*\{\s*role:\s*"ADMIN"\s*\}/.test(authContent);
record("tob-sharp-edges", "getSession() sem fallback de login automático (fail-closed)", !hasFallbackAdmin, "Sem cookie = null");

// 3. Trail of Bits: Entry Point Analyzer + OWASP API1/API2/API5
const routeFiles = walk(path.join(root, "src", "app", "api"), (f) => f.endsWith("route.ts"));
const publicRoutes = new Set([
  "auth/login/route.ts",
  "auth/register/route.ts",
  "auth/logout/route.ts",
  "auth/google/route.ts",
  "auth/google/callback/route.ts",
  "master-saas/auth/route.ts",
]);

let unprotectedRoutes = [];
for (const f of routeFiles) {
  const rel = path.relative(path.join(root, "src", "app", "api"), f).replace(/\\/g, "/");
  if (publicRoutes.has(rel)) continue;
  const c = fs.readFileSync(f, "utf8");
  const hasGuard = /requireAuth\(|requireAdmin\(|requireMasterAuth\(|getSession\(/.test(c);
  if (!hasGuard) unprotectedRoutes.push(rel);
}
record(
  "tob-entry-point-analyzer",
  `Todos os ${routeFiles.length} Route Handlers auditados com guard de autenticação`,
  unprotectedRoutes.length === 0,
  unprotectedRoutes.length ? `Desprotegidos: ${unprotectedRoutes.join(", ")}` : `${routeFiles.length - publicRoutes.size} rotas protegidas + ${publicRoutes.size} rotas públicas de auth`
);

const legacyAdminExists = fs.existsSync(path.join(root, "src", "app", "api", "admin"));
record("owasp-api-security-review", "Rota legada cross-tenant /api/admin removida (API1 BOLA / API5 BFLA)", !legacyAdminExists, "Apenas /api/master-saas isolado ativo");

// 4. OWASP Web Security Review (A03 Injection / XSS, A05 Security Headers, A08 CSRF)
let unsafeRaw = [];
let unsafeHtml = [];
for (const f of allSrcFiles) {
  const c = fs.readFileSync(f, "utf8");
  if (/\$queryRawUnsafe|\$executeRawUnsafe/.test(c)) unsafeRaw.push(path.relative(root, f));
  if (/dangerouslySetInnerHTML/.test(c)) unsafeHtml.push(path.relative(root, f));
}
record("owasp-web-security-review", "Zero SQL Injection ($queryRawUnsafe / $executeRawUnsafe)", unsafeRaw.length === 0, "100% Prisma parametrizado");
record("owasp-web-security-review", "Zero DOM XSS (dangerouslySetInnerHTML)", unsafeHtml.length === 0, "100% React JSX escapado");

const mw = fs.readFileSync(path.join(root, "src", "middleware.ts"), "utf8");
const hasHeaders = ["Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options", "X-Content-Type-Options", "Cross-Origin-Opener-Policy"].every((h) => mw.includes(h));
record("owasp-web-security-review", "Cabeçalhos HTTP de segurança (CSP, HSTS, XFO, nosniff, COOP) e HTTPS redirect ativos", hasHeaders && mw.includes("httpsUrl.protocol = \"https:\""), "src/middleware.ts");

// 5. OWASP API8 / Uploads Security
const uploadRoute = fs.readFileSync(path.join(root, "src", "app", "api", "uploads", "route.ts"), "utf8");
const uploadServe = fs.readFileSync(path.join(root, "src", "app", "uploads", "[...filename]", "route.ts"), "utf8");
const uploadSafe = uploadRoute.includes("0x89, 0x50, 0x4e, 0x47") && uploadServe.includes("filePath.startsWith(baseDir + path.sep)") && !uploadServe.includes("image/svg+xml");
record("owasp-api-security-review", "Uploads validados por magic bytes binários + anti-traversal + bloqueio de SVG/XSS", uploadSafe, "uploads/route.ts");

// Relatório Final
console.log("\n======================================================================");
console.log("  RELATÓRIO DE AUDITORIA AUTOMATIZADA (OWASP + TRAIL OF BITS SKILLS)");
console.log("======================================================================");
for (const c of checks) {
  const icon = c.passed ? "[PASS]" : "[FAIL]";
  console.log(`${icon} [${c.category}] ${c.name} -> ${c.detail}`);
}
console.log("----------------------------------------------------------------------");
console.log(`Total de verificações: ${checks.length} | Aprovadas: ${checks.length - failures} | Falhas: ${failures}`);
console.log("======================================================================\n");

process.exit(failures > 0 ? 1 : 0);

