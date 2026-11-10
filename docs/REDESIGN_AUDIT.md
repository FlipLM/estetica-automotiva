# FASE 0 — Auditoria Técnica e Plano de Redesign Integral
## DetailPro — Clean Professional Design System

**Data da Auditoria:** 10/11/2026  
**Branch de Execução:** `design/novos-designs`  
**Stack Base:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Prisma ORM (SQLite/PostgreSQL), JWT (jose), Bcrypt, Zod, Lucide React.

---

## 1. Inventário de Páginas e Rotas de Interface (Frontend)

| Rota | Arquivo | Módulo / Responsabilidade | Perfil de Acesso |
| :--- | :--- | :--- | :---: |
| `/` | `src/app/page.tsx` | Redirecionamento inicial de sessão | Público / Autenticado |
| `/login` | `src/app/(auth)/login/page.tsx` | Autenticação de usuários e acesso rápido de demonstração | Público |
| `/register` | `src/app/(auth)/register/page.tsx` | Cadastro de nova estética automotiva (Tenant + Admin) | Público |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Dashboard executivo com KPIs, gráficos, alertas e atalhos | `ADMIN` |
| `/agenda` | `src/app/(dashboard)/agenda/page.tsx` *(Novo / Integrado)* | Calendário de agendamentos (Dia, Semana, Mês) conectado a `ServiceOrder.scheduledFor` | `ADMIN`, `OPERATOR` |
| `/patio` | `src/app/(dashboard)/patio/page.tsx` | Kanban do Pátio (4 colunas drag & drop) + Mapa de Boxes e Vagas | `ADMIN`, `OPERATOR` |
| `/boxes` | `src/app/(dashboard)/boxes/page.tsx` | Configuração de Boxes, Rampas e Capacidades de Vagas | `ADMIN`, `OPERATOR` |
| `/vistoria` | `src/app/(dashboard)/vistoria/page.tsx` | Recepção de veículos e Checklist Visual 360º com fotos | `ADMIN`, `OPERATOR` |
| `/vistoria/[id]` | `src/app/(dashboard)/vistoria/[id]/page.tsx` | Laudo de Vistoria 360º para impressão e envio via WhatsApp | `ADMIN`, `OPERATOR` |
| `/orcamentos` | `src/app/(dashboard)/orcamentos/page.tsx` | Gestão comercial de propostas e conversão em OS em 1 clique | `ADMIN`, `OPERATOR` |
| `/orcamentos/[id]` | `src/app/(dashboard)/orcamentos/[id]/page.tsx` | Proposta comercial detalhada para impressão / PDF e WhatsApp | `ADMIN`, `OPERATOR` |
| `/os` | `src/app/(dashboard)/os/page.tsx` | Listagem geral, busca e filtros de Ordens de Serviço | `ADMIN`, `OPERATOR` |
| `/os/nova` | `src/app/(dashboard)/os/nova/page.tsx` | Abertura direta de Ordem de Serviço com cálculo por porte | `ADMIN`, `OPERATOR` |
| `/os/[id]` | `src/app/(dashboard)/os/[id]/page.tsx` | Detalhes completos da OS, timeline, vistoria e serviços | `ADMIN`, `OPERATOR` |
| `/clientes` | `src/app/(dashboard)/clientes/page.tsx` | CRM de Clientes e Frota de Veículos vinculados (N:N e 1:N) | `ADMIN`, `OPERATOR` |
| `/servicos` | `src/app/(dashboard)/servicos/page.tsx` | Catálogo de Serviços e Matriz Dinâmica de Preços por Porte | `ADMIN` |
| `/financeiro` | `src/app/(dashboard)/financeiro/page.tsx` | DRE Gerencial, Fluxo de Caixa, Receitas e Contas a Pagar | `ADMIN` |
| `/comissoes` | `src/app/(dashboard)/comissoes/page.tsx` | Apuração e liquidação de comissões por operador | `ADMIN`, `OPERATOR` (restrito) |
| `/estoque` | `src/app/(dashboard)/estoque/page.tsx` | Controle de insumos químicos, alertas de mínimo e movimentações | `ADMIN`, `OPERATOR` |
| `/crm` | `src/app/(dashboard)/crm/page.tsx` | Retenção de clientes, Pós-Venda, Dias de Chuva, Vitrificação e Curva ABC | `ADMIN` |
| `/funcionarios` | `src/app/(dashboard)/funcionarios/page.tsx` | Gestão de Equipe e Colaboradores (`ADMIN` / `OPERATOR`) | `ADMIN` |
| `/configuracoes` | `src/app/(dashboard)/configuracoes/page.tsx` | Dados cadastrais da estética automotiva e parâmetros | `ADMIN` |
| `/design-system` | `src/app/(dashboard)/design-system/page.tsx` *(Novo)* | Catálogo interativo de tokens, componentes e protótipos navegáveis | `ADMIN` / Dev |
| `/temas` | `src/app/(dashboard)/temas/page.tsx` | Vitrine comparativa de identidades visuais | `ADMIN` |

---

## 2. Inventário de Endpoints de API (Backend)

Todos os endpoints residem em `src/app/api/` e serão **100% preservados em seus contratos e regras**:

1. **Autenticação (`/api/auth/*`)**: `login`, `register`, `logout`, `me` (JWT via cookies HttpOnly).
2. **Dashboard (`/api/dashboard/stats`)**: Estatísticas de pátio e indicadores financeiros (ocultos para `OPERATOR`).
3. **Clientes e Veículos (`/api/customers`, `/api/vehicles`)**: CRUD completo com vínculo multi-proprietário (`CustomerVehicle`) e classificação por porte (`HATCH`, `SEDAN`, `SUV_PICKUP`, `MOTORCYCLE`, `SPECIAL_UTILITY`).
4. **Catálogo e Precificação (`/api/services`, `/api/pricing/calculate`)**: Matriz de preços por categoria de porte e cálculo automático.
5. **Vistoria 360º e Upload (`/api/checklists`, `/api/uploads`)**: Registro de avarias com coordenadas `(x, y)` na silhueta SVG, nível de combustível, KM, pertences e fotos.
6. **Orçamentos e Ordens de Serviço (`/api/orders`, `/api/orders/[id]/convert`, `/api/orders/[id]/status`, `/api/orders/[id]/items`)**: Congelamento de preços no momento da venda, transição de status, apuração automática de comissões e registro de pagamento na baixa (`PAID`).
7. **Boxes e Baias (`/api/boxes`, `/api/boxes/[id]`)**: Controle de estações de trabalho e bloqueio automático quando a capacidade (`capacity`) de vagas atinge o limite.
8. **Financeiro e DRE (`/api/financial/dre`, `/api/expenses`)**: Cálculo de Receita Bruta, Descontos, Receita Líquida, Comissões, Custo de Insumos, Margem de Contribuição, Despesas Fixas e Lucro Líquido.
9. **Comissões (`/api/commissions`)**: Listagem filtrada por perfil e liquidação em lote com lançamento automático no fluxo de caixa.
10. **Estoque (`/api/products`, `/api/products/[id]/movement`)**: Movimentações atômicas (`IN`, `OUT`, `LOSS`) e alerta `currentStock <= minStock`.
11. **CRM (`/api/crm`)**: Alertas de retorno (>45 dias), revisão de vitrificação, pós-venda, campanha de dias de chuva e Curva ABC (LTV).
12. **Equipe e Configurações (`/api/employees`, `/api/settings`)**: Gestão de usuários do tenant e dados da empresa.

---

## 3. Componentes Existentes e Reaproveitamento Técnico

| Componente | Caminho Atual | Estratégia no Redesign |
| :--- | :--- | :--- |
| `Sidebar` | `src/components/layout/sidebar.tsx` | **Reconstruir** como `AppSidebar` (240px expandida / 72px recolhida) + `MobileNavigation` na paleta Clean Professional. |
| `Header` | `src/components/layout/header.tsx` | **Reconstruir** como `AppHeader` com Breadcrumbs, busca global, status do pátio, notificações e menu do usuário. |
| `VehicleSilhouette360` | `src/components/modules/vehicle-silhouette-360.tsx` | **Preservar lógica SVG e coordenadas X/Y**; atualizar superfície, botões, badges e controles para o tema claro Clean Professional. |
| `CustomerVehicleSelector` | `src/components/modules/customer-vehicle-selector.tsx` | **Preservar lógica de busca, seleção e React Portals**; atualizar estilos para cartões e inputs Clean Professional. |
| `ManageOrderServicesModal` | `src/components/modules/manage-order-services-modal.tsx` | **Preservar lógica de adição/remoção de itens**; aplicar novo `Modal` e tokens claros. |
| `TransferOrderBoxModal` | `src/components/modules/transfer-order-box-modal.tsx` | **Preservar lógica de transferência de box**; aplicar novo `Modal` e tokens claros. |
| `CustomerChecklistHistoryModal` | `src/components/modules/customer-checklist-history-modal.tsx` | **Preservar histórico de vistorias**; aplicar superfície clara e tipografia Inter. |

---

## 4. Riscos Identificados e Mitigações

1. **Classes Legadas Hardcoded (`carbon-*`, `lime-*`, `btn-engine-start`, `form-input-carbon`)**:
   - *Risco:* Algumas telas ou subcomponentes podem referenciar classes utilitárias antigas em `globals.css`.
   - *Mitigação:* Além de construir os novos componentes em `src/components/ui/`, mapearemos todas as classes utilitárias em `globals.css` e `tailwind.config.ts` para os novos tokens Clean Professional (`#F7F8F6`, `#FFFFFF`, `#247653`, `#252B27`, `#E7EAE7`), garantindo que nenhum elemento fique com fundo escuro ou texto ilegível.
2. **Modais com `clip-path`**:
   - *Risco:* O antigo `.carbon-card` possuía `clip-path: polygon(...)`, que confinava elementos `position: fixed` e cortava barras de rolagem.
   - *Mitigação:* Remover completamente `clip-path` de cartões e containers, adotando `border-radius: 12px` para cards e `16px` para modais com sombras suaves.
3. **Permissões RBAC (`ADMIN` vs `OPERATOR`)**:
   - *Risco:* Exibir acidentalmente menus administrativos ou valores financeiros para operadores durante o redesign.
   - *Mitigação:* Manter estritamente a filtragem de itens na `AppSidebar` por `role === "ADMIN"` e respeitar os campos sanitizados pelas APIs.

---

## 5. Plano Sequencial de Execução

- [x] **FASE 0:** Auditoria técnica completa e documentação em `docs/REDESIGN_AUDIT.md`.
- [ ] **FASE 1:** Fundação visual (`globals.css`, `tailwind.config.ts`, fonte `Inter`, tokens CSS, `AppSidebar` retrátil, `AppHeader` com breadcrumbs, `MobileNavigation`).
- [ ] **FASE 2:** Biblioteca de componentes `src/components/ui/` e catálogo interativo em `/design-system`.
- [ ] **FASE 3:** Protótipos navegáveis e implementação da nova tela `/agenda` integrada às ordens de serviço.
- [ ] **FASE 4:** Redesign integral de todos os módulos reais (`/login`, `/register`, `/dashboard`, `/clientes`, `/servicos`, `/vistoria`, `/orcamentos`, `/os`, `/patio`, `/boxes`, `/financeiro`, `/comissoes`, `/estoque`, `/crm`, `/funcionarios`, `/configuracoes`).
- [ ] **FASE 5:** Revisão de responsividade (Desktop, Tablet, Mobile) e acessibilidade (foco, contraste, linguagem clara para leigos).
- [ ] **FASE 6:** Execução das 6 suítes de testes automatizados (`test_phase1.ts` a `test_phase6.ts`), checagem TypeScript (`tsc --noEmit`) e build de produção.
- [ ] **FASE 7:** Documentação final (`docs/DESIGN_SYSTEM.md`, `docs/REDESIGN_IMPLEMENTATION.md`, `docs/REDESIGN_QA_REPORT.md`, `IMPLEMENTATION_CHECKLIST.md`, `PROJECT_STATUS.md`).

