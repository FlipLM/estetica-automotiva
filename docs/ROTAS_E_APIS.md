# Catálogo de Rotas e APIs do Sistema

## 1. Rotas de Interface (Frontend)

| Rota | Descrição | Perfis Autorizados |
|---|---|:---:|
| `/login` | Autenticação de usuários | Todos (Público) |
| `/register` | Cadastro de nova estética (onboarding de tenant) | Todos (Público) |
| `/esqueci-senha` | Solicitação de link para recuperação de senha | Todos (Público) |
| `/redefinir-senha` | Definição de nova senha com token seguro de 1h | Todos (Público) |
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
| `/financeiro` | DRE Gerencial, contas a pagar e despesas | `ADMIN` |
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
- `POST /api/auth/reset-password` — Valida token SHA-256 e atualiza senha do usuário.
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
- `PUT /api/orders/[id]` — Atualiza dados da OS e transfere de box com validação de vagas livres.
- `POST /api/orders/[id]/convert` — Converte orçamento aprovado em OS ativa no pátio.
- `PATCH /api/orders/[id]/status` — Atualiza status no Kanban, registra comissões e baixa de pagamentos.
- `GET /api/boxes` — Lista boxes e baias enriquecidos com telemetria e vagas ocupadas em tempo real.
- `POST /api/boxes` — Cadastra novo box com capacidade de vagas simultâneas.
- `PUT /api/boxes/[id]` — Atualiza nome, tipo, cor, descrição e capacidade de vagas do box.
- `DELETE /api/boxes/[id]` — Remove box cadastrado.

### Financeiro, DRE & Despesas
- `GET /api/financial/dre` — Apura DRE gerencial do período selecionado.
- `GET /api/expenses` — Lista despesas operacionais.
- `POST /api/expenses` — Registra nova despesa.
- `PUT /api/expenses/[id]` — Edita despesa ou baixa como paga.
- `DELETE /api/expenses/[id]` — Exclui despesa (ADMIN).

### Estoque & Insumos Químicos
- `GET /api/products` — Lista produtos com alertas de estoque crítico.
- `POST /api/products` — Cadastra produto químico ou consumível.
- `PUT /api/products/[id]` — Edita dados e estoque mínimo.
- `POST /api/products/[id]/movement` — Movimentação atômica (Entrada, Saída, Avaria).

### Comissões & Repasses
- `GET /api/commissions` — Lista comissões geradas (ADMIN vê todas, OPERATOR vê apenas as suas).
- `PATCH /api/commissions` — Liquidação em lote com lançamento opcional de despesa no fluxo de caixa.

### CRM & Configurações
- `GET /api/crm` — Inteligência de retenção, Curva ABC, dias de chuva e pós-venda.
- `GET /api/settings` — Dados cadastrais do tenant.
- `PUT /api/settings` — Atualiza dados da empresa.

---

## Armazenamento em Nuvem da Estética (BYOS Multi-Provedor)

- **Tela Exclusiva do Administrador:** /armazenamento ([page.tsx](src/app/(dashboard)/armazenamento/page.tsx)) — visível apenas para ADMIN. Contém seletor e tutorial passo a passo para **Google Drive**, **Telegram Cloud (Grupo/Canal Privado)**, **Microsoft OneDrive**, **Dropbox** e **Cloudflare R2 / S3**, além de abertura de chamado direto via WhatsApp.
- **Endpoints:**
  - GET /api/storage/config (equireAdmin): retorna provedor ativo, status da conexão e credenciais mascaradas do Tenant.
  - PUT /api/storage/config (equireAdmin): salva provedor e credenciais criptografadas com AES-256-GCM (src/lib/crypto.ts) no Tenant.
  - POST /api/storage/config (equireAdmin): testa a conexão real com a API do provedor escolhido e ativa storageConnected = true.
  - GET /uploads/cloud/[provider]/[...fileId] (equireAuth): proxy autenticado que carrega a imagem da nuvem do Tenant para exibição no sistema e geração de PDF.
