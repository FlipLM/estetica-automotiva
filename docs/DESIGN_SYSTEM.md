# DetailPro — Clean Professional Design System

**Versão:** 2.0.0  
**Branch:** `design/novos-designs`  
**Rota de Catálogo Interativo:** `/design-system`

---

## 1. Filosofia Visual

A identidade **DetailPro — Clean Professional** foi desenhada especificamente para softwares SaaS de gestão operacional automotiva. Seus pilares são:

1. **Predominância Clara e Alto Contraste:** Fundo geral `#F7F8F6` e superfícies `#FFFFFF`, garantindo leitura confortável tanto em escritórios administrativos quanto em tablets utilizados sob iluminação intensa de pátio/cabine de polimento.
2. **Identidade Verde Automotiva Sofisticada:** Uso intencional do verde institucional (`#142D26` profundo e `#247653` principal) em elementos de navegação ativa, ações primárias e destaques de marca.
3. **Semântica Estrita:** Cores de alerta (`#16A36A`, `#2563EB`, `#D97706`, `#DC4C4C`) reservadas exclusivamente para estados operacionais e feedbacks reais.
4. **Geometria Limpa (Zero Chamfers):** Cards com `border-radius: 12px`, botões e inputs com `8px`, e modais com `16px` renderizados via `createPortal(..., document.body)` sem recortes `clip-path`.

---

## 2. Design Tokens Oficiais

### 2.1. Paleta de Cores (`src/app/globals.css` & `tailwind.config.ts`)

| Token / Uso | Hexadecimal | Aplicação Principal |
|---|---|---|
| **Verde Profundo** | `#142D26` | Textos de destaque sobre fundo verde suave, estado active de botões |
| **Verde Principal** | `#247653` | Botões primários (`Primary`), links ativos, indicadores principais |
| **Verde Secundário** | `#318B63` | Estado hover de botões primários e realces secundários |
| **Verde Suave** | `#E9F3EC` | Fundo de item ativo na Sidebar, badges da marca e ícones de destaque |
| **Fundo Geral** | `#F7F8F6` | Background principal da aplicação (`body` e área de conteúdo) |
| **Superfície** | `#FFFFFF` | Fundo de cards, tabelas, modais, drawers e barra superior |
| **Superfície Sutil** | `#F1F3F1` | Cabeçalhos de tabela, colunas de Kanban, abas inativas |
| **Bordas** | `#E7EAE7` | Divisórias de tabelas, bordas de cards e inputs em repouso |
| **Texto Principal** | `#252B27` | Títulos, valores numéricos, nomes de clientes e veículos |
| **Texto Secundário** | `#737D75` | Subtítulos, descrições, rótulos auxiliares e metadados |
| **Texto Auxiliar** | `#9CA49E` | Placeholders de formulário e ícones neutros |
| **Grafite** | `#343C36` | Textos enfatizados secundários |

### 2.2. Cores Semânticas Funcionais

| Significado | Cor Principal | Superfície Suave | Borda |
|---|---|---|---|
| **Sucesso / Concluído / Pago** | `#16A36A` | `#ECFDF5` | `#A7F3D0` |
| **Informação / Em Execução** | `#2563EB` | `#EFF6FF` | `#BFDBFE` |
| **Atenção / Fila / Pendente** | `#D97706` | `#FFFBEB` | `#FDE68A` |
| **Erro / Crítico / Lotado** | `#DC4C4C` | `#FEF2F2` | `#FECACA` |

### 2.3. Tipografia

- **Fonte Principal:** `Inter` (`--font-sans`)
- **Fonte Monoespaçada (Placas Mercosul e Códigos):** `JetBrains Mono` (`--font-mono`)
- **Escala:**
  - Título de Página (`PageHeader`): `22px–26px`, peso `700`
  - Título de Seção: `18px`, peso `600`
  - Título de Card: `15px`, peso `600`
  - Texto Principal / Inputs: `14px`, peso `400` / `500`
  - Texto Secundário / Tabelas: `13px`
  - Informações Auxiliares / Badges: `12px`

---

## 3. Biblioteca de Componentes (`src/components/ui/`)

Todos os componentes são exportados centralizadamente por `src/components/ui/index.ts`:

### 3.1. Botões (`src/components/ui/button.tsx`)
- `Button`: Variantes `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`; tamanhos `sm`, `md`, `lg`; suporte a `loading`/`isLoading`, `leftIcon`, `rightIcon` e `fullWidth`.
- `IconButton`: Botão quadrado com `aria-label` obrigatório para ações rápidas em tabelas e cabeçalhos.
- `ButtonGroup`: Agrupador visual para alternadores de visão.

### 3.2. Status e Badges (`src/components/ui/badge.tsx`)
- `Badge`: Variantes `default`, `brand`, `success`, `info`, `warning`, `error`, `neutral`, `outline`, com indicador `dot` opcional.
- `OrderStatusBadge` / `StatusBadge`: Mapeia automaticamente os status reais do banco (`BUDGET_PENDING`, `BUDGET_APPROVED`, `TODO`, `IN_PROGRESS`, `DONE`, `PAID`, `CANCELLED`) para rótulos claros em português.

### 3.3. Cards e Indicadores (`src/components/ui/card.tsx`)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- `StatCard`: Card padronizado de KPI executivo com ícone, valor principal, subtítulo e tendência.
- `InfoCard`: Card informativo com ícone, título, descrição e ação contextual.

### 3.4. Formulários (`src/components/ui/form.tsx`)
- `FormField` e `FormSection`: Estruturação semântica com suporte a `label`, `description`, `error` e `required`.
- `Input`: Suporte integrado a rótulo, dica (`hint`/`description`), erro, `leftIcon` e `rightElement`.
- `Select`: Suporte a `options` ou `<option>` filhos com estilo unificado.
- `Textarea`: Campo multilinha padronizado.
- `SearchInput`: Busca com ícone de lupa e botão de limpeza rápida (`onClear`).
- `Checkbox` e `Switch`: Seletores booleanos acessíveis com suporte a descrição auxiliar.

### 3.5. Feedback e Sobreposição (`src/components/ui/feedback.tsx`)
- `Modal`: Renderizado via `createPortal(..., document.body)` com `border-radius: 16px`, tamanhos `sm`, `md`, `lg`, `xl`, garantindo zero problemas de corte em containers pais.
- `Drawer`: Painel lateral deslizante para detalhes contextuais.
- `Alert`: Avisos contextuais (`info`, `success`, `warning`, `error`).
- `EmptyState`: Estado vazio orientativo com ícone, mensagem explicativa e botão de ação imediata.
- `LoadingState` e `Skeleton`: Indicadores de carregamento suaves.
- `ProgressBar`: Barra de progresso semântica para ocupação de boxes e metas.
- `ConfirmationDialog`: Diálogo de confirmação para ações críticas.

### 3.6. Navegação e Estrutura (`src/components/ui/navigation.tsx` & `table.tsx`)
- `PageHeader` e `Breadcrumbs`: Cabeçalho padronizado no topo de todas as páginas.
- `Tabs`: Navegação horizontal em abas com contador opcional.
- `TableContainer`, `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`, `Pagination`.
