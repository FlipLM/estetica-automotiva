# Arquitetura Técnica do Sistema — Vulpto

Este documento é a referência de arquitetura do sistema, servindo como memória técnica permanente.

---

## 1. Visão Geral da Arquitetura

O sistema é construído como uma aplicação web multi-tenant em arquitetura monolítica modular, utilizando Next.js 14 com o modelo App Router, TypeScript, Prisma ORM e PostgreSQL (compatível com SQLite para desenvolvimento local rápido).

```text
                                +-----------------------------+
                                |      Navegador Web / PWA    |
                                +--------------+--------------+
                                               |
                                     (HTTPS / JSON REST)
                                               |
                                +--------------v--------------+
                                |    Next.js 14 (App Router)  |
                                |  - UI Components (React)    |
                                |  - API Route Handlers       |
                                |  - Auth / Session (JWT)     |
                                |  - RBAC Engine              |
                                +--------------+--------------+
                                               |
                                         (Prisma ORM)
                                               |
                                +--------------v--------------+
                                |      Banco de Dados SQL     |
                                | (Multi-tenant por TenantId) |
                                +-----------------------------+
```

---

## 2. Padrões de Isolamento Multi-tenant

- **Modelo de Dados:** Chave de tenant compartilhada (`Shared Database, Shared Schema`).
- **Segurança de Consultas:** Cada entidade de negócio (`Customer`, `Vehicle`, `Service`, `ServiceOrder`, `Expense`, `Product`, `AuditLog`) contém obrigatoriamente a coluna `tenantId`.
- **Enforcement:** As APIs obtêm o `tenantId` estritamente a partir do token JWT verificado da sessão atual do usuário autenticado (`getSession()`), nunca a partir de parâmetros fornecidos pelo cliente na requisição.

---

## 3. Imutabilidade Financeira de Ordens de Serviço

Para evitar que edições posteriores no catálogo de serviços ou nas taxas de comissão alterem retrospectivamente o histórico financeiro da empresa:
1. Ao adicionar itens a um orçamento ou ordem de serviço, os preços unitários da categoria do veículo e as alíquotas de comissão são copiados e persistidos no modelo `ServiceOrderItem`.
2. O total e os subtotais são congelados após o fechamento da OS.

---

## 4. Infraestrutura de Produção (Coolify / Docker Standalone)

- **Banco de Dados Oficial:** PostgreSQL nativo provisionado via Coolify.
- **Estratégia de Migrações:** Versionamento estrito com `prisma/migrations/` e aplicação via `npx prisma migrate deploy` no `entrypoint.sh` (substituindo o antigo `db push --accept-data-loss`).
- **Imagem Docker Otimizada:** Next.js configurado com `output: "standalone"`, executando sob usuário de sistema não-root `nextjs:nodejs` (porta 3000). Redução de imagem de ~1.2GB para ~150MB.
- **Orquestração & Healthcheck:** Endpoint `/api/health` integrado ao Coolify com teste de integridade da conexão SQL e medição de latência.
- **Sessões e Rate Limiting:** JWT assinado com algoritmo fixado (HS256) em cookies HttpOnly + Rate Limiting com fallback transparente em memória ou distribuído via Redis (`REDIS_URL`).
- **Comunicação Transacional:** Serviço de e-mail padronizado (`src/lib/email.ts`) com suporte a SMTP para recuperação de senhas (`/esqueci-senha` e `/redefinir-senha`), operando em modo console com link de pré-visualização para testes e demonstrações.
