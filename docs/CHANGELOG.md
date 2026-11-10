# Registro de Alterações (Changelog)

Todas as alterações relevantes do projeto são registradas neste documento.

---

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
