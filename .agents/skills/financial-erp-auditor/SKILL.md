---
name: financial-erp-auditor
description: Skill de auditoria financeira, contábil e de UX para o módulo financeiro, comissões e ordens de serviço do Vulpto (SaaS de Estética Automotiva). Use antes e depois de alterar endpoints financeiros, regras de comissão, baixa/estorno de OS, despesas ou telas de /financeiro e /comissoes.
---

# Financial ERP Auditor — Vulpto (`saas-estetica-automotiva`)

Esta skill codifica o checklist obrigatório de auditoria contábil, transacional, de RBAC e de UX do módulo financeiro do Vulpto, em par com o perfil `.agents/agents/financial-erp-specialist.md`.

---

## 1. Checklist de Auditoria Contábil e de Caixa

- [ ] **Regime de Caixa Real por `Payment` e `Expense.paidAt`:** Toda entrada de caixa no período soma `Payment` (`paidAt` no intervalo, OS com `status !== "CANCELLED"`), computando `grossReceived`, `cardFees` e `netReceived = grossReceived - cardFees`. Toda saída efetiva soma `Expense.paid = true` por `paidAt` (fallback `paidAt: null` -> `dueDate`).
- [ ] **A Receber por Saldo Real:** Totais a receber somam `totalAmount - paidAmount` (descontando sinais parciais já pagos).
- [ ] **Zero Bug de Fuso `UTC-3`:** Todo parsing de `"YYYY-MM-DD"`, ranges e cálculo de meses em parcelas (`addMonthsPreservingDay`) utiliza `src/lib/date-utils.ts`. Nunca usar `new Date("YYYY-MM-DD")` nem `.toISOString().split("T")[0]` para datas de formulário.
- [ ] **Pagamentos Parciais, Taxas MDR e Quitação:** `POST /api/orders/[id]/payments` valida `amount <= remaining + 0.01`, calcula taxa via `src/lib/payment-fees.ts`, só muda a OS para `PAID` quando `newPaidAmount >= totalAmount - 0.01` e `PATCH /api/orders/[id]/status` cobra apenas o saldo restante (`totalAmount - paidAmount`).
- [ ] **Idempotência e Estorno Atômico:** `PATCH /api/orders/[id]/status` é idempotente em `PAID -> PAID`. Estornos (em `status/route.ts` e `DELETE /api/orders/[id]/payments/[paymentId]`) exigem `ADMIN`, bloqueiam com `400` se existir `Commission` `PAID`, limpam `Payment`/`Commission` `PENDING` em `$transaction`, ajustam `paidAmount` / `Customer.totalSpent` com piso `0` e gravam `AuditLog`.
- [ ] **Proteção contra Redução Abaixo do Pago:** `PUT /api/orders/[id]` e `DELETE /api/orders/[id]/items` bloqueiam com `400` alterações que deixem `totalAmount < paidAmount`.
- [ ] **Parcelamento e Recorrência de Despesas:** `POST /api/expenses` divide centavos na última parcela quando `amountMode === "TOTAL"` e mantém parcelas `2..N` com `paid: false`. `DELETE /api/expenses/[id]?scope=future` preserva parcelas anteriores já pagas.
- [ ] **Caixa do Dia (`GET /api/financial/daily-cash`):** Separa corretamente dinheiro em espécie (`Dinheiro na Gaveta`) vs meios digitais/bancários e desconta taxas de maquininha no líquido.
- [ ] **Auditoria Completa:** Mutações financeiras (`expenses`, `commissions`, `orders/[id]/status`, `orders/[id]/payments`) gravam `AuditLog`.

---

## 2. Regra Fechada de Comissões

- Função canônica: `resolveItemCommissionRate` em `src/lib/commission.ts`, consumida por `POST /api/orders` e `POST /api/orders/[id]/items`:
  1. `explicitRate` (se informado no item)
  2. `assignedUser.commissionRate` (se `> 0`)
  3. `service.defaultCommission ?? 10`
- Comissões são calculadas sobre o **valor vendido dos serviços** (sem descontar taxa da maquininha) e nunca sofrem alteração retroativa em `ServiceOrderItem` já gravados.

---

## 3. Checklist de RBAC e Escalabilidade

- [ ] `OPERATOR` recebe `403 Forbidden` em `/api/financial/*`, `/api/expenses/*`, `/api/orders/[id]/payments*` e `PUT /api/settings`.
- [ ] `GET /api/commissions` retorna `serviceOrder.totalAmount: null` para `OPERATOR` e força `where.userId = session.userId`.
- [ ] `summary` de `/api/commissions` e totais de `/api/expenses` não zeram ao aplicar filtro de status (`PENDING`/`PAID`/`OVERDUE`).
- [ ] Endpoints de listagem (`/api/commissions`, `/api/expenses`) suportam paginação (`page`, `limit`) e consultas de dashboard/DRE utilizam `aggregate`/`groupBy` ao invés de `findMany` irrestritos.

---

## 4. Padrão de UX em Camadas (`/financeiro`)

- **Aba 1 (`Resumo Simples` — padrão):** Linguagem humana (*Entrou no Caixa (Líquido)*, *Saiu do Caixa*, *Sobrou no Bolso*, *A Receber vs. A Pagar*), bloco *Atenção Hoje* com botões de 1 toque e gráficos de barras limpos.
- **Aba 2 (`Contas a Pagar`):** Pílulas (`Todas`, `Atrasadas`, `A Vencer`, `Pagas`), busca, categoria, fornecedor, badges `Parcela X/Y` e `Recorrente`, baixa com `paidAt`, reabertura e exclusão granular (`Só esta` vs `Esta e as próximas em aberto`).
- **Aba 3 (`Entradas e A Receber`):** OS `DONE` com saldo restante + histórico real de `Payment` com taxas, parcelas e líquido.
- **Aba 4 (`Caixa do Dia`):** Conferência diária por método (*Dinheiro na Gaveta*, *Total Digital/Banco*, *Saldo Líquido do Dia*), CSV e impressão.
- **Aba 5 (`DRE Detalhado`):** Visão contábil sob demanda com *Receita Recebida*, `(-) Taxas de Maquininha`, *Receita Líquida em Caixa*, exportação CSV e *Resultado Líquido* idêntico ao *Sobrou no Bolso*.
