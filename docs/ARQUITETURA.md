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

## 3. Imutabilidade Financeira de Ordens de Serviço e Regime de Caixa

Para evitar que edições posteriores no catálogo de serviços ou nas taxas de comissão alterem retrospectivamente o histórico financeiro da empresa:
1. Ao adicionar itens a um orçamento ou ordem de serviço, os preços unitários da categoria do veículo e as alíquotas de comissão são copiados e persistidos no modelo `ServiceOrderItem` (com `User.commissionRate > 0` sobrescrevendo `Service.defaultCommission` via `src/lib/commission.ts`).
2. O total e os subtotais ficam protegidos contra reduções abaixo de valores já recebidos (`paidAmount`) e contra alterações de desconto após quitação (`PAID`).
3. O módulo financeiro opera em **Regime de Caixa** real a partir dos registros de `Payment` (`paidAt`, incluindo sinais parciais e deduções de taxa MDR de maquininha via `src/lib/payment-fees.ts`) e de `Expense` pagas (`paid: true`, por `paidAt`), com datas normalizadas em `src/lib/date-utils.ts` para eliminar desvios de fuso `UTC-3`.

---

## 4. CRM & Motor de Retenção (`CrmContactLog`)

Para transformar o histórico de clientes e veículos (`CustomerVehicle`) em ações comerciais rastreáveis sem spam:
- **Apuração de LTV e Visitas:** O endpoint `/api/crm` unifica `Vehicle` e `CustomerVehicle` (deduplicados), contabiliza LTV e frequência exclusivamente sobre ordens `PAID` com data normalizada (`completedAt ?? paidAt ?? createdAt`) e corrige a Curva ABC (`totalSpent <= 0` em `C`, 1º pagante em `A`).
- **Ciclo de Manutenção (`Service.maintenanceIntervalDays`):** A aba `COATING_WARRANTY` rastreia a última OS paga com serviço de proteção ou intervalo configurado sem ser reiniciada por lavagens simples.
- **Anti-Spam e ROI (`CrmContactLog`):** O registro de disparos, adiamentos (`snoozeUntil`) e marcações de "sem interesse" em `/api/crm/contacts` evita repetição excessiva e calcula o **Retorno Gerado (30d)** sobre OS pagas em até 14 dias após contato `SENT`.
- **Pós-Venda Configurável:** O link de avaliação do Google utiliza `Tenant.googleReviewUrl` editável em `/configuracoes`, e números de WhatsApp passam por `src/lib/phone.ts` (sem duplicar DDI `55`).

---

## 5. Engenharia de Estoque, Custo Médio Móvel & Ficha Técnica (`ServiceProductRecipe`)

Para garantir acurácia contábil entre `/estoque`, `/financeiro`, `/servicos` e `/os/[id]`:
- **Concorrência Atômica:** Baixas (`OUT`, `LOSS`, `OS_CONSUMPTION`, ajuste negativo `ADJUSTMENT` e `/api/orders/[id]/consume-stock`) usam `updateMany` condicional com `currentStock: { gte: qty }` dentro de `prisma.$transaction`; recuperações de perda (`RECOVER_LOSS`) usam trava atômica `recovered: false`.
- **Custo Médio Ponderado Móvel (`src/lib/inventory.ts`):** Atualizado automaticamente em `Product.costPrice` a cada entrada (`IN`), refletido diretamente como `averageUnitCost` e bloqueado para alteração/exclusão desvinculada no Financeiro (`/api/expenses/[id]`).
- **Soft-Delete & Unidades Seguras:** Produtos com movimentações ou receitas são arquivados (`active: false`) preservando despesas financeiras históricas; conversões `ML <-> L` e `G <-> KG` recalculam saldo, histórico e fichas em transação.
- **Pot-Life, Diluição & Ficha Técnica (BOM):** Controle de validade de lote (`expirationDate`) e após aberto (`openedAt`, `daysValidAfterOpen`), calculadora de diluição no pátio e vínculo `ServiceProductRecipe` por serviço em `/servicos` com confirmação de baixa real por OS em `/os/[id]`.

---

## 6. Infraestrutura de Produção (Coolify / Docker Standalone)

- **Banco de Dados Oficial:** PostgreSQL nativo provisionado via Coolify.
- **Estratégia de Migrações:** Versionamento estrito com `prisma/migrations/` e aplicação via `npx prisma migrate deploy` no `entrypoint.sh` (substituindo o antigo `db push --accept-data-loss`).
- **Imagem Docker Otimizada:** Next.js configurado com `output: "standalone"`, executando sob usuário de sistema não-root `nextjs:nodejs` (porta 3000). Redução de imagem de ~1.2GB para ~150MB.
- **Orquestração & Healthcheck:** Endpoint `/api/health` integrado ao Coolify com teste de integridade da conexão SQL e medição de latência.
- **Sessões e Rate Limiting:** JWT assinado com algoritmo fixado (HS256) em cookies HttpOnly + Rate Limiting com fallback transparente em memória ou distribuído via Redis (`REDIS_URL`).
- **Comunicação Transacional:** Serviço de e-mail padronizado (`src/lib/email.ts`) com suporte a SMTP para recuperação de senhas (`/esqueci-senha` e `/redefinir-senha`), operando em modo console com link de pré-visualização para testes e demonstrações.
