# Status do Projeto — SaaS de Gestão para Estética Automotiva

> **Data da Última Atualização:** 09/11/2026  
> **Fase Atual:** Fase 1 — Setup, Autenticação e Multi-Tenancy (Em Início)

---

## 1. Visão Geral das Fases

| Fase | Descrição | Status | Progresso |
| :---: | :--- | :---: | :---: |
| **Fase 1** | Setup do Projeto, Banco de Dados, Autenticação, Multi-tenancy & Layout Base | 🟢 Concluída e Aprovada | 100% |
| **Fase 2** | Clientes, Veículos e Catálogo de Serviços com Matriz de Preços por Porte | 🟢 Concluída e Aprovada | 100% |
| **Fase 3** | Vistoria Digital, Checklist 360º de Avarias e Captura de Fotos | 🟢 Concluída e Aprovada | 100% |
| **Fase 4** | Orçamentos em PDF, Ordens de Serviço e Pátio Kanban em Tempo Real | 🟢 Concluída e Aprovada | 100% |
| **Fase 5** | Módulo Financeiro, Controle de Estoque/Insumos e Apuração de Comissões | ⚪ Próxima Fase | 0% |
| **Fase 3** | Vistoria Digital, Checklist 360º de Avarias e Captura de Fotos | ⚪ Não Iniciada | 0% |
| **Fase 4** | Orçamentos em PDF, Ordens de Serviço e Pátio Kanban em Tempo Real | ⚪ Não Iniciada | 0% |
| **Fase 5** | Módulo Financeiro, Controle de Estoque/Insumos e Apuração de Comissões | ⚪ Não Iniciada | 0% |
| **Fase 6** | CRM Inteligente, Campanhas para Dias de Chuva, Pós-Venda & Finalização | ⚪ Não Iniciada | 0% |

---

## 2. Detalhes da Fase 1

### Atividades Concluídas na Fase 4
- [x] Endpoints REST de Ordens de Serviço e Orçamentos (`/api/orders`, `/api/orders/[id]`).
- [x] Endpoint de Conversão de Orçamento em OS em 1 clique (`/api/orders/[id]/convert`) movendo o veículo para o Pátio.
- [x] Endpoint rápido de atualização de status do Kanban (`/api/orders/[id]/status`) com baixa financeira automática e apuração de comissão.
- [x] Interface de Orçamentos e Propostas (`/orcamentos`) com cálculo automático de preços pela categoria de porte.
- [x] Página de Proposta Comercial / PDF para Impressão (`/orcamentos/[id]`) com envio pré-formatado via WhatsApp.
- [x] Tabela Geral de Ordens de Serviço (`/os`) com filtros avançados e busca indexada.
- [x] Formulário de Entrada Direta de OS no Pátio (`/os/nova`).
- [x] Pátio Kanban Operacional Interativo (`/patio`) com suporte nativo a Drag & Drop (HTML5) e botões de 1 toque de avanço de etapa para tablets.
- [x] Modal de baixa de pagamento com seleção de métodos (PIX, Cartão de Crédito/Débito, Dinheiro).
- [x] Testes automatizados executados e 100% aprovados (`test_phase4.ts`).
- [x] Build de produção verificado com sucesso sem erros (`npm run build`).

### Atividades Concluídas na Fase 3
- [x] Endpoint de upload de fotos de vistorias (`/api/uploads`) com validação de tipo MIME e limite de tamanho.
- [x] Endpoints de Vistorias e Checklists (`/api/checklists` e `/api/checklists/[id]`) com dados de KM, combustível, pertences e aceite.
- [x] Componente Interativo de Silhueta Veicular 360º (`vehicle-silhouette-360.tsx`) com marcação de alfinetes por coordenadas X/Y e seletor de avarias (`SCRATCH`, `DENT`, `CHIP`, `PAINT_BURN`, `PEELING`, `OTHER`).
- [x] Integração de câmera do dispositivo (`capture="environment"`) para foto imediata da avaria.
- [x] Interface do Painel de Vistorias (`/vistoria`) com histórico visual e modal de recepção de veículo.
- [x] Página de Comprovante de Vistoria de Entrada (`/vistoria/[id]`) com layout para impressão e botão de compartilhamento via WhatsApp.
- [x] Testes automatizados executados e 100% aprovados (`test_phase3.ts`).
- [x] Build de produção verificado com sucesso sem erros (`npm run build`).

### Atividades Concluídas na Fase 2
- [x] CRUD completo de clientes (`/api/customers` e `/api/customers/[id]`) com busca integrada e histórico de atendimentos.
- [x] CRUD de veículos (`/api/vehicles` e `/api/vehicles/[id]`) com categorização por porte (`HATCH`, `SEDAN`, `SUV_PICKUP`, `MOTORCYCLE`, `SPECIAL_UTILITY`).
- [x] Garantia de unicidade de placa por tenant e vínculo 1:N com clientes.
- [x] Catálogo de Serviços com Matriz de Preços configurável por porte veicular (`/api/services` e `/api/services/[id]`).
- [x] Motor de Cálculo Dinâmico de Preços (`/api/pricing/calculate`) que identifica a categoria do carro e aplica a tarifa exata.
- [x] Interface de Clientes & Veículos (`/clientes`) com busca em tempo real e modal de cadastro integrado.
- [x] Interface do Catálogo de Serviços & Matriz de Preços (`/servicos`) com filtros por categoria e modal de gestão.
- [x] Testes automatizados executados e 100% aprovados (`test_phase2.ts`).
- [x] Build de produção verificado com sucesso sem erros (`npm run build`).
- [x] Criação da estrutura de diretórios e documentos de governança (`docs/`).
- [x] Inicialização da base Next.js 14+ com TypeScript, Tailwind CSS e Lucide React.
- [x] Modelagem do banco de dados relacional multi-tenant com Prisma ORM (`prisma/schema.prisma`).
- [x] Implementação do mecanismo seguro de senhas (bcrypt) e emissão de tokens JWT com Cookies HttpOnly.
- [x] Implementação dos Route Handlers de Autenticação (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`).
- [x] Criação das validações de RBAC (`ADMIN` vs `OPERATOR`) com bloqueio de acesso a dados financeiros no backend.
- [x] Construção do Layout Base responsivo com Sidebar expansível e navegação por perfil.
- [x] Tela de Login e Tela de Cadastro de Nova Empresa (Tenant).
- [x] Script de Seed com Tenant de demonstração e usuários para testes (`admin@detailing.com` e `operador@detailing.com`).
- [x] Testes automatizados executados e 100% aprovados (`test_phase1.ts`).
- [x] Build de produção verificado com sucesso (`npm run build`).

---

## 3. Riscos e Mitigações Identificados

| Risco | Impacto | Estratégia de Mitigação |
| :--- | :---: | :--- |
| **Vazamento de dados entre empresas (Cross-tenant leak)** | Crítico | Inclusão de `tenant_id` obrigatório em todo schema e middleware centralizado que injeta o tenant autenticado a partir do token de sessão. |
| **Operador visualizar dados financeiros via API** | Alto | Validação de perfil no Route Handler do backend (não apenas ocultando botões no frontend). Se `user.role !== 'ADMIN'`, a API retorna `403 Forbidden`. |
| **Problemas de performance com muitas OS simultâneas** | Médio | Índices adequados no banco de dados para `(tenant_id, status)` e `(tenant_id, plate)`. |
| **Dependência de serviços externos no ambiente local** | Baixo | Uso de SQLite com Prisma para dev local instantâneo, compatível via migração direta com PostgreSQL para ambiente de produção. |

---

## 4. Próxima Ação Imediata
Executar a inicialização do pacote Next.js 14+ com TypeScript e as dependências essenciais de desenvolvimento.
