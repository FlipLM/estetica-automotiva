# Catálogo de Rotas e APIs do Sistema

## 1. Rotas de Interface (Frontend)

| Rota | Descrição | Perfis Autorizados |
|---|---|:---:|
| `/login` | Autenticação de usuários | Todos (Público) |
| `/register` | Cadastro de nova estética (onboarding de tenant) | Todos (Público) |
| `/esqueci-senha` | Solicitação de link para recuperação de senha | Todos (Público) |
| `/redefinir-senha` | Definição de nova senha com token seguro de 1h | Todos (Público) |
| `/trocar-senha` | Troca de senha própria ou troca obrigatória de senha provisória (`mustChangePassword`) | `ADMIN`, `OPERATOR` (autenticado) |
| `/dashboard` | Painel executivo com métricas financeiras e operacionais | `ADMIN` |
| `/patio` | Pátio Operacional com alternador de Visão (Status Kanban vs Estações & Boxes com Drag & Drop de transferência) | `ADMIN`, `OPERATOR` |
| `/boxes` | Gestão de Boxes, Baias e Capacidades de Vagas simultâneas da Oficina | `ADMIN`, `OPERATOR` |
| `/os` | Tabela geral de ordens de serviço | `ADMIN`, `OPERATOR` |
| `/os/nova` | Abertura direta de nova OS | `ADMIN`, `OPERATOR` |
| `/vistoria` | Lista de vistorias e checklists digitais | `ADMIN`, `OPERATOR` |
| `/vistoria/[id]` | Visualização, impressão e compartilhamento da vistoria | `ADMIN`, `OPERATOR` |
| `/orcamentos` | Lista de orçamentos e propostas comerciais | `ADMIN`, `OPERATOR` |
| `/orcamentos/[id]` | Proposta visual com opção de aprovação/conversão | `ADMIN`, `OPERATOR` |
| `/clientes` | Cadastro e histórico de clientes e veículos | `ADMIN`, `OPERATOR` |
| `/servicos` | Catálogo de serviços técnicos e matriz de preços | `ADMIN` |
| `/estoque` | Controle de insumos químicos e movimentações | `ADMIN`, `OPERATOR` |
| `/financeiro` | Painel Financeiro em camadas: Resumo Simples, Contas a Pagar, Entradas/A Receber, Caixa do Dia e DRE em Regime de Caixa | `ADMIN` |
| `/comissoes` | Extrato e liquidação de comissões | `ADMIN`, `OPERATOR` (restrito) |
| `/crm` | CRM inteligente, retenção e campanhas de dias de chuva | `ADMIN` |
| `/configuracoes` | Dados cadastrais da empresa e dados de contato | `ADMIN` |

---

## 2. Rotas de API (Backend)

### Autenticação & Sessão
- `POST /api/auth/register` — Cadastra novo Tenant e usuário Administrador.
- `POST /api/auth/login` — Autentica usuário e emite Cookie HttpOnly com JWT.
- `GET /api/auth/me` — Retorna dados da sessão do usuário conectado.
- `POST /api/auth/logout` — Destrói a sessão e remove os cookies.
- `POST /api/auth/forgot-password` — Solicita recuperação de senha e gera link único de 1h.
- `POST /api/auth/reset-password` — Valida token SHA-256, atualiza senha, limpa `mustChangePassword` e incrementa `tokenVersion`.
- `POST /api/auth/change-password` — Troca autenticada de senha própria/provisória, incrementa `tokenVersion`, limpa `mustChangePassword` e reemite o cookie JWT.
- `GET /api/health` — Endpoint de integridade para orquestradores (Coolify/Docker) com verificação de banco.

### Clientes & Veículos
- `GET /api/customers` — Lista clientes com contagem de veículos e serviços.
- `POST /api/customers` — Cadastra cliente.
- `GET /api/customers/[id]` — Detalhes do cliente com histórico completo.
- `PUT /api/customers/[id]` — Atualiza dados do cliente.
- `DELETE /api/customers/[id]` — Remove cliente (ADMIN).
- `GET /api/vehicles` — Lista veículos com dados dos proprietários.
- `POST /api/vehicles` — Cadastra veículo com categoria de porte.

### Catálogo & Precificação
- `GET /api/services` — Lista serviços com matriz de preços por categoria.
- `POST /api/services` — Cadastra serviço e tabela de preços.
- `POST /api/pricing/calculate` — Calcula preço e tempo para veículo e serviço selecionados.

### Vistoria & Checklists
- `POST /api/uploads` — Upload de fotografias da vistoria (JPG, PNG, WebP).
- `GET /api/checklists` — Lista vistorias do tenant.
- `POST /api/checklists` — Registra vistoria com avarias 360º e dados de recepção.
- `GET /api/checklists/[id]` — Detalhes completos da vistoria com coordenadas.

### Orçamentos, OS & Pátio Kanban
- `GET /api/orders` — Lista ordens de serviço e orçamentos filtrados.
- `POST /api/orders` — Cria orçamento ou ordem de serviço com validação de capacidade do box.
- `GET /api/orders/[id]` — Detalhes da OS/orçamento com itens congelados.
- `PUT /api/orders/[id]` — Atualiza dados da OS e transfere de box com validação de vagas livres (bloqueia alteração de `discount`/`totalAmount` se `status === "PAID"` ou se o novo total ficar menor que `paidAmount`).
- `POST /api/orders/[id]/items` — Lista, adiciona ou remove serviços de uma OS existente aplicando a regra de comissão (`User.commissionRate > 0` sobrescreve `Service.defaultCommission`) e bloqueia remoção que reduza o total abaixo de `paidAmount`.
- `POST /api/orders/[id]/payments` — Registra pagamento parcial (sinal) ou total (`ADMIN`), calcula taxas de maquininha (`src/lib/payment-fees.ts`) e quita automaticamente a OS ao atingir `totalAmount`.
- `DELETE /api/orders/[id]/payments/[paymentId]` — Estorna um pagamento específico (`ADMIN`), recalcula `paidAmount` e reabre a OS se necessário (bloqueando se houver comissão `PAID`).
- `POST /api/orders/[id]/convert` — Converte orçamento aprovado em OS ativa no pátio.
- `PATCH /api/orders/[id]/status` — Atualiza status no Kanban com idempotência em `PAID`, baixa automática apenas do saldo restante (`totalAmount - paidAmount`), apuração de comissão em `Commission` e estorno atômico (quando permitido, sem comissão já liquidada).
- `GET /api/boxes` — Lista boxes e baias enriquecidos com telemetria e vagas ocupadas em tempo real.
- `POST /api/boxes` — Cadastra novo box com capacidade de vagas simultâneas.
- `PUT /api/boxes/[id]` — Atualiza nome, tipo, cor, descrição e capacidade de vagas do box.
- `DELETE /api/boxes/[id]` — Remove box cadastrado.

### Financeiro, DRE, Caixa do Dia & Despesas
- `GET /api/financial/dre` — Apura visão consolidada em Regime de Caixa real via `Payment` e `Expense.paidAt`: receita bruta recebida, taxas de maquininha, receita líquida em caixa, DRE gerencial, saldo real a receber (`totalAmount - paidAmount`), contas atrasadas/a vencer e histórico de recebimentos.
- `GET /api/financial/daily-cash` — Conferência do Caixa do Dia (`?date=YYYY-MM-DD`, `ADMIN`): entradas por método (bruto, taxa, líquido), saídas pagas no dia, **Dinheiro na Gaveta**, **Total Digital/Banco** e **Saldo Líquido do Dia**.
- `GET /api/expenses` — Lista despesas com filtros (`period`, `status` `ALL|PAID|PENDING|OVERDUE`, `category`, `q`), paginação (`page`, `limit`) e totais agregados.
- `POST /api/expenses` — Registra despesa única, parcelada (`INSTALLMENT` 2..48x) ou recorrente (`RECURRING` 2..24 meses) com suporte a `supplier`, `paidAt` explícito e `AuditLog`.
- `PUT /api/expenses/[id]` — Edita despesa (incluindo fornecedor), registra baixa com `paidAt` ou reabre como pendente (com `AuditLog`).
- `DELETE /api/expenses/[id]` — Exclui despesa (`ADMIN`), suportando `?scope=single|future` para séries parceladas/recorrentes sem apagar histórico já pago (com `AuditLog`).

### Estoque & Insumos Químicos
- `GET /api/products` — (`requireAuth`) Lista produtos ativos (ou arquivados com `?includeArchived=true` para `ADMIN`), KPIs sem distorção de busca, alertas de reposição/validade e mascaramento RBAC de custos/fornecedor para `OPERATOR`.
- `POST /api/products` — (`requireAdmin`) Cadastra produto (`ML | L | G | KG | UN | M | M2`), embalagem (`packSize`/`packLabel`), diluição, validade/pot-life, compra inicial à vista ou a prazo (`Expense` vinculada) e `AuditLog`.
- `GET /api/products/[id]` — (`requireAuth`) Ficha detalhada, receitas vinculadas e histórico recente (com mascaramento para `OPERATOR`).
- `PUT /api/products/[id]` — (`requireAdmin`) Atualiza ficha, marca abertura de frasco (`OPEN_BOTTLE`/`RESET_OPENED`) ou converte unidade compatível (`ML <-> L`, `G <-> KG`) com reescala transacional.
- `DELETE /api/products/[id]` — (`requireAdmin`) Arquiva (`active: false`) se houver movimentações/fichas (preservando `Expense`) ou exclui definitivamente apenas quando vazio.
- `POST /api/products/[id]/movement` — (`requireAuth`; `IN` e `ADJUSTMENT` exigem `ADMIN`) Registra compra com Custo Médio Móvel e pagamento à vista/a prazo, baixa atômica (`OUT`, `LOSS`, `OS_CONSUMPTION` com `serviceOrderId` obrigatório) ou ajuste de inventário físico.
- `PATCH /api/products/[id]/movement` — Recuperação idempotente de perda (`RECOVER_LOSS`) ou edição contábil de movimentação (`EDIT_MOVEMENT`, `ADMIN`) sem duplicação de `Expense`.
- `GET /api/products/movements` — (`requireAuth`) Histórico global paginado de movimentações com filtros por período, tipo e produto (com mascaramento de valores para `OPERATOR`).
- `POST /api/orders/[id]/consume-stock` — (`requireAuth`) Baixa atômica em lote dos insumos da ficha técnica (`ServiceProductRecipe`) ou ajustados manualmente para uma Ordem de Serviço específica.

### Comissões & Repasses
- `GET /api/commissions` — Lista comissões geradas com filtro por status/período e paginação (`ADMIN` vê todas e `serviceOrder.totalAmount`; `OPERATOR` vê apenas as suas com `serviceOrder.totalAmount: null`).
- `PATCH /api/commissions` — Liquidação em lote (`ADMIN`) com lançamento opcional de despesa no fluxo de caixa e registro em `AuditLog`.

### CRM & Configurações
- `GET /api/crm` — (`ADMIN`) Motor de retenção com fila **Para Chamar Hoje (`TODAY`)**, recuperação de orçamentos (`BUDGET_RECOVERY`), garantia/manutenção (`COATING_WARRANTY`), sumidos (`CHURN_RISK`, limiar configurável via `churnDays`), pós-venda (`POST_SALE`), dia de chuva (`RAINY_DAY`), aniversariantes (`BIRTHDAY`), busca (`q`), anti-spam (`hideContacted`), filtros de intervalo de datas (`period`, `startDate`, `endDate` para Retorno Gerado e `visitStartDate`, `visitEndDate` para última visita), paginação e **Retorno Gerado**.
- `POST /api/crm/contacts` — (`ADMIN`) Registra contato WhatsApp (`SENT`), adiamento de 15 dias (`POSTPONED`) ou sem interesse (`NO_INTEREST`) em `CrmContactLog` com validação multi-tenant e `AuditLog`.
- `GET /api/settings` — Dados cadastrais, taxas de maquininha e `googleReviewUrl` do tenant.
- `PUT /api/settings` — Atualiza dados da empresa, link de avaliação no Google (`googleReviewUrl`) e taxas padrão de cartão (`debitFeeRate`, `credit1xFeeRate`, `credit2to6FeeRate`, `credit7to12FeeRate`, `ADMIN`).

---

## Armazenamento em Nuvem da Estética (BYOS Multi-Provedor)

- **Tela Exclusiva do Administrador:** /armazenamento ([page.tsx](src/app/(dashboard)/armazenamento/page.tsx)) — visível apenas para ADMIN. Contém seletor e tutorial passo a passo para **Google Drive**, **Telegram Cloud (Grupo/Canal Privado)**, **Microsoft OneDrive**, **Dropbox** e **Cloudflare R2 / S3**, além de abertura de chamado direto via WhatsApp.
- **Endpoints:**
  - GET /api/storage/config (equireAdmin): retorna provedor ativo, status da conexão e credenciais mascaradas do Tenant.
  - PUT /api/storage/config (equireAdmin): salva provedor e credenciais criptografadas com AES-256-GCM (src/lib/crypto.ts) no Tenant.
  - POST /api/storage/config (equireAdmin): testa a conexão real com a API do provedor escolhido e ativa storageConnected = true.
  - GET /uploads/cloud/[provider]/[...fileId] (equireAuth): proxy autenticado que carrega a imagem da nuvem do Tenant para exibição no sistema e geração de PDF.
