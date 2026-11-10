# Changelog — DetailPro SaaS

Todas as alterações notáveis deste projeto estão documentadas neste arquivo.

## [1.0.0] - 2026-11-09

### Adicionado
- **Fase 1: Setup & Multi-tenancy**
  - Modelagem do Prisma ORM com suporte a isolamento por `tenantId`.
  - Autenticação JWT com HttpOnly Cookies e hash Bcrypt.
  - Controle de Acesso Baseado em Funções (RBAC) com papéis `ADMIN` e `OPERATOR`.
  - Layout mestre responsivo com Sidebar dinâmica e Header com dados da sessão.
  - Suíte de testes automatizados `test_phase1.ts` (6/6 aprovados).

- **Fase 2: Clientes, Veículos & Catálogo com Matriz de Preços**
  - CRUD completo de Clientes e Veículos com categorização de porte (`HATCH`, `SEDAN`, `SUV_PICKUP`, `MOTORCYCLE`, `SPECIAL_UTILITY`).
  - Catálogo de Serviços com matriz de preços e tempos estimados por porte veicular.
  - Motor de precificação dinâmica `/api/pricing/calculate`.
  - Suíte de testes automatizados `test_phase2.ts` (7/7 aprovados).

- **Fase 3: Recepção & Vistoria Digital 360º**
  - Silhueta interativa em SVG para marcação precisa de avarias com coordenadas X/Y e classificação por tipo.
  - Registro de quilometragem, nível de combustível em percentual e pertences de valor.
  - Upload de fotografias da câmera do celular (`/api/uploads`) com validação de tipo e tamanho.
  - Visualização de vistoria com layout para impressão e link direto para WhatsApp.
  - Suíte de testes automatizados `test_phase3.ts` (8/8 aprovados).

- **Fase 4: Orçamentos, Ordens de Serviço & Pátio Kanban**
  - Módulo de orçamentos com conversão em 1 clique para Ordem de Serviço com congelamento de preços históricos.
  - Quadro Kanban arrastável (HTML5 Drag & Drop) com 4 colunas operacionais.
  - Baixa de recebimento e controle de forma de pagamento na entrega do veículo.
  - Suíte de testes automatizados `test_phase4.ts` (10/10 aprovados).

- **Fase 5: Gestão Financeira, DRE, Comissões & Estoque**
  - DRE Gerencial contábil com cálculo em tempo real de Receita Líquida, Margem Bruta, Despesas Fixas e Lucro Líquido Real.
  - Lançamento e quitação de despesas operacionais.
  - Controle de insumos químicos com alertas para estoque crítico e movimentações atômicas de entrada/saída.
  - Extrato de comissões por colaborador e liquidação em lote integrada ao fluxo de caixa.
  - Suíte de testes automatizados `test_phase5.ts` (7/7 aprovados).

- **Fase 6: CRM Inteligente, Retenção & Hardening**
  - Gatilho inteligente para Dias de Chuva com ofertas de serviços de cabine interna e repelência de para-brisa.
  - Prevenção de Churn para clientes sem retorno há mais de 45 dias.
  - Acompanhamento semestral de garantia de vitrificação cerâmica.
  - Pós-venda automático de satisfação e NPS.
  - Curva ABC automática de clientes com cálculo de LTV.
  - Módulo de configurações da empresa com personalização de dados cadastrais.
  - Suíte de testes automatizados `test_phase6.ts` (5/5 aprovados).
  - Build de produção do Next.js validado com sucesso (22 rotas compiladas).
