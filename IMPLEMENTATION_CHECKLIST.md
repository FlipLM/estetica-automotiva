# Checklist de Implementação — Sistema SaaS de Estética Automotiva

## Módulo 01 — Dashboard Executivo
- [x] Indicador de faturamento do dia (dados reais do banco)
- [x] Indicador de faturamento dos últimos 7 dias
- [x] Indicador de faturamento mensal
- [x] Contagem de veículos no pátio por status
- [x] Ticket médio real do período
- [x] Ocultação estrita de dados financeiros para o perfil `OPERATOR`

## Módulo 02 — Clientes e Veículos
- [x] Cadastro completo de clientes (Nome, CPF/CNPJ, Telefone, WhatsApp, E-mail, Endereço)
- [x] Cadastro de veículos com vínculo ao cliente
- [x] Categorização por porte (`HATCH`, `SEDAN`, `SUV_PICKUP`, `MOTORCYCLE`, `SPECIAL_UTILITY`)
- [x] Unicidade de placa por tenant
- [x] Histórico de serviços e fotos por veículo

## Módulo 03 — Catálogo de Serviços & Matriz de Preços
- [x] Cadastro de serviços técnicos com tempo estimado e insumos
- [x] Matriz de preços dinâmica por categoria de veículo
- [x] Motor de cálculo automático de preços (`/api/pricing/calculate`)
- [x] Configuração de alíquota de comissão por serviço

## Módulo 04 — Recepção e Vistoria Digital 360º
- [x] Registro de quilometragem e nível de combustível (slider 0-100%)
- [x] Declaração de pertences e objetos de valor
- [x] Silhueta interativa em SVG para marcação 360º de avarias com coordenadas X/Y
- [x] Classificação de avarias (Riscos, Amassados, Trincas, Queimadura na pintura)
- [x] Upload de fotos da câmera com validação de tipo e tamanho
- [x] Layout de impressão/PDF da vistoria com link de compartilhamento via WhatsApp

## Módulo 05 — Orçamentos e Propostas Comerciais
- [x] Geração de orçamento com itens do catálogo e preços por categoria
- [x] Aplicação de descontos comerciais
- [x] Visualização de proposta comercial para cliente com botão WhatsApp
- [x] Conversão instantânea de orçamento em Ordem de Serviço com congelamento de preços

## Módulo 06 — Ordens de Serviço & Pátio Kanban
- [x] Numeração sequencial legível da OS (1001, 1002...)
- [x] Quadro Kanban arrastável (HTML5 Drag & Drop)
- [x] 4 Colunas operacionais: A Fazer, Em Andamento, Concluído e Entregue/Pago
- [x] Avanço rápido de status com botões diretos
- [x] Liquidação de pagamento vinculada à entrega do veículo

## Módulo 07 — Gestão Financeira, DRE & Custos
- [x] DRE Gerencial em tempo real com filtros por período
- [x] Apuração de Receita Bruta, Deduções, Receita Líquida, Custos Variáveis e Lucro Bruto
- [x] Apuração de Despesas Fixas, Lucro Líquido Real e Margem Líquida %
- [x] Cadastro e listagem de despesas por categoria
- [x] Baixa e quitação de despesas com 1 clique

## Módulo 08 — Extrato e Liquidação de Comissões
- [x] Geração automática de comissão por serviço realizado
- [x] Painel de visualização restrito para colaboradores
- [x] Painel de gestão e liquidação em lote para administradores
- [x] Geração automática de lançamento contábil no fluxo de caixa ao liquidar comissões

## Módulo 09 — Estoque de Insumos & Produtos Químicos
- [x] Cadastro de químicos, acessórios e ferramentas
- [x] Controle de saldo por mililitros (ML), litros (L), gramas (G) e unidades
- [x] Alerta visual e filtro para reposição de estoque crítico (`currentStock <= minStock`)
- [x] Movimentação atômica de entrada, saída e avaria/perda com validação de saldo insuficiente

## Módulo 10 — CRM, Retenção & Pós-Venda
- [x] Gatilho de Dias de Chuva com ofertas de serviços internos e repelência de para-brisa
- [x] Alerta de clientes sem retorno há mais de 45 dias (Prevenção de Churn)
- [x] Acompanhamento de revisão de garantia de vitrificação (150+ dias)
- [x] Pós-venda para avaliação de satisfação (1 a 3 dias)
- [x] Curva ABC automática de clientes baseada em LTV (Classes A, B e C)
- [x] Disparo direto para WhatsApp Web / App com textos personalizados

## Módulo 11 — Redesign Completo: DetailPro Clean Professional (`design/novos-designs`)
- [x] Auditoria completa de rotas, APIs e componentes (`docs/REDESIGN_AUDIT.md`)
- [x] Design Tokens oficiais e paleta clara (`#142D26`, `#247653`, `#318B63`, `#E9F3EC`, `#F7F8F6`, `#FFFFFF`)
- [x] Biblioteca centralizada de componentes UI (`src/components/ui/*`)
- [x] Catálogo interativo e protótipos navegáveis em `/design-system`
- [x] Nova página de Agenda Operacional (`/agenda`) com visões Dia, Semana e Mês
- [x] Navegação global redesenhada (Sidebar colapsável Desktop + Bottom Bar & Drawer Mobile)
- [x] Kanban Dual-View no Pátio (Visão por Status + Visão por Box Físico e Vagas)
- [x] Correção definitiva de modais aninhados via React Portal (`createPortal`) sem `clip-path`
- [x] Reformulação integral de todas as 24 páginas e modais preservando 100% das regras de negócio e testes
