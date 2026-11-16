# Registro de Alterações (Changelog)

Todas as alterações relevantes do projeto são registradas neste documento.

---

## [0.9.0] — 16/11/2026

### Auditoria e Reestruturação Completa do Módulo de Estoque & Ficha Técnica
- **Modelagem Prisma & Migration (`20261116160419_inventory_erp_upgrade`):**
  - `Product`: soft-delete (`active`), embalagem de compra (`packSize`, `packLabel`), `defaultDilution`, controle de Pot-Life e validade (`openedAt`, `daysValidAfterOpen`, `expirationDate`), além das unidades `M` e `M2`.
  - `StockMovement`: rastreabilidade por `userId` e `serviceOrderId`, novo tipo `ADJUSTMENT` e índices compostos por produto/tipo/data e OS.
  - Novo model `ServiceProductRecipe` para vincular insumos padrão por serviço (Ficha Técnica / BOM).
- **Integridade Transacional, Custo Médio Móvel e Vínculo Financeiro (`src/lib/inventory.ts`, `/api/products*`, `/api/expenses/[id]`):**
  - Baixas atômicas com `updateMany` (`currentStock: { gte: qty }`) e guarda atômica em `RECOVER_LOSS` dentro de `prisma.$transaction`.
  - Custo Médio Ponderado Móvel calculado nas entradas (`IN`) e refletido diretamente em `Product.costPrice` / `averageUnitCost` (removido fallback silencioso `0.045`).
  - `DELETE /api/products/[id]` realiza arquivamento (`active: false`) quando há histórico, preservando integralmente as despesas financeiras vinculadas; `PUT`/`DELETE /api/expenses/[id]` bloqueia exclusão e mudança de valor/categoria de despesas ligadas ao estoque; `EDIT_MOVEMENT` não recria despesa duplicada.
  - Conversão segura `ML <-> L` e `G <-> KG` em `PUT /api/products/[id]`, datas tratadas com `parseDateInput()`/`formatDateInputValue()`, `OS_CONSUMPTION` exigindo `serviceOrderId` válido, novo endpoint paginado `GET /api/products/movements`, RBAC estrito ocultando custos/fornecedor/`purchasedAt` de `OPERATOR` e `AuditLog` completo.
- **Experiência Dual (`OPERATOR` vs `ADMIN`), Ficha Técnica e Lista de Compras (`/estoque`, `/servicos`, `/os/[id]`):**
  - Monólito de `/estoque` modularizado em `src/components/modules/estoque/*` usando `@/components/ui` (zero `alert()`/`confirm()`).
  - `OPERATOR` acessa o **Balcão Rápido do Pátio** (1-toque *Pegar / Usar* com calculadora de diluição e vínculo opcional a OS ativa + *Perda*, zero `R$`); `ADMIN` acessa **Gestão & Compras** (compras por embalagem, à vista vs a prazo, Pot-Life *Abrir Frasco*, ajuste físico de inventário, histórico paginado e **Lista de Compras WhatsApp**).
  - Builder de Ficha Técnica integrado em `/servicos` (`/api/services*`) e checklist de baixa de insumos por OS em `/os/[id]` (`POST /api/orders/[id]/consume-stock`).
  - Registro de `.agents/agents/inventory-erp-specialist.md` e `.agents/skills/inventory-erp-auditor/SKILL.md`.

## [0.8.0] — 16/11/2026

### Auditoria e Reestruturação Completa do Módulo de CRM & Retenção
- **Modelagem Prisma & Migration (`20261116130000_crm_retention_upgrade`):**
  - `Tenant.googleReviewUrl` para link oficial do Google Avaliações configurado em `/configuracoes` (`/api/settings`).
  - `Service.maintenanceIntervalDays` para ciclo sugerido de revisão/manutenção configurado em `/servicos` (`/api/services` e `/api/services/[id]`).
  - Novo model `CrmContactLog` (campanhas, desfechos `SENT | POSTPONED | NO_INTEREST`, `snoozeUntil`, índices por tenant/cliente/campanha).
- **Integridade de Dados, RBAC e Precisão no CRM (`/api/crm`, `/api/crm/contacts`, `src/lib/phone.ts`):**
  - `GET /api/crm` e `POST /api/crm/contacts` blindados com `requireAdmin()`; `/crm` exibe alerta de acesso restrito para `OPERATOR`.
  - Unificação multi-veículos (`Vehicle` + `CustomerVehicle`), cálculo exclusivo de LTV/visitas sobre OS `PAID` usando `completedAt ?? paidAt ?? createdAt`, e garantia de preenchimento de `completedAt` em `/api/orders`, `/api/orders/[id]/status` e `/api/orders/[id]/payments`.
  - Curva ABC corrigida (`totalSpent <= 0` em `C`, 1º pagante sempre em `A`).
  - `COATING_WARRANTY` rastreia a última OS paga específica de proteção/manutenção sem falso reset por lavagens simples; `RAINY_DAY` filtra clientes com WhatsApp válido sem visita nos últimos 15 dias; `src/lib/phone.ts` normaliza números sem duplicar `55`.
- **Motor de Retenção Acionável e UI Modular (`/crm`, `src/components/modules/crm/*`):**
  - Nova aba padrão **Para Chamar Hoje (`TODAY`)**, aba **Orçamentos em Aberto (`BUDGET_RECOVERY`)** e aba **Aniversariantes (`BIRTHDAY`)** integrada ao campo `birthDate` em `/clientes` (`/api/customers`).
  - Busca (`q`), paginação (`Pagination`), anti-spam configurável (`hideContacted`), modal WhatsApp com *"Enviar WhatsApp e Marcar"*, *"Adiar 15 dias"* e *"Sem interesse"*, e indicador **Retorno Gerado (30d)** sem jargões técnicos.
  - Registro de `.agents/agents/crm-retention-specialist.md` e `.agents/skills/crm-retention-auditor/SKILL.md`.

## [0.7.0] — 16/11/2026

### Hardening de Segurança, Sessão e Qualidade Técnica
- **ESLint Configurado:** adicionados `eslint` (`^8.57.1`) e `eslint-config-next` (`14.2.35`) com `.eslintrc.json` (`next/core-web-vitals`), habilitando `npm run lint` sem prompt interativo.
- **UTF-8 em `prisma/seed.ts`:** corrigidos todos os textos com mojibake para UTF-8 limpo mantendo lógica e credenciais de demonstração.
- **Rate Limit Distribuído:** rotas de autenticação (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/google/callback`, `/api/master-saas/auth` e `/api/auth/change-password`) migradas para `await isRateLimitedAsync(...)` com Redis + fallback em memória.
- **Revogação por `tokenVersion` e Troca Obrigatória de Senha (`mustChangePassword`):**
  - Migration PostgreSQL `20261116120000_user_token_version_and_must_change_password` adicionando `tokenVersion` e `mustChangePassword` em `users`.
  - `getSession()` valida `(session.tokenVersion ?? 1) === user.tokenVersion` e `signToken` inclui `tokenVersion` e `mustChangePassword`.
  - Criação de usuários com senha provisória (`/api/employees`, `/api/employees/[id]`, `/api/master-saas/tenants`, `/api/onboarding`) marca `mustChangePassword: true`; redefinição/troca de senha incrementa `tokenVersion` e limpa `mustChangePassword: false`.
  - Criados endpoint `POST /api/auth/change-password` e página `/trocar-senha` com bloqueio/redirecionamento automático em `src/middleware.ts`, `/login` e layout do dashboard.

## [0.6.0] — 16/11/2026

### Adicionado e Atualizado (Etapa 2 — Módulo Financeiro)
- **Modelagem Prisma e Migração PostgreSQL (`20261116000000_financial_stage2`):**
  - `Tenant`: taxas padrão de maquininha (`debitFeeRate`, `credit1xFeeRate`, `credit2to6FeeRate`, `credit7to12FeeRate`).
  - `Payment`: parcelamento e taxa MDR (`installments`, `feeRate`, `feeAmount`, `netAmount`) com backfill seguro (`netAmount = amount` para registros existentes).
  - `Expense`: fornecedor, parcelamento e recorrência (`supplier`, `recurrenceGroupId`, `recurrenceType`, `installmentNumber`, `totalInstallments`) e índice `[tenantId, recurrenceGroupId]`.
- **Pagamentos Parciais (Sinal), Múltiplos Métodos e Taxas de Maquininha:**
  - Helper `src/lib/payment-fees.ts` para cálculo de `feeRate`, `feeAmount` e `netAmount` por método/faixa de parcelas.
  - Endpoints `POST /api/orders/[id]/payments` e `DELETE /api/orders/[id]/payments/[paymentId]` (`ADMIN`) com quitação automática ao atingir `totalAmount`, preservação do status operacional em sinais parciais e estorno seguro.
  - `PATCH /api/orders/[id]/status` atualizado para lançar `Payment` apenas do saldo restante (`totalAmount - paidAmount`); `PUT /api/orders/[id]` e `DELETE /api/orders/[id]/items` protegidos contra redução de `totalAmount < paidAmount`.
  - Seção **Taxas de Maquininha (%)** em `/configuracoes` (`PUT /api/settings` com validação `0..100` para `ADMIN`) e modal compartilhado `OrderPaymentModal` integrado em `/financeiro`, `/patio` e `/os/[id]` (com badge *Pago Parcial* e estorno individual).
- **Regime de Caixa por `Payment`, Contas Parceladas/Recorrentes e Caixa do Dia:**
  - `/api/financial/dre` e `/api/dashboard/stats` alinhados aos pagamentos reais (`Payment`, incluindo sinais e `(-) Taxas de Maquininha`) e saldo restante em *A Receber*.
  - `/api/expenses` (`POST` com `SINGLE`, `INSTALLMENT` 2..48x com ajuste de centavos na última parcela e `RECURRING` 2..24 meses preservando o dia via `addMonthsPreservingDay`) e `DELETE /api/expenses/[id]?scope=single|future`.
  - Endpoint `GET /api/financial/daily-cash?date=YYYY-MM-DD` (`ADMIN`) e nova aba **Caixa do Dia** em `/financeiro` com *Dinheiro na Gaveta*, *Total Digital/Banco*, *Saldo Líquido do Dia*, exportação CSV e impressão.

## [0.5.0] — 16/11/2026

### Adicionado e Corrigido (Etapa 1 — Reestruturação do Módulo Financeiro)
- **Integridade de Ordens de Serviço e Estorno:**
  - Idempotência em `PATCH /api/orders/[id]/status` quando `existing.status === "PAID"` e `status === "PAID"` (evita duplicação de `Payment`, `Commission` e métricas do cliente).
  - Estorno atômico dentro de `$transaction` ao reverter OS `PAID` (bloqueia com `400` se houver comissão `PAID`; remove `Payment` e `Commission` `PENDING`, zera `paidAt`/`paidAmount`, decrementa `Customer.totalSpent` e `visitsCount` com piso `0` e grava `AuditLog`).
  - Bloqueio de alteração de `discount`/`totalAmount` em `PUT /api/orders/[id]` quando a OS já estiver `PAID`.
- **Comissões e RBAC:**
  - Helper `src/lib/commission.ts` (`resolveItemCommissionRate`) aplicado em `POST /api/orders` e `POST /api/orders/[id]/items`: `User.commissionRate > 0` sobrescreve `Service.defaultCommission`.
  - Privacidade RBAC em `/api/commissions` e `/comissoes`: `serviceOrder.totalAmount` retornado como `null` e ocultado na UI para `OPERATOR`; `summary` calculado sem zerar por filtro de status; suporte a paginação e filtro de período.
- **Regime de Caixa, Datas UTC-3 e Performance:**
  - Helper `src/lib/date-utils.ts` eliminando o bug de fuso `UTC-3` em datas `"YYYY-MM-DD"`.
  - Alinhamento 100% em Regime de Caixa (`paidAt`) em `/api/financial/dre` e `/api/dashboard/stats` usando `aggregate`/`groupBy`, incluindo breakdown de `Payment`, contas a pagar (atrasadas/a vencer) e OS `DONE` a receber.
  - Filtros avançados, paginação, totais agregados, `paidAt` explícito e `AuditLog` (`PUT`/`DELETE`) em `/api/expenses` e `/api/expenses/[id]`; suporte a `purchasedAt` na despesa automática de `/api/products`.
  - Correção da tipagem de `OrderDetail.payments` e exibição de pagamentos registrados em `/os/[id]`.
- **Nova Experiência `/financeiro` e Agente Especialista:**
  - Menu lateral atualizado para `"Financeiro"` (`src/components/layout/sidebar.tsx`).
  - Nova tela `/financeiro` modularizada em `src/components/modules/financeiro/` com 4 abas: `Resumo Simples`, `Contas a Pagar`, `Entradas e A Receber` e `DRE Detalhado` (com exportação CSV).
  - Registro do agente `.agents/agents/financial-erp-specialist.md` e da skill `.agents/skills/financial-erp-auditor/SKILL.md`.

## [0.4.0] — 09/11/2026

### Adicionado
- Conclusão da **Fase 4: Orçamentos em PDF, Ordens de Serviço e Pátio Kanban em Tempo Real**:
  - Endpoints REST de Ordens de Serviço e Orçamentos (`/api/orders`, `/api/orders/[id]`).
  - Motor de conversão de Orçamento em OS em 1 clique (`/api/orders/[id]/convert`) com imutabilidade e congelamento de preços históricos nos itens.
  - Endpoint ágil de atualização de status do Kanban (`/api/orders/[id]/status`) com transação atômica gerando baixa de pagamento em `Payment` e comissão de colaborador em `Commission`.
  - Interface de Orçamentos e Propostas Comerciais (`/orcamentos`) com cálculo automático de preços pela categoria do veículo e botão de compartilhamento no WhatsApp.
  - Página da Proposta Comercial formatada para impressão/PDF (`/orcamentos/[id]`).
  - Interface geral de Ordens de Serviço (`/os`) com filtros avançados e busca indexada.
  - Tela de Entrada Direta de OS no pátio (`/os/nova`).
  - Pátio Kanban em Tempo Real (`/patio`) com suporte nativo a Drag & Drop (HTML5) e botões de 1 toque de avanço de coluna para operadores de pista.
  - Modal de baixa de pagamentos com seleção de métodos (PIX, Cartão, Dinheiro).
  - Bateria de testes automatizados (`test_phase4.ts`) com 10 testes aprovados e 0 falhas.
  - Build de produção verificado com 100% de sucesso.

## [0.3.0] — 09/11/2026

### Adicionado
- Conclusão da **Fase 3: Vistoria Digital, Checklist 360º de Avarias e Captura de Fotos**:
  - Endpoint seguro de upload de evidências fotográficas (`/api/uploads`) com validação de tipo de arquivo e tamanho.
  - Endpoints REST de Vistorias e Checklists (`/api/checklists` e `/api/checklists/[id]`).
  - Componente Interativo de Silhueta Veicular 360º (`vehicle-silhouette-360.tsx`) com posicionamento de alfinetes por coordenadas X e Y e mapeamento de tipo de dano (`SCRATCH`, `DENT`, `CHIP`, `PAINT_BURN`, `PEELING`, `OTHER`).
  - Suporte a disparo de câmera direta pelo celular/tablet (`capture="environment"`).
  - Painel de Vistorias (`/vistoria`) com histórico de recepção de carros e modal interativo.
  - Página de Comprovante de Vistoria de Entrada (`/vistoria/[id]`) formatada para impressão/PDF e compartilhamento no WhatsApp com link pré-formatado.
  - Bateria de testes automatizados (`test_phase3.ts`) com 8 testes aprovados e 0 falhas.
  - Build de produção verificado com 100% de sucesso.

## [0.2.0] — 09/11/2026

### Adicionado
- Conclusão da **Fase 2: Clientes, Veículos e Catálogo de Serviços com Matriz de Preços por Porte**:
  - Endpoints REST completos para Clientes (`/api/customers` e `/api/customers/[id]`) com busca indexada e histórico.
  - Endpoints REST para Veículos (`/api/vehicles` e `/api/vehicles/[id]`) com categorização por porte e proteção contra duplicidade de placas no mesmo tenant.
  - Endpoints REST para Serviços (`/api/services` e `/api/services/[id]`) com matriz de preços configurável por porte do veículo.
  - Motor de Cálculo Inteligente de Preço (`/api/pricing/calculate`) que identifica automaticamente a categoria do carro e aplica a tarifa exata da matriz, calculando também o valor estimado da comissão.
  - Interface do usuário de Clientes e Carros (`/clientes`) com busca em tempo real e formulário integrado.
  - Interface do Catálogo de Serviços e Tabela de Preços (`/servicos`) com filtros por categoria e gestão modal.
  - Bateria de testes automatizados (`test_phase2.ts`) com 7 testes aprovados e 0 falhas.
  - Build de produção Next.js 14 validado com sucesso.

## [0.1.0] — 09/11/2026

### Adicionado
- Estrutura base de governança do projeto em `docs/`.
- Documento de Arquitetura Técnica (`ARCHITECTURE.md`) com modelagem relacional, stack e matriz RBAC.
- Documento de Status do Projeto (`PROJECT_STATUS.md`).
- Checklist detalhado de implementação por fases (`IMPLEMENTATION_CHECKLIST.md`).
- Registro de problemas conhecidos e limitações planejadas (`KNOWN_ISSUES.md`).
- Conclusão da **Fase 1: Setup, Autenticação e Multi-Tenancy**:
  - Prisma Schema com 14 entidades relacionais e isolamento multi-tenant.
  - Hashing seguro de senhas com bcryptjs e sessões JWT criptografadas em Cookies HttpOnly.
  - Endpoints de autenticação (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`).
  - Endpoint de estatísticas em tempo real com dados reais do banco (`/api/dashboard/stats`).
  - Controle de autorização no backend bloqueando dados de faturamento para perfil `OPERATOR`.
  - Telas completas de Login e Cadastro de Empresa com feedback visual e atalhos de demonstração.
  - Layout protegido com Sidebar e Header responsivos.
  - Dashboard Operacional e Financeiro e Pátio Kanban em 4 colunas com dados reais do seed.
  - Bateria de testes automatizados (`test_phase1.ts`) com 100% de aprovação.
  - Build de produção verificado com sucesso sem erros.
