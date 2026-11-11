---
name: saas-security-audit
description: Pacote e motor automatizado de auditoria de segurança para SaaS Multi-Tenant (Next.js + Prisma), integrando OWASP API Security Top 10, OWASP Web Top 10, OWASP Secrets Scan e Trail of Bits Sharp Edges / Entry Point Analyzer. Execute sempre antes de deploys, commits ou alterações de autenticação e rotas.
---

# SaaS Security Audit Skill (OWASP + Trail of Bits)

Esta skill integra os playbooks instalados em `.agents/skills/` (`owasp-api-security-review`, `owasp-web-security-review`, `owasp-secrets-scan`, `owasp-sca-audit`, `owasp-iac-security-review`, `tob-entry-point-analyzer`, `tob-sharp-edges`, `tob-differential-review`, `tob-supply-chain-risk-auditor`) e fornece um scanner automatizado para o repositório.

## Como Executar

```bash
npm run security:audit
# ou diretamente:
node .agents/skills/saas-security-audit/scripts/audit-saas.mjs
```

## Verificações Automatizadas Executadas pelo Scanner

1. **[OWASP Secrets Scan]** Verifica se `.env` está desindexado do Git, se está no `.gitignore` e `.dockerignore`, e se não há segredos hardcoded ou `NEXT_PUBLIC_` indevidos no código.
2. **[Trail of Bits — Sharp Edges]** Verifica se todas as chamadas `jwtVerify` fixam explicitamente a whitelist `algorithms` (`HS256` / `RS256`) e se não há fallbacks inseguros em `getSession()` ou `getMasterCredentials()`.
3. **[Trail of Bits — Entry Point Analyzer & OWASP API1/API5]** Inventaria 100% dos Route Handlers (`src/app/api/**/route.ts`) e verifica se todos os endpoints não-públicos possuem guard de autenticação (`requireAuth`, `requireAdmin`, `requireMasterAuth` ou `getSession`) e isolamento por `tenantId`.
4. **[OWASP Web A03 / A05 / A08]** Verifica ausência de `$queryRawUnsafe`, `$executeRawUnsafe`, `dangerouslySetInnerHTML`, presença de cabeçalhos CSP/HSTS/XFO e proteção CSRF por `Origin` no `src/middleware.ts`.
5. **[OWASP API8 / Uploads]** Verifica validação de magic bytes em uploads e bloqueio de path traversal.

