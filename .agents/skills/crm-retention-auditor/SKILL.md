---
name: crm-retention-auditor
description: Skill de auditoria técnica, de retenção, RBAC e UX para o módulo de CRM (/crm, /api/crm, /api/crm/contacts, nascimento em /clientes, ciclo de manutenção em /servicos e link do Google em /configuracoes) do Vulpto. Use antes e depois de alterar qualquer regra de CRM, Curva ABC, lembretes de manutenção ou disparos de WhatsApp.
---

# CRM Retention Auditor — Vulpto (`saas-estetica-automotiva`)

Esta skill codifica o checklist obrigatório do módulo de CRM & Retenção do Vulpto, em par com `.agents/agents/crm-retention-specialist.md`.

---

## 1. Checklist de Dados, Datas e Segmentação

- [ ] **RBAC Estrito (`ADMIN`):** `GET /api/crm` e `POST /api/crm/contacts` usam `requireAdmin()` + `handleAuthError` (`OPERATOR` recebe `403`). `/crm` exibe alerta restrito sem vazar métricas.
- [ ] **Multi-Veículos Deduplicados:** `GET /api/crm` unifica `Customer.vehicles` + `Customer.customerVehicles[].vehicle` deduplicados por `vehicle.id` e seleciona o veículo exibido pela última OS relevante -> `isPrimary` -> primeiro veículo.
- [ ] **Consistência de `completedAt` e LTV:** Ordens criadas/concluídas/pagas em `POST /api/orders`, `PATCH /api/orders/[id]/status` e `POST /api/orders/[id]/payments` sempre preenchem `completedAt` quando `DONE` ou `PAID`. LTV e contagem de visitas no CRM consideram apenas `status === "PAID"` usando `completedAt ?? paidAt ?? createdAt`.
- [ ] **Curva ABC Correta:** `totalSpent <= 0` => `"C"`. Entre pagantes ordenados do maior para o menor, o critério avalia `accumulated / totalRevenue` antes de somar o cliente atual (1º pagante sempre `"A"`).
- [ ] **Garantia / Manutenção (`COATING_WARRANTY`):** Baseia-se na última OS paga contendo item com `maintenanceIntervalDays`, categoria `PROTECAO` ou palavra-chave de proteção (sem ser zerada por lavagens comuns). Total do card == total da lista na aba.
- [ ] **Dia de Chuva (`RAINY_DAY`):** Exige WhatsApp válido (`extractValidWhatsAppDigits`) e ausência de visita paga nos últimos 15 dias (`daysSinceLastVisit === null || daysSinceLastVisit > 15`).

---

## 2. Checklist de WhatsApp, Anti-Spam e ROI

- [ ] **Normalização de Telefone (`src/lib/phone.ts`):** Nunca duplica prefixo `55`; botão de envio desabilitado quando `!hasValidWhatsApp`.
- [ ] **Pós-Venda Sem Link Hardcoded:** Utiliza `Tenant.googleReviewUrl` configurado em `/configuracoes` (`PUT /api/settings`); quando nulo, omite o bloco do Google na mensagem.
- [ ] **Anti-Spam e Log (`CrmContactLog`):** `POST /api/crm/contacts` valida que `customerId`, `vehicleId` e `serviceOrderId` pertencem ao `session.tenantId`, grava `CrmContactLog` (`SENT` / `POSTPONED` +15d / `NO_INTEREST`) e `AuditLog`.
- [ ] **ROI (30d):** Soma OS com `status === "PAID"` nos últimos 30 dias abertas/pagas em até 14 dias após um contato `SENT` (deduplicado por `serviceOrderId`).
- [ ] **Aniversariantes e Serviços:** `/clientes` exibe e persiste `birthDate` usando `parseDateInput`/`formatDateInputValue`; `/servicos` permite configurar `maintenanceIntervalDays`.

---

## 3. Checklist de UX (`/crm`)

- [ ] Aba padrão é **Para Chamar Hoje (`TODAY`)** ordenando orçamentos parados, manutenções no prazo, pós-venda (1–3d), aniversariantes próximos e sumidos prioritários.
- [ ] Busca textual (`q`), toggle anti-spam (`hideContacted`) e paginação (`Pagination`) funcionam sem travar telas grandes.
- [ ] Linguagem 100% acessível sem jargões técnicos (*"Já gastou aqui"*, *"Cliente Ouro (VIP)"*, *"Por que chamar?"*).
