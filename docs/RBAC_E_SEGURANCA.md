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
