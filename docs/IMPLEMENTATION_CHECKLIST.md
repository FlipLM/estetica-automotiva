# Checklist Detalhado de Implementação

> Status:
> - `[ ] Não Iniciada`
> - `[🟡] Em Desenvolvimento`
> - `[x] Implementada, Testada e Aprovada`

---

## FASE 1 — Setup, Autenticação e Multi-Tenancy

- [x] **Ambiente & Arquitetura Base**
  - [x] Inspecionar ambiente de desenvolvimento (Node.js, npm, git)
  - [x] Estruturar pasta de documentação e governança (`docs/`)
  - [x] Inicializar projeto Next.js 14+ com App Router e TypeScript
  - [x] Configurar Tailwind CSS e componentes base de UI
  - [x] Configurar ícones Lucide React
- [x] **Banco de Dados & Multi-tenancy**
  - [x] Modelar schema completo do Prisma (`prisma/schema.prisma`)
  - [x] Configurar migrations versionadas e sincronização de banco
  - [x] Garantir campos `tenantId` em todas as tabelas operacionais com índices
  - [x] Criar script de Seed com tenant de teste e usuários
- [x] **Autenticação Segura & RBAC**
  - [x] Função de hash seguro de senhas com bcrypt
  - [x] Emissão e validação de JWTs criptografados
  - [x] Armazenamento em Cookie HttpOnly com flags de segurança
  - [x] Endpoint `/api/auth/register` (Cadastro de nova empresa + usuário admin)
  - [x] Endpoint `/api/auth/login` (Autenticação com e-mail e senha)
  - [x] Endpoint `/api/auth/me` (Dados do usuário logado e tenant)
  - [x] Endpoint `/api/auth/logout` (Revogação de cookie)
  - [x] Bloqueio no backend para operadores tentando acessar dados financeiros
- [x] **Interface & Layout Base**
  - [x] Tela de Login profissional com identidade visual automotiva
  - [x] Tela de Registro de Nova Empresa
  - [x] Layout protegido com Sidebar retrátil responsiva (Desktop / Tablet / Mobile)
  - [x] Menu dinâmico baseado no perfil do usuário (`ADMIN` vs `OPERATOR`)
  - [x] Cabeçalho com identificação do usuário, empresa e botão de logout
  - [x] Dashboard inicial estruturado consumindo dados reais de `/api/dashboard/stats`
  - [x] Pátio Kanban inicial com cards e colunas operacionais reais

---

## FASE 2 — Clientes, Veículos e Catálogo de Serviços

- [x] **Módulo de Clientes**
  - [x] CRUD completo de clientes com validação Zod
  - [x] Histórico de visitas e serviços realizados
  - [x] Filtro rápido por nome, telefone e CPF/CNPJ
- [x] **Módulo de Veículos**
  - [x] CRUD de veículos com validação de placa
  - [x] Categorização por porte (Hatch, Sedan, SUV/Picape, Moto, Especial)
  - [x] Vínculo 1:N entre cliente e veículos
  - [x] Validação de unicidade de placa por tenant
- [x] **Catálogo de Serviços & Matriz de Preços**
  - [x] Cadastro de serviços com tempo estimado, insumos e comissão
  - [x] Matriz de preços configurável por categoria de veículo
  - [x] Cálculo automático de preço ao selecionar veículo + serviço (`/api/pricing/calculate`)
  - [x] Proteção RBAC (apenas ADMIN pode editar a tabela de preços)

---

## FASE 3 — Vistoria Digital e Checklist 360º

- [x] **Recepção de Veículos**
  - [x] Formulário ágil de entrada com registro de km e nível de combustível (slider 0-100%)
  - [x] Registro de pertences declarados no interior do carro
- [x] **Checklist Visual 360º de Avarias**
  - [x] Interface gráfica com silhueta veicular por áreas (Frente, Traseira, Laterais, Teto, Vidros)
  - [x] Marcação interativa de coordenadas X/Y de avarias (Riscos, Amassados, Trincas, Queimaduras de verniz)
  - [x] Captura de fotografias via câmera do celular/tablet integrada com upload (`/api/uploads`)
- [x] **Emissão do Comprovante de Entrada**
  - [x] Geração e visualização do documento de vistoria formatado para impressão (`/vistoria/[id]`)
  - [x] Botão de compartilhamento do comprovante diretamente no WhatsApp do cliente
  - [x] Carimbo digital de confirmação de entrada e data/hora do aceite

---

## FASE 4 — Orçamentos, Ordens de Serviço e Pátio Kanban

- [x] **Módulo de Orçamentos**
  - [x] Construtor de propostas comerciais com seleção de serviços e pacotes
  - [x] Emissão de proposta / PDF profissional com logo, dados da empresa e valores (`/orcamentos/[id]`)
  - [x] Botão "Converter em OS" em 1 clique (`/api/orders/[id]/convert`) com preservação de valores congelados
- [x] **Pátio Kanban Operacional**
  - [x] Colunas: *Para Fazer*, *Em Serviço*, *Concluídos*, *Pagos*
  - [x] Cards ricos com placa, cliente, tempo de espera e colaborador responsável
  - [x] Drag-and-drop persistente no banco de dados e botões de 1 toque para tablets na pista
  - [x] Suporte a múltiplas OS simultâneas em execução
- [x] **Apontamento de Execução & Baixa**
  - [x] Início (`startedAt`), conclusão (`completedAt`) e liquidação financeira (`paidAt`)
  - [x] Modal de baixa de pagamento com formas de pagamento integradas (PIX, Cartão, Dinheiro)

---

## FASE 5 — Financeiro, Estoque e Comissões

- [ ] **Gestão Financeira & DRE**
  - [ ] Registro de receitas e múltiplos meios de pagamento (PIX, Cartão, Dinheiro)
  - [ ] Lançamento de despesas categorizadas (Produtos, Salários, Aluguel, etc.)
  - [ ] DRE gerencial com cálculo real de Ticket Médio e Margem Líquida
- [ ] **Controle de Estoque de Insumos**
  - [ ] Cadastro de produtos químicos e consumíveis com estoque mínimo
  - [ ] Movimentações de entrada, saída e consumo por OS
- [ ] **Apuração de Comissões**
  - [ ] Regras de comissão por colaborador e tipo de serviço
  - [ ] Extrato individual de comissões pendentes e pagas

---

## FASE 6 — CRM, Retenção e Finalização

- [ ] **CRM Ativo & Reativação**
  - [ ] Segmentação de clientes e Curva ABC de faturamento
  - [ ] Campanhas para dias de chuva com serviços internos
  - [ ] Lembretes de manutenção periódica (vitrificação e lavagem técnica)
- [ ] **Pós-Venda via WhatsApp**
  - [ ] Disparo de pesquisa de satisfação e feedback
- [ ] **Auditoria & Preparação para Produção**
  - [ ] Testes de regressão ponta a ponta
  - [ ] Auditoria de segurança contra injeção e isolamento multi-tenant
  - [ ] Documentação de deploy e entrega
