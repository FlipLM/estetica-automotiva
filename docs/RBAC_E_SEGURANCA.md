# Matriz de Segurança e Controle de Acesso Baseado em Funções (RBAC)

O sistema implementa segurança e restrição de acesso no nível de **Backend** e **Frontend**, garantindo que nenhum colaborador não autorizado acesse dados sensíveis da empresa.

---

## 1. Perfis de Usuário

### A. Administrador / Proprietário (`ADMIN`)
Possui acesso completo a todas as áreas:
- Dashboard financeiro e contábil.
- Faturamento do dia, mensal e acumulado.
- DRE Gerencial, despesas operacionais e margem de lucro líquida.
- Liquidação e histórico de comissões de toda a equipe.
- Configuração do catálogo de serviços e alteração de preços.
- Edição de configurações da empresa.
- Exclusão de cadastros e despesas.

### B. Operador de Pátio / Detalheador (`OPERATOR`)
Acesso operacional estrito para o fluxo de atendimento:
- Acesso ao Pátio Kanban para arrastar e acompanhar veículos.
- Consulta e atualização do andamento das ordens de serviço atribuídas.
- Realização de checklists e vistorias 360º com fotos.
- Consulta de clientes e veículos.
- Movimentação de estoque de insumos (saída para diluição/uso).
- Acesso exclusivo ao seu próprio extrato de comissões.

**Bloqueios obrigatórios para `OPERATOR`:**
- ❌ Faturamento bruto e líquido da empresa.
- ❌ Custos de aquisição de produtos e margem de lucro.
- ❌ Despesas fixas (Aluguel, Luz, Salários).
- ❌ Comissões de outros colaboradores.
- ❌ Configurações do tenant.

---

## 2. Enforcement no Nível de API

As APIs verificam o perfil do usuário através de `session.role`:
- Se a rota é exclusiva de gestão (ex: `/api/financial/dre`, `/api/expenses`, `/api/settings` PUT), o endpoint retorna imediatamente `HTTP 403 Forbidden` caso `session.role !== 'ADMIN'`.
- Na listagem de comissões (`/api/commissions`), a cláusula `where.userId = session.userId` é injetada compulsoriamente se o perfil for `OPERATOR`.
- No endpoint de estatísticas (`/api/dashboard/stats`), os campos financeiros (`dailyRevenue`, `monthlyRevenue`, `netProfit`, `expenses`) são omitidos do JSON retornado para operadores.


---

## 3. Autenticação e Sessão (atualizado)

- **Barreira central:** `src/middleware.ts` (deny-by-default). Públicos: `/login`, `/register`, `/gestor-master`, `/api/auth/{login,register,logout,google}`, `/api/master-saas/*` (autenticação própria). Sem JWT válido: páginas → redirect `/login?next=`, APIs → `401`. Uploads (`/uploads/*`) exigem login.
- **Sessão:** cookie HttpOnly `detailing_saas_token` (JWT HS256, 7 dias). `getSession()` **não possui fallback**; revalida usuário (`active`, `role`) e tenant (`active`, trial, `onboardingCompleted`) no banco a cada requisição e nega acesso (fail-closed) se o banco falhar. O token não é mais retornado no corpo JSON.
- **Segredos:** `JWT_SECRET` (mín. 32 caracteres) é obrigatório; sem valores padrão. Master: `MASTER_ADMIN_EMAIL`/`MASTER_ADMIN_PASSWORD` do ambiente (sem padrão), `MASTER_JWT_SECRET` opcional, comparação em tempo constante. Ver `.env.example`.
- **Rate limit** (`src/lib/rate-limit.ts`, em memória, por instância): login 20/IP e 8/e-mail por 15 min; registro 5/IP por hora; master 5/IP por 15 min.
- **CSRF:** mutações em `/api/*` com `Origin` diferente do host retornam `403`.
- **Onboarding:** tenants criados pelo gestor master (acesso temporário) e por cadastro/Google nascem com `onboardingCompleted=false`; o login devolve `redirect: /onboarding` e o layout do dashboard reforça. Senha temporária é aleatória (12 caracteres) quando não informada.
- **Login com Google** (OAuth 2.0 Authorization Code + PKCE, `state`+`nonce`, `id_token` verificado via JWKS, `email_verified` obrigatório): `GET /api/auth/google` e `GET /api/auth/google/callback`. `User.googleId` (único). E-mail existente é vinculado; e-mail novo cria tenant TRIAL com onboarding. Envs: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`; redirect URI: `{APP_URL}/api/auth/google/callback`.

### Pendências conhecidas
- Rotacionar `JWT_SECRET`, senha master e senha do banco (o `.env` esteve versionado; histórico do git ainda contém os valores antigos).
- **Isolamento Multi-Tenant e RBAC Auditados:** rotas antigas `/api/admin/tenants/*` removidas (exponham todos os tenants a qualquer `ADMIN` de oficina); `POST /api/onboarding` restrito a `ADMIN`; mutações de produtos e entradas de estoque (`IN`) restritas a `ADMIN`; custos de aquisição ocultados para `OPERATOR` em `/api/products`; `assignedUserId` validado contra o `tenantId` em ordens de serviço; uploads validam magic bytes reais (JPG/PNG/WEBP) e bloqueiam path traversal/XSS.
- Troca obrigatória de senha no primeiro login e revogação de sessão (`tokenVersion`) ainda não implementadas.
- Rate limit em memória: migrar para Redis em múltiplas réplicas. CSP ainda não configurada.
