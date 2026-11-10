"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Palette,
  Layers,
  LayoutGrid,
  CheckCircle2,
  Car,
  Wrench,
  DollarSign,
  Users,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  ArrowRight,
  Sparkles,
  Camera,
  Kanban,
  FileSpreadsheet,
  Package,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  IconButton,
  ButtonGroup,
  Badge,
  OrderStatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  InfoCard,
  Input,
  Select,
  Textarea,
  SearchInput,
  Checkbox,
  Switch,
  Modal,
  Drawer,
  Alert,
  EmptyState,
  Skeleton,
  ProgressBar,
  PageHeader,
  Tabs,
  Pagination,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

export default function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState("tokens");
  const [searchDemo, setSearchDemo] = useState("");
  const [checkDemo, setCheckDemo] = useState(true);
  const [switchDemo, setSwitchDemo] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pageDemo, setPageDemo] = useState(1);
  const [protoScreen, setProtoScreen] = useState("dashboard");

  const mainColors = [
    { name: "Verde Profundo", hex: "#142D26", role: "Identidade / Contraste Forte" },
    { name: "Verde Principal", hex: "#247653", role: "Ações Primárias / Destaque" },
    { name: "Verde Secundário", hex: "#318B63", role: "Hover / Elementos Ativos" },
    { name: "Verde Suave", hex: "#E9F3EC", role: "Fundos de Destaque / Seleção" },
    { name: "Fundo Geral", hex: "#F7F8F6", role: "Background da Aplicação" },
    { name: "Superfície", hex: "#FFFFFF", role: "Cards, Tabelas e Modais" },
    { name: "Bordas", hex: "#E7EAE7", role: "Divisores e Contornos" },
    { name: "Texto Principal", hex: "#252B27", role: "Títulos e Leitura Principal" },
    { name: "Texto Secundário", hex: "#737D75", role: "Subtítulos e Legendas" },
  ];

  const semanticColors = [
    { name: "Sucesso", hex: "#16A36A", bg: "#ECFDF5", label: "Concluído / Pago" },
    { name: "Informação", hex: "#2563EB", bg: "#EFF6FF", label: "Em Andamento" },
    { name: "Atenção", hex: "#D97706", bg: "#FFFBEB", label: "Aguardando / Alerta" },
    { name: "Erro", hex: "#DC4C4C", bg: "#FEF2F2", label: "Crítico / Cancelado" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Sistema", href: "/dashboard" },
          { label: "Design System & Protótipos" },
        ]}
        title="DetailPro — Clean Professional"
        description="Catálogo vivo de tokens visuais, biblioteca de componentes reutilizáveis e protótipos navegáveis do SaaS."
        badge={<Badge variant="brand" dot>Versão 2.0 Clean</Badge>}
        actions={
          <Link href="/dashboard">
            <Button variant="outline" rightIcon={<ExternalLink className="w-4 h-4" />}>
              Ir para o Dashboard Real
            </Button>
          </Link>
        }
      />

      <Tabs
        tabs={[
          { id: "tokens", label: "1. Design Tokens & Paleta", icon: <Palette className="w-4 h-4" /> },
          { id: "components", label: "2. Biblioteca de Componentes", icon: <Layers className="w-4 h-4" /> },
          { id: "prototypes", label: "3. Protótipos Navegáveis", icon: <LayoutGrid className="w-4 h-4" /> },
        ]}
        activeTab={activeSection}
        onChange={setActiveSection}
      />

      {/* =====================================================================
          ABA 1: DESIGN TOKENS, PALETA E TIPOGRAFIA
         ===================================================================== */}
      {activeSection === "tokens" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Paleta Oficial — Clean Professional</CardTitle>
                <CardDescription>
                  Identidade clara, neutra e sofisticada. O verde (#247653) guia as ações principais sem sobrecarregar a leitura.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {mainColors.map((c) => (
                  <div
                    key={c.hex}
                    className="flex items-center gap-3.5 p-3 rounded-[10px] border border-[#E7EAE7] bg-[#F7F8F6]/50"
                  >
                    <div
                      className="w-12 h-12 rounded-[8px] border border-[#D5DBD5] shrink-0 shadow-2xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#252B27]">{c.name}</p>
                      <p className="text-[12px] font-mono text-[#247653] font-semibold">{c.hex}</p>
                      <p className="text-[12px] text-[#737D75] truncate">{c.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-[#E7EAE7]">
                <h4 className="text-[14px] font-semibold text-[#252B27] mb-3">
                  Cores Semânticas Funcionais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {semanticColors.map((s) => (
                    <div
                      key={s.name}
                      className="p-3.5 rounded-[10px] border border-[#E7EAE7] flex items-center justify-between"
                      style={{ backgroundColor: s.bg }}
                    >
                      <div>
                        <p className="text-[14px] font-semibold" style={{ color: s.hex }}>
                          {s.name}
                        </p>
                        <p className="text-[12px] text-[#737D75]">{s.label}</p>
                      </div>
                      <span
                        className="text-[12px] font-mono font-semibold px-2 py-1 rounded bg-white border border-[#E7EAE7]"
                        style={{ color: s.hex }}
                      >
                        {s.hex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tipografia */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Tipografia — Fonte Inter</CardTitle>
                  <CardDescription>
                    Escala clara e legível para operadores de pátio e gestores.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pb-3 border-b border-[#F1F3F1] flex items-baseline justify-between gap-4">
                  <span className="text-[26px] font-bold text-[#252B27]">Título de Página</span>
                  <span className="text-[12px] font-mono text-[#737D75]">26px / 700</span>
                </div>
                <div className="pb-3 border-b border-[#F1F3F1] flex items-baseline justify-between gap-4">
                  <span className="text-[18px] font-semibold text-[#252B27]">Título de Seção</span>
                  <span className="text-[12px] font-mono text-[#737D75]">18px / 600</span>
                </div>
                <div className="pb-3 border-b border-[#F1F3F1] flex items-baseline justify-between gap-4">
                  <span className="text-[15px] font-semibold text-[#252B27]">Título de Card</span>
                  <span className="text-[12px] font-mono text-[#737D75]">15px / 600</span>
                </div>
                <div className="pb-3 border-b border-[#F1F3F1] flex items-baseline justify-between gap-4">
                  <span className="text-[14px] font-normal text-[#252B27]">
                    Texto principal de leitura cotidiana
                  </span>
                  <span className="text-[12px] font-mono text-[#737D75]">14px / 400</span>
                </div>
                <div className="pb-3 border-b border-[#F1F3F1] flex items-baseline justify-between gap-4">
                  <span className="text-[13px] text-[#737D75]">
                    Texto secundário de apoio e descrições
                  </span>
                  <span className="text-[12px] font-mono text-[#737D75]">13px / 400</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[12px] text-[#737D75]">
                    Informações auxiliares, datas e legendas
                  </span>
                  <span className="text-[12px] font-mono text-[#737D75]">12px / 500</span>
                </div>
              </CardContent>
            </Card>

            {/* Bordas, Superfícies e Espaçamentos */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Superfícies, Raios e Escala 4px</CardTitle>
                  <CardDescription>
                    Geometria limpa sem chanfros decorativos que prejudiquem a usabilidade.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F7F8F6] border border-[#E7EAE7] rounded-[8px]">
                    <p className="text-[13px] font-semibold text-[#252B27]">Botões & Inputs</p>
                    <p className="text-[12px] text-[#737D75]">border-radius: 8px</p>
                  </div>
                  <div className="p-3 bg-[#F7F8F6] border border-[#E7EAE7] rounded-[12px]">
                    <p className="text-[13px] font-semibold text-[#252B27]">Cards & Tabelas</p>
                    <p className="text-[12px] text-[#737D75]">border-radius: 12px</p>
                  </div>
                  <div className="p-3 bg-[#F7F8F6] border border-[#E7EAE7] rounded-[16px]">
                    <p className="text-[13px] font-semibold text-[#252B27]">Modais & Diálogos</p>
                    <p className="text-[12px] text-[#737D75]">border-radius: 16px</p>
                  </div>
                  <div className="p-3 bg-[#F7F8F6] border border-[#E7EAE7] rounded-[8px] flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#252B27]">Placa Veicular</p>
                      <p className="text-[12px] text-[#737D75]">Padrão Mercosul</p>
                    </div>
                    <span className="mercosul-plate text-xs">BRA2E19</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[13px] font-semibold text-[#252B27] mb-2">
                    Escala de Espaçamento (Múltiplos de 4px)
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] font-mono text-[#247653]">
                    {[4, 8, 12, 16, 24, 32].map((px) => (
                      <span
                        key={px}
                        className="px-2.5 py-1 rounded bg-[#E9F3EC] border border-[#C5E2CE] font-semibold"
                      >
                        {px}px
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 2: BIBLIOTECA DE COMPONENTES REUTILIZÁVEIS
         ===================================================================== */}
      {activeSection === "components" && (
        <div className="space-y-6">
          {/* Botões */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Botões e Ações</CardTitle>
                <CardDescription>
                  Variantes semânticas com verbos claros e tamanhos padronizados (sm, md, lg).
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Nova Ordem de Serviço
                </Button>
                <Button variant="secondary">Aprovar Orçamento</Button>
                <Button variant="outline">Filtrar Período</Button>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
                  Excluir Registro
                </Button>
                <Button variant="primary" loading>
                  Salvando...
                </Button>
              </div>

              <div className="pt-3 border-t border-[#F1F3F1] flex flex-wrap items-center gap-3">
                <Button size="sm" variant="outline">
                  Tamanho Pequeno (sm)
                </Button>
                <Button size="md" variant="outline">
                  Tamanho Padrão (md)
                </Button>
                <Button size="lg" variant="outline">
                  Tamanho Grande (lg)
                </Button>
                <IconButton label="Editar item" variant="outline">
                  <Edit3 className="w-4 h-4" />
                </IconButton>
              </div>
            </CardContent>
          </Card>

          {/* Badges e Status */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Badges e Status Operacionais</CardTitle>
                <CardDescription>
                  Mapeamento direto dos status reais do banco de dados para cores semânticas.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <OrderStatusBadge status="BUDGET_PENDING" />
                <OrderStatusBadge status="BUDGET_APPROVED" />
                <OrderStatusBadge status="TODO" />
                <OrderStatusBadge status="IN_PROGRESS" />
                <OrderStatusBadge status="DONE" />
                <OrderStatusBadge status="PAID" />
                <OrderStatusBadge status="CANCELLED" />
              </div>
            </CardContent>
          </Card>

          {/* Formulários */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Campos de Formulário e Controles</CardTitle>
                <CardDescription>
                  Inputs acessíveis com label, texto de ajuda, estados de foco e validação.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Nome do Cliente"
                  required
                  placeholder="Ex: Carlos Eduardo Silva"
                  description="Nome completo para nota e garantia"
                />
                <Select label="Porte do Veículo" required defaultValue="SEDAN">
                  <option value="HATCH">Hatch (Pequeno)</option>
                  <option value="SEDAN">Sedan (Médio)</option>
                  <option value="SUV_PICKUP">SUV / Caminhonete</option>
                </Select>
                <div>
                  <label className="block text-[13px] font-medium text-[#252B27] mb-1.5">
                    Busca Instantânea
                  </label>
                  <SearchInput
                    value={searchDemo}
                    onChange={setSearchDemo}
                    placeholder="Buscar placa ou cliente..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Exemplo com Validação de Erro"
                  defaultValue="Placa inválida"
                  error="Informe uma placa válida no padrão Mercosul (ABC1D23)."
                />
                <div className="flex flex-col justify-center gap-3 p-3 rounded-[10px] bg-[#F7F8F6] border border-[#E7EAE7]">
                  <Checkbox
                    checked={checkDemo}
                    onChange={setCheckDemo}
                    label="Enviar comprovante de vistoria por WhatsApp"
                  />
                  <Switch
                    checked={switchDemo}
                    onChange={setSwitchDemo}
                    label="Notificar cliente quando o veículo estiver pronto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Indicadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Faturamento do Mês"
              value="R$ 28.450,00"
              tone="brand"
              icon={<DollarSign className="w-5 h-5" />}
              subtitle="Meta mensal: R$ 35.000"
              trend={{ value: "+14%", positive: true }}
            />
            <StatCard
              label="Veículos no Pátio"
              value="6 carros"
              tone="info"
              icon={<Car className="w-5 h-5" />}
              subtitle="4 vagas disponíveis"
            />
            <StatCard
              label="Serviços Concluídos"
              value="42 OS"
              tone="success"
              icon={<CheckCircle2 className="w-5 h-5" />}
              subtitle="100% dentro do prazo"
            />
            <StatCard
              label="Ticket Médio"
              value="R$ 677,38"
              tone="warning"
              icon={<Wrench className="w-5 h-5" />}
              subtitle="Vitrificação + Polimento"
            />
          </div>

          {/* Alertas, Modais, Drawers e Progresso */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Feedback, Diálogos, Tabelas e Estados Vazios</CardTitle>
                <CardDescription>
                  Componentes de comunicação clara com o usuário.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                  Testar Modal
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
                  Testar Drawer Lateral
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Alert variant="success" title="Informações salvas com sucesso!">
                  A Ordem de Serviço #1042 foi registrada e alocada no Box 01.
                </Alert>
                <Alert variant="warning" title="Atenção ao estoque mínimo">
                  O insumo Composto Polidor Menzerna atingiu 200ml (abaixo do mínimo de 300ml).
                </Alert>
              </div>

              <ProgressBar
                label="Ocupação dos Boxes da Oficina (3 de 5 vagas ocupadas)"
                value={60}
                showLabel
              />

              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>OS</TableHead>
                    <TableHead>Veículo / Placa</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço Principal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">#1042</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="mercosul-plate text-xs">PAX9B41</span>
                        <span className="font-medium">Porsche Macan T</span>
                      </div>
                    </TableCell>
                    <TableCell>Camila Fernandes</TableCell>
                    <TableCell>Vitrificação Cerâmica 9H</TableCell>
                    <TableCell>
                      <OrderStatusBadge status="IN_PROGRESS" />
                    </TableCell>
                    <TableCell className="text-right font-semibold">R$ 1.850,00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Pagination
                currentPage={pageDemo}
                totalPages={3}
                totalItems={28}
                onPageChange={setPageDemo}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* =====================================================================
          ABA 3: PROTÓTIPOS NAVEGÁVEIS DOS MÓDULOS
         ===================================================================== */}
      {activeSection === "prototypes" && (
        <div className="space-y-6">
          <Alert variant="info" title="Ambiente de Prototipação Navegável">
            Selecione qualquer módulo abaixo para inspecionar sua arquitetura visual ou clique em{" "}
            <strong>&quot;Abrir Tela Real&quot;</strong> para operar com os dados reais do banco.
          </Alert>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: "dashboard", name: "1. Dashboard", href: "/dashboard", icon: LayoutGrid },
              { id: "agenda", name: "2. Agenda", href: "/agenda", icon: Calendar },
              { id: "clientes", name: "3. Clientes & Frota", href: "/clientes", icon: Users },
              { id: "vistoria", name: "4. Vistoria 360º", href: "/vistoria", icon: Camera },
              { id: "orcamentos", name: "5. Orçamentos", href: "/orcamentos", icon: FileSpreadsheet },
              { id: "os", name: "6. Ordens de Serviço", href: "/os", icon: Wrench },
              { id: "patio", name: "7. Kanban do Pátio", href: "/patio", icon: Kanban },
              { id: "financeiro", name: "8. Financeiro & DRE", href: "/financeiro", icon: DollarSign },
              { id: "estoque", name: "9. Estoque", href: "/estoque", icon: Package },
              { id: "crm", name: "10. CRM & Retenção", href: "/crm", icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              const active = protoScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProtoScreen(item.id)}
                  className={`p-3.5 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    active
                      ? "bg-[#E9F3EC] border-[#247653] text-[#142D26] shadow-xs"
                      : "bg-white border-[#E7EAE7] text-[#252B27] hover:border-[#D5DBD5]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-[#247653]" : "text-[#737D75]"}`} />
                  <span className="text-[13px] font-semibold">{item.name}</span>
                </button>
              );
            })}
          </div>

          <Card padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-[#E7EAE7]">
              <div>
                <Badge variant="brand" dot className="mb-1.5">
                  Protótipo Validado & Integrado
                </Badge>
                <h3 className="text-[20px] font-bold text-[#252B27]">
                  Fluxo Operacional: {protoScreen.toUpperCase()}
                </h3>
                <p className="text-[13px] text-[#737D75]">
                  Interface construída com a paleta Clean Professional, botões explícitos para leigos e responsividade Mobile/Tablet/Desktop.
                </p>
              </div>
              <Link href={`/${protoScreen}`}>
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Abrir Tela Real (/{protoScreen})
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                title="Hierarquia Visual Limpa"
                description="Títulos em 26px/18px, cartões brancos sobre fundo #F7F8F6 e contraste confortável para uso prolongado."
                icon={<CheckCircle2 className="w-5 h-5" />}
              />
              <InfoCard
                title="Linguagem para Leigos"
                description="Ações diretas como 'Registrar pagamento', 'Iniciar serviço' e 'Nova vistoria' sem jargões técnicos."
                icon={<Users className="w-5 h-5" />}
              />
              <InfoCard
                title="Regras de Negócio Intactas"
                description="Integração 100% preservada com Prisma ORM, cálculo de preços por porte, DRE e isolamento Multi-tenant."
                icon={<Layers className="w-5 h-5" />}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Demonstração */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Exemplo de Janela Modal (16px radius)"
        description="Renderizado via React Portal diretamente no document.body."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirmar Ação
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[14px] text-[#252B27]">
          <p>
            Este modal segue os padrões de acessibilidade e geometria do Design System DetailPro Clean Professional.
          </p>
          <Input label="Observação Rápida" placeholder="Digite um teste..." />
        </div>
      </Modal>

      {/* Drawer de Demonstração */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Painel Lateral (Drawer)"
        description="Ideal para filtros avançados ou visualização rápida de detalhes."
        footer={
          <Button variant="primary" fullWidth onClick={() => setDrawerOpen(false)}>
            Fechar Painel
          </Button>
        }
      >
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title="Painel Deslizante Funcional"
          description="Utilize este padrão para exibir históricos ou detalhes sem sair da tela atual."
        />
      </Drawer>
    </div>
  );
}
