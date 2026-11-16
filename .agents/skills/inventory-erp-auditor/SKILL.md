---
name: inventory-erp-auditor
description: Skill de auditoria técnica, contábil, concorrencial, RBAC e UX para o módulo de Estoque (/estoque, /api/products*, /api/products/movements, /api/orders/[id]/consume-stock, vínculo em /api/expenses/[id] e ficha técnica em /servicos e /os/[id]) do Vulpto. Use antes e depois de alterar qualquer regra de estoque, custo médio, validade ou baixa de insumos.
---

# Inventory ERP Auditor — Vulpto (`saas-estetica-automotiva`)

Esta skill codifica o checklist obrigatório do módulo de Estoque do Vulpto, em par com `.agents/agents/inventory-erp-specialist.md`.

---

## 1. Checklist de Integridade, Concorrência e Custos

- [ ] **Baixas Atômicas:** `OUT`, `LOSS`, `OS_CONSUMPTION`, ajuste negativo `ADJUSTMENT`, estorno de `IN` e `/api/orders/[id]/consume-stock` usam `updateMany` com `currentStock: { gte: qty }` dentro de `prisma.$transaction`.
- [ ] **Recuperação Idempotente:** `RECOVER_LOSS` usa `updateMany` com `recovered: false` dentro de `prisma.$transaction`, retornando `409` em concorrência.
- [ ] **Custo Médio Móvel (`src/lib/inventory.ts`):** `calculateMovingAverageCost` atualiza `Product.costPrice` na entrada; sem fallback `0.045`; `averageUnitCost` espelha `Product.costPrice`.
- [ ] **Soft-Delete & Vínculo Financeiro:** `DELETE /api/products/[id]` arquiva (`active: false`) quando existem movimentações/receitas e nunca deleta `Expense`. `PUT`/`DELETE /api/expenses/[id]` bloqueia exclusão e alteração de valor/categoria quando `expense.stockMovement` existe. `EDIT_MOVEMENT` nunca cria `Expense` duplicada se `expenseId === null`.
- [ ] **Conversão Segura de Unidades:** `PUT /api/products/[id]` aceita `ML <-> L` e `G <-> KG` reescalando saldo/histórico/receitas; bloqueia com `400` conversões entre grandezas incompatíveis quando há movimentações.
- [ ] **Datas sem Drift UTC-3:** Todo parse/formatação usa `parseDateInput` e `formatDateInputValue` (`src/lib/date-utils.ts`).

---

## 2. Checklist de RBAC, Rastreabilidade e Estética Automotiva

- [ ] **RBAC Estrito:** `IN`, `ADJUSTMENT`, `EDIT_MOVEMENT`, `POST`/`PUT`/`DELETE /api/products` exigem `requireAdmin()`.
- [ ] **Mascaramento para `OPERATOR`:** `GET /api/products`, `GET /api/products/[id]`, `GET /api/products/movements` e `GET /api/orders/[id]` zeram/ocultam custos, `supplier`, `purchasedAt`, `expenseId`, notas de compra `IN` e resumo financeiro quando `session.role !== "ADMIN"`.
- [ ] **`OS_CONSUMPTION` Rastreável:** Bloqueado manualmente sem `serviceOrderId` válido do mesmo `tenantId`; toda movimentação grava `userId` e `AuditLog`.
- [ ] **Ficha Técnica (BOM):** `ServiceProductRecipe` editável em `/servicos` (`/api/services*`) e checklist de baixa real em `/os/[id]` (`POST /api/orders/[id]/consume-stock`).
- [ ] **Pot-Life, Diluição & Compras:** Calculadora de diluição e lista de compras WhatsApp (`src/lib/phone.ts`) presentes em `/estoque`; zero `alert()`/`confirm()`.
