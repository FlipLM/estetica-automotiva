# Problemas Conhecidos e Limitações

Este documento registra problemas identificados, limitações arquiteturais temporárias e integrações externas que necessitam de credenciais ou ambiente específico.

---

## 1. Limitações Conhecidas de Fase

| Item | Módulo / Funcionalidade | Descrição / Estado Atual | Ação Prevista |
| :---: | :--- | :--- | :--- |
| **01** | Integração WhatsApp | O envio de mensagens diretas utiliza deep linking via protocolo oficial `https://wa.me/` com mensagens e parâmetros pré-codificados. Não utiliza API oficial paga da Meta Cloud API neste estágio. | Mantido como link direto rápido funcional em todas as telas de OS, vistoria e orçamento. |
| **02** | Banco de Dados Local | Configurado para SQLite via Prisma no ambiente de desenvolvimento para garantir funcionamento imediato sem necessidade de configurar serviço externo. | Modelagem 100% agnóstica para transição direta para PostgreSQL em produção através de troca da string `DATABASE_URL`. |
| **03** | Assinatura de Vistoria | A confirmação digital do checklist registra carimbo de data, hora e IP do responsável, sem certificado digital ICP-Brasil. | Em conformidade com o Prompt Mestre (não apresentar como assinatura digital certificada). |

