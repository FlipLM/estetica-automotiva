# DetailPro SaaS — Sistema de Gestão para Estética Automotiva & Detailing

Sistema SaaS Multi-tenant completo, comercialmente utilizável e de nível profissional para estéticas automotivas, estúdios de detailing, lava-jatos e centros de polimento técnico e vitrificação.

---

## 🚀 Visão Geral e Princípio de Engenharia

> **REGRA FUNDAMENTAL APLICADA: NÃO SIMULAR FUNCIONALIDADES.**  
> Todos os formulários, botões, métricas de lucratividade (DRE), comissões, movimentações de insumos, vistorias fotográficas 360º com marcação de avarias e Kanban do pátio possuem **comportamento funcional real e persistência atômica no banco de dados relacional**.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + React 18 + TypeScript | Interface reativa moderna |
| **Estilização** | Tailwind CSS + Lucide React | Design automotivo responsivo dark mode |
| **Backend & APIs** | Next.js Route Handlers (Edge & Node.js) | APIs RESTful completas com tipagem estrita |
| **Banco de Dados** | SQLite (Dev) / PostgreSQL (Produção) via Prisma ORM | Modelagem relacional multi-tenant |
| **Autenticação & RBAC** | JWT em HttpOnly Cookies + Bcrypt | Segurança rígida com papéis `ADMIN` e `OPERATOR` |
| **Validação** | Zod | Validação robusta de esquemas e entradas |

---

## 📦 Módulos Implementados

### 1. Autenticação & Isolamento Multi-tenant
- Cadastro de estéticas com geração automática de Tenant independente.
- Login seguro com expiração de sessão em Cookies HttpOnly.
- Separação rígida de papéis: `ADMIN` (acesso irrestrito) vs `OPERATOR` (acesso operacional ao pátio/OS/vistoria, bloqueio de faturamento, lucro e custos).

### 2. Dashboard Executivo & Métricas Reais
- Faturamento do dia, últimos 7 dias e mensal em tempo real.
- Contagem dinâmica de veículos no pátio e ordens por status.
- Ticket médio consolidado e lucro líquido operacional.

### 3. Clientes & Veículos (Categorização de Porte)
- Cadastro de clientes e veículos vinculados.
- Categorização técnica: Hatch/Pequeno, Sedan/Médio, SUV/Picape, Moto e Utilitário Especial.
- Histórico completo de serviços, valores pagos e fotos por veículo e placa.

### 4. Catálogo de Serviços & Matriz de Preços Dinâmica
- Preços escalonados automaticamente por porte de veículo.
- Cálculo de tempo estimado, insumos médios e alíquota de comissão por colaborador.

### 5. Recepção & Vistoria Digital 360º com Silhueta Interativa
- Silhueta interativa em SVG para marcação precisa de avarias (frente, traseira, laterais, teto, vidros).
- Classificação de avarias: Riscos, Amassados, Trincas, Queimaduras na pintura.
- Nível de combustível (slider 0-100%), registro de pertences de valor e upload de fotos da câmera.
- Impressão e compartilhamento da vistoria em layout de documento com deep link para WhatsApp.

### 6. Orçamentos & Ordens de Serviço (Kanban do Pátio)
- Criação e envio de propostas comerciais com desconto e congelamento de preços.
- Conversão de orçamento aprovado em Ordem de Serviço com 1 clique.
- Kanban arrastável em tempo real (HTML5 Drag & Drop) com 4 colunas: A Fazer, Em Andamento, Concluído e Entregue/Pago.

### 7. Gestão Financeira, DRE & Contas a Pagar
- Demonstrativo do Resultado do Exercício (DRE) gerencial apurado em tempo real:
  - `(+) Receita Bruta de Serviços`
  - `(-) Descontos Concedidos`
  - `(=) Receita Operacional Líquida`
  - `(-) Custos Variáveis (Insumos e Comissões)`
  - `(=) Lucro Bruto Operacional`
  - `(-) Despesas Fixas (Aluguel, Energia, Salários, Marketing, Manutenção)`
  - `(=) Lucro Líquido Real` com margem líquida percentual.
- Lançamento de despesas, controle de vencimentos e baixa de pagamentos com 1 clique.

### 8. Extrato e Liquidação de Comissões
- Apuração automática de comissões por colaborador baseada nos serviços executados nas ordens de serviço.
- Painel para o operador acompanhar seus próprios ganhos.
- Painel para o administrador liquidar comissões em lote com geração automática de despesa no fluxo de caixa.

### 9. Controle de Insumos & Estoque Químico
- Controle de produtos químicos e consumíveis (Shampoos, Boinas, Compostos Polidores, Ceras, Vitrificadores).
- Alerta visual e filtros para reposição de estoque crítico (`currentStock <= minStock`).
- Movimentação atômica de entrada, saída manual e perdas/avarias com histórico auditável.

### 10. CRM Inteligente & Retenção Ativa
- **Gatilho de Dias de Chuva 🌧️**: Campanhas expressas de serviços internos que não dependem do clima (higienização de estofados, oxi-sanitização e cristalização de para-brisa para repelência de chuva).
- **Alerta de Churn / Retorno (45+ dias)**: Resgate de clientes inativos com ofertas de reativação.
- **Manutenção de Vitrificação**: Acompanhamento semestral para revisão de garantia de cerâmica e grafeno.
- **Pós-Venda Automático**: Disparo de mensagens para avaliação no Google Meu Negócio de 24h a 48h após a retirada.
- **Curva ABC**: Classificação automática de clientes em Classe A (Top 70% do faturamento), Classe B e Classe C.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js 18+ instalado.
- Gerenciador de pacotes npm.

### 2. Instalação das dependências
```bash
npm install
```

### 3. Configuração do Banco de Dados
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Executar os Testes Automatizados
```bash
npx tsx test_phase1.ts
npx tsx test_phase2.ts
npx tsx test_phase3.ts
npx tsx test_phase4.ts
npx tsx test_phase5.ts
npx tsx test_phase6.ts
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse: `http://localhost:3000`

### 6. Credenciais de Acesso (Seed)
- **Administrador:** `admin@detailing.com` / `senha123`
- **Operador de Pátio:** `operador@detailing.com` / `senha123`
