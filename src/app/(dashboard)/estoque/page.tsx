"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Layers,
  TrendingDown,
  Pencil,
  Trash2,
  FileBarChart2,
  RotateCcw,
  Lock,
  CheckCircle2,
  Clock,
  BarChart3,
  Eye,
  Search,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import {
  Button,
  Badge,
  StatCard,
  PageHeader,
  Modal,
  Alert,
  EmptyState,
  LoadingState,
  Input,
  Select,
  SearchInput,
  ProgressBar,
} from "@/components/ui";

interface StockMovement {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "LOSS" | "OS_CONSUMPTION";
  quantity: number;
  unitCost?: number | null;
  totalCost?: number | null;
  reason?: string | null;
  recovered?: boolean;
  recoveredAt?: string | null;
  createdAt: string;
}

interface ProductStats {
  entriesCount: number;
  totalInQty: number;
  totalInSpent: number;
  outputsCount: number;
  totalOutQty: number;
  totalOutValue: number;
  lossesCount: number;
  activeLossesCount: number;
  totalLossQty: number;
  totalLossValue: number;
}

interface Product {
  id: string;
  name: string;
  category: "CHEMICAL" | "ACCESSORY" | "TOOL";
  unit: "ML" | "L" | "G" | "KG" | "UN";
  currentStock: number;
  minStock: number;
  costPrice: number;
  averageUnitCost: number;
  supplier?: string | null;
  purchasedAt?: string | null;
  createdAt: string;
  isLowStock: boolean;
  totalInventoryValue: number;
  stats: ProductStats;
  movements: StockMovement[];
}

interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  totalInventoryValue: number;
  totalSpentEntries: number;
  totalConsumedValue: number;
  totalLossValue: number;
}

interface TopExpenseProduct {
  id: string;
  name: string;
  category: "CHEMICAL" | "ACCESSORY" | "TOOL";
  unit: string;
  supplier?: string | null;
  averageUnitCost: number;
  totalInSpent: number;
  totalInQty: number;
  totalOutValue: number;
  totalOutQty: number;
  totalLossValue: number;
  currentStock: number;
}

interface CategoryBreakdown {
  category: "CHEMICAL" | "ACCESSORY" | "TOOL";
  productsCount: number;
  totalSpent: number;
  totalConsumed: number;
  inventoryValue: number;
}

const CATEGORY_NAMES: Record<string, string> = {
  CHEMICAL: "Químicos & Insumos",
  ACCESSORY: "Acessórios & Boinas",
  TOOL: "Ferramentas & Maquinários",
};

export default function EstoquePage() {
  const [activeTab, setActiveTab] = useState<
    "GERAL" | "ENTRADAS" | "SAIDAS" | "PERDAS"
  >("GERAL");
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [topExpenses, setTopExpenses] = useState<TopExpenseProduct[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal de CRUD de Produto (Criar / Editar)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "CHEMICAL" as "CHEMICAL" | "ACCESSORY" | "TOOL",
    unit: "ML" as "ML" | "L" | "G" | "KG" | "UN",
    currentStock: "1000",
    minStock: "200",
    totalPaidInitial: "45.00",
    costPrice: "0.045",
    supplier: "",
    purchasedAt: "",
  });

  // Modal de Nova Movimentação (Entrada com Valor Pago, Saída ou Perda)
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementProductId, setMovementProductId] = useState<string>("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [movementForm, setMovementForm] = useState({
    type: "IN" as "IN" | "OUT" | "LOSS",
    quantity: "",
    totalCost: "",
    reason: "",
  });

  // Modal de Edição de Movimentação (Apenas Entradas e Perdas não recuperadas; Saídas são bloqueadas)
  const [editingMovement, setEditingMovement] = useState<{
    movement: StockMovement;
    product: Product;
  } | null>(null);
  const [editMovementForm, setEditMovementForm] = useState({
    quantity: "",
    totalCost: "",
    reason: "",
  });

  // Modal de Relatório Completo do Produto (Ao clicar em um item da tabela)
  const [reportProductId, setReportProductId] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<"ALL" | "IN" | "OUT" | "LOSS">("ALL");

  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (lowStockFilter) params.append("lowStock", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setSummary(data.summary || null);
        setTopExpenses(data.analytics?.topExpensesByProduct || []);
        setCategoryBreakdown(data.analytics?.categoryBreakdown || []);
      }
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, lowStockFilter]);

  // Produto atualmente aberto no modal de relatório
  const reportProduct = useMemo(
    () => products.find((p) => p.id === reportProductId) || null,
    [products, reportProductId]
  );

  // Produto selecionado no modal de movimentação
  const selectedMovementProduct = useMemo(
    () => products.find((p) => p.id === movementProductId) || null,
    [products, movementProductId]
  );

  // Produtos filtrados pela barra de busca do dropdown no modal de movimentação
  const filteredMovementProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const catName = (CATEGORY_NAMES[p.category] || "").toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.supplier && p.supplier.toLowerCase().includes(q)) ||
        catName.includes(q) ||
        p.unit.toLowerCase().includes(q)
      );
    });
  }, [products, productSearchQuery]);

  // Fecha o dropdown de seleção de produto ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listas achatadas de movimentações para as abas Entradas, Saídas e Perdas
  const allMovementsWithProduct = useMemo(() => {
    const list: Array<{ movement: StockMovement; product: Product }> = [];
    for (const p of products) {
      for (const m of p.movements || []) {
        list.push({ movement: m, product: p });
      }
    }
    return list.sort(
      (a, b) =>
        new Date(b.movement.createdAt).getTime() -
        new Date(a.movement.createdAt).getTime()
    );
  }, [products]);

  const entryMovements = useMemo(
    () => allMovementsWithProduct.filter((x) => x.movement.type === "IN"),
    [allMovementsWithProduct]
  );

  const outputMovements = useMemo(
    () =>
      allMovementsWithProduct.filter(
        (x) =>
          x.movement.type === "OUT" || x.movement.type === "OS_CONSUMPTION"
      ),
    [allMovementsWithProduct]
  );

  const lossMovements = useMemo(
    () => allMovementsWithProduct.filter((x) => x.movement.type === "LOSS"),
    [allMovementsWithProduct]
  );

  // Formatação de moeda e data/hora
  const fmtCurrency = (val: number) =>
    `R$ ${(val ?? 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fmtUnitCost = (val: number) => {
    if (!val) return "R$ 0,00";
    // Se for fração pequena (ex: R$ 0,045 por ML), exibe até 4 casas decimais
    const decimals = val < 0.1 && val > 0 ? 4 : 2;
    return `R$ ${val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    })}`;
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "Não informada";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Não informada";
    return d.toLocaleDateString("pt-BR");
  };

  const fmtDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Abertura do Modal de Novo Produto / Editar Produto
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: "CHEMICAL",
      unit: "ML",
      currentStock: "1000",
      minStock: "200",
      totalPaidInitial: "45.00",
      costPrice: "0.045",
      supplier: "",
      purchasedAt: new Date().toISOString().split("T")[0],
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct(product);
    let formattedPurchasedAt = "";
    if (product.purchasedAt) {
      try {
        formattedPurchasedAt = new Date(product.purchasedAt)
          .toISOString()
          .split("T")[0];
      } catch (err) {}
    }
    setProductForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      currentStock: String(product.currentStock),
      minStock: String(product.minStock),
      totalPaidInitial: String(
        (product.currentStock * product.averageUnitCost).toFixed(2)
      ),
      costPrice: String(product.averageUnitCost),
      supplier: product.supplier || "",
      purchasedAt: formattedPurchasedAt,
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (
      !confirm(
        `Deseja realmente excluir o produto "${product.name}" e todo o seu histórico de movimentações?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (reportProductId === product.id) setReportProductId(null);
        showToast("Produto excluído com sucesso!");
        await fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || "Não foi possível excluir o produto.");
      }
    } catch (err) {
      alert("Falha de conexão ao excluir produto.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProduct) {
        // PUT /api/products/[id]
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: productForm.name,
            category: productForm.category,
            unit: productForm.unit,
            minStock: parseFloat(productForm.minStock) || 0,
            costPrice: parseFloat(productForm.costPrice) || 0,
            supplier: productForm.supplier || null,
            purchasedAt: productForm.purchasedAt || null,
          }),
        });

        if (res.ok) {
          setShowProductModal(false);
          showToast("Cadastro do produto atualizado com sucesso!");
          await fetchInventory();
        } else {
          const data = await res.json();
          alert(data.error || "Erro ao atualizar produto");
        }
      } else {
        // POST /api/products
        const stockNum = parseFloat(productForm.currentStock) || 0;
        const totalPaidNum = parseFloat(productForm.totalPaidInitial) || 0;
        const unitCostNum =
          stockNum > 0 && totalPaidNum > 0
            ? totalPaidNum / stockNum
            : parseFloat(productForm.costPrice) || 0;

        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: productForm.name,
            category: productForm.category,
            unit: productForm.unit,
            currentStock: stockNum,
            minStock: parseFloat(productForm.minStock) || 0,
            costPrice: unitCostNum,
            totalPaidInitial: totalPaidNum,
            supplier: productForm.supplier || null,
            purchasedAt: productForm.purchasedAt || null,
          }),
        });

        if (res.ok) {
          setShowProductModal(false);
          showToast("Novo produto cadastrado no estoque!");
          await fetchInventory();
        } else {
          const data = await res.json();
          alert(data.error || "Erro ao salvar produto");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  // Abertura do Modal de Nova Movimentação
  const handleOpenMovementModal = (
    type: "IN" | "OUT" | "LOSS",
    product?: Product,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    const targetProduct = product || products[0];
    if (!targetProduct) {
      alert("Cadastre um produto primeiro antes de registrar movimentações.");
      return;
    }
    setMovementProductId(targetProduct.id);
    setProductSearchQuery("");
    setIsProductDropdownOpen(false);
    setMovementForm({
      type,
      quantity: "",
      totalCost: "",
      reason: "",
    });
    setShowMovementModal(true);
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementProductId) return;
    setSubmitting(true);
    try {
      const payload: any = {
        type: movementForm.type,
        quantity: parseFloat(movementForm.quantity),
        reason: movementForm.reason,
      };

      if (movementForm.type === "IN" && movementForm.totalCost !== "") {
        payload.totalCost = parseFloat(movementForm.totalCost);
      }

      const res = await fetch(`/api/products/${movementProductId}/movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowMovementModal(false);
        showToast(
          movementForm.type === "IN"
            ? "Entrada registrada e custo médio unitário atualizado!"
            : movementForm.type === "OUT"
            ? "Saída de estoque registrada com sucesso!"
            : "Registro de perda adicionado ao controle."
        );
        await fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao registrar movimentação");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  // Ação: Reencontrar item em Perdas e retornar ao estoque
  const handleRecoverLoss = async (product: Product, movement: StockMovement) => {
    if (
      !confirm(
        `Confirmar que "${product.name}" (${movement.quantity} ${product.unit}) foi reencontrado e deve retornar imediatamente para o saldo em estoque?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/products/${product.id}/movement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECOVER_LOSS",
          movementId: movement.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          `Item reencontrado! +${movement.quantity} ${product.unit} devolvidos ao estoque de ${product.name}.`
        );
        await fetchInventory();
      } else {
        alert(data.error || "Erro ao retornar item ao estoque");
      }
    } catch (err) {
      alert("Falha de conexão com o servidor");
    }
  };

  // Abertura do Modal de Edição de Movimentação (Bloqueado para Saídas)
  const handleOpenEditMovement = (product: Product, movement: StockMovement) => {
    if (movement.type === "OUT" || movement.type === "OS_CONSUMPTION") {
      alert("Não é permitido editar itens que estão em saídas.");
      return;
    }
    setEditingMovement({ product, movement });
    setEditMovementForm({
      quantity: String(movement.quantity),
      totalCost:
        movement.totalCost !== null && movement.totalCost !== undefined
          ? String(movement.totalCost)
          : String((movement.quantity * (movement.unitCost ?? product.averageUnitCost)).toFixed(2)),
      reason: movement.reason || "",
    });
  };

  const handleSaveEditMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;
    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/products/${editingMovement.product.id}/movement`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "EDIT_MOVEMENT",
            movementId: editingMovement.movement.id,
            quantity: parseFloat(editMovementForm.quantity),
            totalCost:
              editingMovement.movement.type === "IN"
                ? parseFloat(editMovementForm.totalCost) || 0
                : undefined,
            reason: editMovementForm.reason,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setEditingMovement(null);
        showToast("Registro atualizado e saldo recalculado!");
        await fetchInventory();
      } else {
        alert(data.error || "Não foi possível atualizar o registro.");
      }
    } catch (err) {
      alert("Falha de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque, Movimentações e Relatórios de Insumos"
        description="Controle completo de entradas com valor pago, custo médio unitário automático, saídas auditadas, recuperação de perdas e relatórios de gastos."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenMovementModal("IN")}
              leftIcon={<ArrowDownRight className="w-4 h-4 text-[#16A36A]" />}
            >
              Nova Entrada
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenMovementModal("OUT")}
              leftIcon={<ArrowUpRight className="w-4 h-4 text-[#D97706]" />}
            >
              Registrar Saída
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenMovementModal("LOSS")}
              leftIcon={<TrendingDown className="w-4 h-4 text-[#DC4C4C]" />}
            >
              Registrar Perda
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateProduct}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Produto
            </Button>
          </div>
        }
      />

      {feedback && <Alert variant="success" title={feedback} />}

      {/* Navegação em 4 Abas: Geral, Entradas, Saídas e Perdas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7EAE7] pb-3">
        {[
          {
            id: "GERAL" as const,
            label: "Geral & Relatórios de Gastos",
            count: products.length,
            icon: BarChart3,
          },
          {
            id: "ENTRADAS" as const,
            label: "Entradas (Compras)",
            count: entryMovements.length,
            icon: ArrowDownRight,
          },
          {
            id: "SAIDAS" as const,
            label: "Saídas (Consumo)",
            count: outputMovements.length,
            icon: ArrowUpRight,
          },
          {
            id: "PERDAS" as const,
            label: "Perdas & Extravios",
            count: lossMovements.length,
            icon: TrendingDown,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                isActive
                  ? "bg-[#247653] text-white border-[#247653] shadow-xs"
                  : "bg-white text-[#737D75] border-[#E7EAE7] hover:text-[#252B27] hover:border-[#D5DBD5]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#F1F3F1] text-[#252B27]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingState message="Carregando inventário, custos médios e histórico..." />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* ABA 1: GERAL (RELATÓRIOS DE GASTOS + PRINCIPAIS INSUMOS + CRUD TABELA)    */}
          {/* ========================================================================= */}
          {activeTab === "GERAL" && (
            <div className="space-y-6">
              {/* KPIs Globais de Gastos e Estoque */}
              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Gasto em Entradas"
                    value={fmtCurrency(summary.totalSpentEntries)}
                    subtitle="Soma investida em compras de insumos"
                    icon={<DollarSign className="w-5 h-5" />}
                    variant="brand"
                  />
                  <StatCard
                    label="Valor Atual em Estoque"
                    value={fmtCurrency(summary.totalInventoryValue)}
                    subtitle="Calculado pelo Valor Médio Unitário"
                    icon={<Layers className="w-5 h-5" />}
                    variant="success"
                  />
                  <StatCard
                    label="Custo Consumido (Saídas)"
                    value={fmtCurrency(summary.totalConsumedValue)}
                    subtitle={`${outputMovements.length} baixas de consumo`}
                    icon={<ArrowUpRight className="w-5 h-5" />}
                    variant="info"
                  />
                  <div
                    onClick={() => setLowStockFilter(!lowStockFilter)}
                    className="cursor-pointer"
                  >
                    <StatCard
                      label="Perdas Ativas & Alertas"
                      value={fmtCurrency(summary.totalLossValue)}
                      subtitle={`${summary.lowStockCount} itens em estoque crítico (clique p/ filtrar)`}
                      icon={<AlertTriangle className="w-5 h-5" />}
                      variant={
                        summary.lowStockCount > 0 || summary.totalLossValue > 0
                          ? "error"
                          : "default"
                      }
                    />
                  </div>
                </div>
              )}

              {/* Seção de Relatórios de Gastos e Principais Gastos com Insumos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Ranking dos Principais Gastos com Insumos */}
                <div className="lg:col-span-2 bg-white border border-[#E7EAE7] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F3F1] pb-3">
                    <div>
                      <h2 className="text-[15px] font-semibold text-[#252B27] flex items-center gap-2">
                        <FileBarChart2 className="w-4 h-4 text-[#247653]" />
                        <span>Principais Gastos com Insumos</span>
                      </h2>
                      <p className="text-xs text-[#737D75] mt-0.5">
                        Insumos que representam o maior volume financeiro investido em entradas e consumo operacional
                      </p>
                    </div>
                    <Badge variant="brand" size="sm">
                      Top {Math.min(5, topExpenses.length)} Insumos
                    </Badge>
                  </div>

                  {topExpenses.length === 0 ? (
                    <p className="text-xs text-[#737D75] py-6 text-center">
                      Nenhum gasto registrado ainda.
                    </p>
                  ) : (
                    <div className="space-y-3.5">
                      {topExpenses.slice(0, 5).map((item, idx) => {
                        const maxSpent = Math.max(
                          1,
                          topExpenses[0]?.totalInSpent || 1
                        );
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setReportProductId(item.id);
                              setReportFilter("ALL");
                            }}
                            className="p-3 rounded-xl bg-[#F7F8F6] hover:bg-[#E9F3EC]/50 border border-[#E7EAE7] transition-colors cursor-pointer space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#247653] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-semibold text-sm text-[#252B27]">
                                  {item.name}
                                </span>
                                <Badge variant="neutral" size="sm">
                                  {CATEGORY_NAMES[item.category] || item.category}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-[#247653]">
                                  {fmtCurrency(item.totalInSpent)}
                                </span>
                                <span className="text-[11px] text-[#737D75] ml-1.5">
                                  gasto em compras
                                </span>
                              </div>
                            </div>

                            <ProgressBar
                              value={item.totalInSpent}
                              max={maxSpent}
                              tone="brand"
                            />

                            <div className="flex flex-wrap items-center justify-between text-xs text-[#737D75] gap-2">
                              <span>
                                Valor Médio Unitário:{" "}
                                <strong className="text-[#252B27]">
                                  {fmtUnitCost(item.averageUnitCost)} / {item.unit}
                                </strong>
                              </span>
                              <span>
                                Consumido em Saídas:{" "}
                                <strong className="text-[#252B27]">
                                  {fmtCurrency(item.totalOutValue)} ({item.totalOutQty}{" "}
                                  {item.unit})
                                </strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Gastos por Categoria de Insumo */}
                <div className="bg-white border border-[#E7EAE7] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="border-b border-[#F1F3F1] pb-3 mb-4">
                      <h2 className="text-[15px] font-semibold text-[#252B27]">
                        Relatório por Categoria
                      </h2>
                      <p className="text-xs text-[#737D75] mt-0.5">
                        Distribuição financeira entre químicos, acessórios e ferramentas
                      </p>
                    </div>

                    <div className="space-y-4">
                      {categoryBreakdown.map((cat) => {
                        const totalAll = Math.max(
                          1,
                          summary?.totalSpentEntries || 1
                        );
                        return (
                          <div
                            key={cat.category}
                            className="p-3.5 rounded-xl border border-[#E7EAE7] bg-[#F7F8F6]/60 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#252B27]">
                                {CATEGORY_NAMES[cat.category] || cat.category}
                              </span>
                              <Badge variant="neutral" size="sm">
                                {cat.productsCount} itens
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div>
                                <span className="text-[#737D75] block text-[11px]">
                                  Total Comprado:
                                </span>
                                <span className="font-bold text-[#247653]">
                                  {fmtCurrency(cat.totalSpent)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#737D75] block text-[11px]">
                                  Já Consumido:
                                </span>
                                <span className="font-semibold text-[#252B27]">
                                  {fmtCurrency(cat.totalConsumed)}
                                </span>
                              </div>
                            </div>

                            <ProgressBar
                              value={cat.totalSpent}
                              max={totalAll}
                              tone="brand"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#E9F3EC] border border-[#247653]/20 text-xs text-[#142D26]">
                    💡 <strong>Dica:</strong> Clique sobre qualquer produto na tabela abaixo para abrir o relatório individual com todas as entradas, saídas e perdas com data e hora.
                  </div>
                </div>
              </div>

              {/* Barra de Filtros e Busca da Tabela de Produtos */}
              <div className="flex flex-col sm:flex-row gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchInventory();
                  }}
                  className="flex-1"
                >
                  <SearchInput
                    placeholder="Buscar produto ou fornecedor..."
                    value={search}
                    onChange={(val) => setSearch(val)}
                    onClear={
                      search
                        ? () => {
                            setSearch("");
                            setTimeout(fetchInventory, 50);
                          }
                        : undefined
                    }
                  />
                </form>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-select sm:w-64"
                >
                  <option value="">Todas as Categorias</option>
                  <option value="CHEMICAL">Químicos & Insumos</option>
                  <option value="ACCESSORY">Acessórios & Boinas</option>
                  <option value="TOOL">Ferramentas & Maquinários</option>
                </select>
              </div>

              {/* Tabela Geral de Produtos com Valor Médio Unitário e CRUD */}
              <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-[#E7EAE7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-[#252B27]">
                      Catálogo de Produtos em Estoque
                    </h3>
                    <p className="text-xs text-[#737D75]">
                      Clique em qualquer linha da tabela para abrir o relatório detalhado de Entradas, Saídas e Perdas do item.
                    </p>
                  </div>
                </div>

                {products.length === 0 ? (
                  <EmptyState
                    icon={<Package className="w-6 h-6" />}
                    title="Nenhum produto cadastrado"
                    description="Cadastre shampoos automotivos, vitrificadores, compostos polidores e acessórios para controlar entradas, saídas e custos."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenCreateProduct}
                      >
                        Cadastrar Primeiro Produto
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Produto / Insumo</th>
                          <th className="px-5 py-3 font-semibold">Categoria</th>
                          <th className="px-5 py-3 font-semibold">Aquisição / Compra</th>
                          <th className="px-5 py-3 font-semibold">Registro no Estoque</th>
                          <th className="px-5 py-3 font-semibold">Saldo Atual</th>
                          <th className="px-5 py-3 font-semibold">
                            Valor Médio Unitário
                          </th>
                          <th className="px-5 py-3 font-semibold">
                            Gasto em Entradas
                          </th>
                          <th className="px-5 py-3 font-semibold">
                            Valor em Estoque
                          </th>
                          <th className="px-5 py-3 font-semibold text-right">
                            Ações (CRUD & Movimentar)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F3F1]">
                        {products.map((product) => (
                          <tr
                            key={product.id}
                            onClick={() => {
                              setReportProductId(product.id);
                              setReportFilter("ALL");
                            }}
                            className="hover:bg-[#E9F3EC]/35 transition-colors cursor-pointer group"
                            title="Clique para abrir o relatório de entradas, saídas e perdas deste produto"
                          >
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-[#252B27] group-hover:text-[#247653] flex items-center gap-1.5">
                                <span>{product.name}</span>
                                <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#247653] transition-opacity" />
                              </div>
                              <div className="text-xs text-[#737D75]">
                                {product.supplier
                                  ? `Fornecedor: ${product.supplier}`
                                  : "Sem fornecedor informado"}{" "}
                                • {product.stats.entriesCount} entrada(s)
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant="neutral" size="sm">
                                {CATEGORY_NAMES[product.category] || product.category}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {product.purchasedAt ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#E9F3EC] text-[#247653] border border-[#247653]/20">
                                  {fmtDate(product.purchasedAt)}
                                </span>
                              ) : (
                                <span className="text-xs text-[#9CA49E] italic">
                                  Não informada
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="text-xs text-[#737D75]">
                                {fmtDate(product.createdAt)}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold ${
                                    product.isLowStock
                                      ? "text-[#DC4C4C]"
                                      : "text-[#16A36A]"
                                  }`}
                                >
                                  {product.currentStock.toLocaleString("pt-BR")}{" "}
                                  {product.unit}
                                </span>
                                {product.isLowStock && (
                                  <Badge variant="error" size="sm">
                                    Repor (Mín: {product.minStock})
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="font-semibold text-[#252B27]">
                                {fmtUnitCost(product.averageUnitCost)} /{" "}
                                {product.unit}
                              </div>
                              <div className="text-[11px] text-[#737D75]">
                                Média ponderada das entradas
                              </div>
                            </td>
                            <td className="px-6 py-3.5 font-medium text-[#252B27]">
                              {fmtCurrency(product.stats.totalInSpent)}
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-[#247653]">
                              {fmtCurrency(product.totalInventoryValue)}
                            </td>
                            <td
                              className="px-6 py-3.5 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) =>
                                    handleOpenMovementModal("IN", product, e)
                                  }
                                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                                >
                                  Entrada
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleOpenEditProduct(product, e)}
                                  title="Editar cadastro do produto"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleDeleteProduct(product, e)}
                                  className="text-[#737D75] hover:text-[#DC4C4C]"
                                  title="Excluir produto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: ENTRADAS (COM VALOR PAGO POR LOTE E CUSTO UNITÁRIO DA ENTRADA)     */}
          {/* ========================================================================= */}
          {activeTab === "ENTRADAS" && (
            <div className="space-y-4">
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-[#065F46]">
                  <strong>Controle de Entradas e Compras:</strong> Ao registrar uma nova entrada, informe o <strong>valor pago pelo produto</strong>. O sistema recalcula automaticamente o Valor Médio Unitário considerando as variações de preço entre diferentes compras.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenMovementModal("IN")}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Registrar Nova Entrada
                </Button>
              </div>

              <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
                {entryMovements.length === 0 ? (
                  <EmptyState
                    icon={<ArrowDownRight className="w-6 h-6" />}
                    title="Nenhuma entrada registrada"
                    description="Registre compras e reposições de produtos informando o valor pago para acompanhar a evolução de custos."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenMovementModal("IN")}
                      >
                        Registrar Primeira Entrada
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Data e Hora</th>
                          <th className="px-6 py-3 font-semibold">Produto</th>
                          <th className="px-6 py-3 font-semibold">
                            Quantidade Adicionada
                          </th>
                          <th className="px-6 py-3 font-semibold">
                            Valor Pago na Entrada
                          </th>
                          <th className="px-6 py-3 font-semibold">
                            Custo Unit. da Compra
                          </th>
                          <th className="px-6 py-3 font-semibold">
                            Motivo / Nota Fiscal
                          </th>
                          <th className="px-6 py-3 font-semibold text-right">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F3F1]">
                        {entryMovements.map(({ movement, product }) => {
                          const paidTotal =
                            movement.totalCost ??
                            movement.quantity *
                              (movement.unitCost ?? product.averageUnitCost);
                          const unitPaid =
                            movement.unitCost ??
                            (movement.quantity > 0
                              ? paidTotal / movement.quantity
                              : product.averageUnitCost);

                          return (
                            <tr
                              key={movement.id}
                              className="hover:bg-[#F7F8F6]/70 transition-colors"
                            >
                              <td className="px-6 py-3.5 text-xs text-[#737D75] whitespace-nowrap">
                                <div className="flex items-center gap-1.5 font-medium text-[#252B27]">
                                  <Clock className="w-3.5 h-3.5 text-[#16A36A]" />
                                  <span>{fmtDateTime(movement.createdAt)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReportProductId(product.id);
                                    setReportFilter("IN");
                                  }}
                                  className="font-semibold text-[#252B27] hover:text-[#247653] hover:underline text-left cursor-pointer"
                                >
                                  {product.name}
                                </button>
                                <div className="text-xs text-[#737D75]">
                                  {CATEGORY_NAMES[product.category] ||
                                    product.category}
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <Badge variant="success" size="sm">
                                  +{movement.quantity.toLocaleString("pt-BR")}{" "}
                                  {product.unit}
                                </Badge>
                              </td>
                              <td className="px-6 py-3.5 font-bold text-[#16A36A]">
                                {fmtCurrency(paidTotal)}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-[#252B27]">
                                {fmtUnitCost(unitPaid)} / {product.unit}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-[#737D75]">
                                {movement.reason || "Entrada de estoque"}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenEditMovement(product, movement)
                                  }
                                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                                >
                                  Editar
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: SAÍDAS (CONSUMO AUDITADO — EDIÇÃO BLOQUEADA)                       */}
          {/* ========================================================================= */}
          {activeTab === "SAIDAS" && (
            <div className="space-y-4">
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-[#92400E] flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-[#D97706]" />
                  <span>
                    <strong>Auditoria de Saídas:</strong> Por segurança operacional, os registros de saída de estoque são definitivos e <strong>não permitem edição</strong> após o lançamento.
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenMovementModal("OUT")}
                  leftIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Registrar Nova Saída
                </Button>
              </div>

              <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
                {outputMovements.length === 0 ? (
                  <EmptyState
                    icon={<ArrowUpRight className="w-6 h-6" />}
                    title="Nenhuma saída registrada"
                    description="Registre o consumo de produtos nas diluições e serviços do pátio."
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenMovementModal("OUT")}
                      >
                        Registrar Saída
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Data e Hora</th>
                          <th className="px-6 py-3 font-semibold">Produto</th>
                          <th className="px-6 py-3 font-semibold">
                            Quantidade Consumida
                          </th>
                          <th className="px-6 py-3 font-semibold">
                            Custo Estimado
                          </th>
                          <th className="px-6 py-3 font-semibold">
                            Motivo / Aplicação
                          </th>
                          <th className="px-6 py-3 font-semibold text-right">
                            Status de Auditoria
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F3F1]">
                        {outputMovements.map(({ movement, product }) => {
                          const costVal =
                            movement.totalCost ??
                            movement.quantity *
                              (movement.unitCost ?? product.averageUnitCost);
                          return (
                            <tr
                              key={movement.id}
                              className="hover:bg-[#F7F8F6]/70 transition-colors"
                            >
                              <td className="px-6 py-3.5 text-xs text-[#252B27] whitespace-nowrap">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                                  <span>{fmtDateTime(movement.createdAt)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReportProductId(product.id);
                                    setReportFilter("OUT");
                                  }}
                                  className="font-semibold text-[#252B27] hover:text-[#247653] hover:underline text-left cursor-pointer"
                                >
                                  {product.name}
                                </button>
                                <div className="text-xs text-[#737D75]">
                                  {CATEGORY_NAMES[product.category] ||
                                    product.category}
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <Badge variant="warning" size="sm">
                                  -{movement.quantity.toLocaleString("pt-BR")}{" "}
                                  {product.unit}
                                </Badge>
                              </td>
                              <td className="px-6 py-3.5 font-semibold text-[#252B27]">
                                {fmtCurrency(costVal)}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-[#737D75]">
                                {movement.reason || "Consumo operacional"}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F3F1] text-[#737D75] text-xs font-medium border border-[#E7EAE7]"
                                  title="Não é permitido editar itens que estão em saídas"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Edição Bloqueada</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: PERDAS & EXTRAVIOS (COM RETORNO AO ESTOQUE SE REENCONTRADO)        */}
          {/* ========================================================================= */}
          {activeTab === "PERDAS" && (
            <div className="space-y-4">
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-[#991B1B]">
                  <strong>Controle de Perdas, Avarias e Extravios:</strong> Caso um item dado como perdido seja <strong>reencontrado</strong> na oficina, clique em <strong>&ldquo;Reencontrado (Retornar ao Estoque)&rdquo;</strong> para devolver a quantidade imediatamente ao saldo disponível.
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleOpenMovementModal("LOSS")}
                  leftIcon={<TrendingDown className="w-4 h-4" />}
                >
                  Registrar Perda
                </Button>
              </div>

              <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
                {lossMovements.length === 0 ? (
                  <EmptyState
                    icon={<TrendingDown className="w-6 h-6" />}
                    title="Nenhuma perda registrada"
                    description="Ótimo trabalho! Não há registros de desperdício, vencimento ou extravio de insumos."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Data e Hora</th>
                          <th className="px-6 py-3 font-semibold">Produto</th>
                          <th className="px-6 py-3 font-semibold">Quantidade</th>
                          <th className="px-6 py-3 font-semibold">
                            Impacto Estimado
                          </th>
                          <th className="px-6 py-3 font-semibold">
                            Motivo da Perda
                          </th>
                          <th className="px-6 py-3 font-semibold">Situação</th>
                          <th className="px-6 py-3 font-semibold text-right">
                            Ação (Reencontrado / Retornar)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F3F1]">
                        {lossMovements.map(({ movement, product }) => {
                          const lossCost =
                            movement.totalCost ??
                            movement.quantity *
                              (movement.unitCost ?? product.averageUnitCost);
                          return (
                            <tr
                              key={movement.id}
                              className={`hover:bg-[#F7F8F6]/70 transition-colors ${
                                movement.recovered ? "opacity-75 bg-[#ECFDF5]/20" : ""
                              }`}
                            >
                              <td className="px-6 py-3.5 text-xs text-[#252B27] whitespace-nowrap">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-[#DC4C4C]" />
                                  <span>{fmtDateTime(movement.createdAt)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReportProductId(product.id);
                                    setReportFilter("LOSS");
                                  }}
                                  className="font-semibold text-[#252B27] hover:text-[#247653] hover:underline text-left cursor-pointer"
                                >
                                  {product.name}
                                </button>
                                <div className="text-xs text-[#737D75]">
                                  {CATEGORY_NAMES[product.category] ||
                                    product.category}
                                </div>
                              </td>
                              <td className="px-6 py-3.5">
                                <Badge
                                  variant={movement.recovered ? "neutral" : "error"}
                                  size="sm"
                                >
                                  {movement.quantity.toLocaleString("pt-BR")}{" "}
                                  {product.unit}
                                </Badge>
                              </td>
                              <td className="px-6 py-3.5 font-semibold text-[#DC4C4C]">
                                {movement.recovered ? (
                                  <span className="line-through text-[#737D75]">
                                    {fmtCurrency(lossCost)}
                                  </span>
                                ) : (
                                  fmtCurrency(lossCost)
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-[#737D75]">
                                {movement.reason || "Extravio / Avaria"}
                              </td>
                              <td className="px-6 py-3.5">
                                {movement.recovered ? (
                                  <div>
                                    <Badge variant="success" size="sm" dot>
                                      Reencontrado / Devolvido
                                    </Badge>
                                    {movement.recoveredAt && (
                                      <div className="text-[11px] text-[#737D75] mt-0.5">
                                        em {fmtDateTime(movement.recoveredAt)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="error" size="sm" dot>
                                    Perda Ativa
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                {!movement.recovered ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        handleRecoverLoss(product, movement)
                                      }
                                      leftIcon={
                                        <RotateCcw className="w-3.5 h-3.5 text-[#247653]" />
                                      }
                                    >
                                      Reencontrado (Retornar ao Estoque)
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#16A36A] font-medium inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Retornado ao saldo
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE RELATÓRIO COMPLETO DO PRODUTO (AO CLICAR NO ITEM DA TABELA)      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!reportProduct}
        onClose={() => setReportProductId(null)}
        title={
          reportProduct
            ? `Relatório de Movimentações — ${reportProduct.name}`
            : "Relatório do Produto"
        }
        description={
          reportProduct
            ? `Histórico auditado de Entradas, Saídas e Perdas com data e hora (${
                CATEGORY_NAMES[reportProduct.category] || reportProduct.category
              })`
            : ""
        }
        size="xl"
      >
        {reportProduct && (
          <div className="space-y-5">
            {/* Informações de Cadastro e Datas */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] text-xs">
              <div>
                <span className="text-[#737D75]">Data de Aquisição: </span>
                <strong className="text-[#247653]">
                  {fmtDate(reportProduct.purchasedAt)}
                </strong>
              </div>
              <span className="text-[#DFE2DF] hidden sm:inline">•</span>
              <div>
                <span className="text-[#737D75]">Registro no Estoque: </span>
                <strong className="text-[#252B27]">
                  {fmtDateTime(reportProduct.createdAt)}
                </strong>
              </div>
              {reportProduct.supplier && (
                <>
                  <span className="text-[#DFE2DF] hidden sm:inline">•</span>
                  <div>
                    <span className="text-[#737D75]">Fornecedor: </span>
                    <strong className="text-[#252B27]">{reportProduct.supplier}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Resumo Financeiro e de Saldo do Item */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7]">
                <span className="text-xs text-[#737D75] block">Saldo Atual</span>
                <span className="text-lg font-bold text-[#252B27]">
                  {reportProduct.currentStock.toLocaleString("pt-BR")}{" "}
                  {reportProduct.unit}
                </span>
                <span className="text-[11px] text-[#737D75] block mt-0.5">
                  Mínimo: {reportProduct.minStock} {reportProduct.unit}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#E9F3EC] border border-[#247653]/20">
                <span className="text-xs text-[#142D26] font-medium block">
                  Valor Médio Unitário
                </span>
                <span className="text-lg font-bold text-[#247653]">
                  {fmtUnitCost(reportProduct.averageUnitCost)} /{" "}
                  {reportProduct.unit}
                </span>
                <span className="text-[11px] text-[#142D26]/80 block mt-0.5">
                  Em {reportProduct.stats.entriesCount} entrada(s)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
                <span className="text-xs text-[#065F46] font-medium block">
                  Total Pago (Entradas)
                </span>
                <span className="text-lg font-bold text-[#16A36A]">
                  {fmtCurrency(reportProduct.stats.totalInSpent)}
                </span>
                <span className="text-[11px] text-[#065F46]/80 block mt-0.5">
                  +{reportProduct.stats.totalInQty} {reportProduct.unit} comprados
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                <span className="text-xs text-[#92400E] font-medium block">
                  Saídas / Perdas Ativas
                </span>
                <span className="text-lg font-bold text-[#D97706]">
                  {fmtCurrency(
                    reportProduct.stats.totalOutValue +
                      reportProduct.stats.totalLossValue
                  )}
                </span>
                <span className="text-[11px] text-[#92400E]/80 block mt-0.5">
                  Saídas: {reportProduct.stats.totalOutQty} {reportProduct.unit} •
                  Perdas: {reportProduct.stats.totalLossQty} {reportProduct.unit}
                </span>
              </div>
            </div>

            {/* Ações Rápidas para este Produto e Filtros do Histórico */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E7EAE7]">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL" as const, label: "Todas" },
                  { id: "IN" as const, label: "Entradas" },
                  { id: "OUT" as const, label: "Saídas" },
                  { id: "LOSS" as const, label: "Perdas" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setReportFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      reportFilter === f.id
                        ? "bg-[#247653] text-white"
                        : "bg-[#F1F3F1] text-[#737D75] hover:text-[#252B27]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenMovementModal("IN", reportProduct)}
                  leftIcon={<ArrowDownRight className="w-3.5 h-3.5" />}
                >
                  + Entrada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenMovementModal("OUT", reportProduct)}
                  leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                >
                  + Saída
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenMovementModal("LOSS", reportProduct)}
                  leftIcon={<TrendingDown className="w-3.5 h-3.5 text-[#DC4C4C]" />}
                >
                  + Perda
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditProduct(reportProduct)}
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                >
                  Editar Produto
                </Button>
              </div>
            </div>

            {/* Tabela de Movimentações do Item com Datas e Horas */}
            {(() => {
              const filteredMovs = (reportProduct.movements || []).filter((m) => {
                if (reportFilter === "ALL") return true;
                if (reportFilter === "OUT")
                  return m.type === "OUT" || m.type === "OS_CONSUMPTION";
                return m.type === reportFilter;
              });

              if (filteredMovs.length === 0) {
                return (
                  <div className="py-10 text-center text-xs text-[#737D75] bg-[#F7F8F6] rounded-xl border border-dashed border-[#D5DBD5]">
                    Nenhuma movimentação encontrada para este filtro.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto border border-[#E7EAE7] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F8F6] text-[#737D75] uppercase border-b border-[#E7EAE7]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Data e Hora</th>
                        <th className="px-4 py-3 font-semibold">Tipo</th>
                        <th className="px-4 py-3 font-semibold">Quantidade</th>
                        <th className="px-4 py-3 font-semibold">
                          Valor Pago / Custo
                        </th>
                        <th className="px-4 py-3 font-semibold">Motivo</th>
                        <th className="px-4 py-3 font-semibold text-right">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F3F1]">
                      {filteredMovs.map((m) => {
                        const isOut =
                          m.type === "OUT" || m.type === "OS_CONSUMPTION";
                        const isLoss = m.type === "LOSS";
                        const valTotal =
                          m.totalCost ??
                          m.quantity *
                            (m.unitCost ?? reportProduct.averageUnitCost);
                        const valUnit =
                          m.unitCost ??
                          (m.quantity > 0
                            ? valTotal / m.quantity
                            : reportProduct.averageUnitCost);

                        return (
                          <tr key={m.id} className="hover:bg-[#F7F8F6]/70">
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-[#252B27]">
                              {fmtDateTime(m.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              {m.type === "IN" && (
                                <Badge variant="success" size="sm">
                                  Entrada
                                </Badge>
                              )}
                              {isOut && (
                                <Badge variant="warning" size="sm">
                                  Saída
                                </Badge>
                              )}
                              {isLoss && (
                                <Badge
                                  variant={m.recovered ? "neutral" : "error"}
                                  size="sm"
                                >
                                  {m.recovered
                                    ? "Perda (Reencontrado)"
                                    : "Perda"}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 font-bold text-[#252B27]">
                              {m.type === "IN" ? "+" : "-"}
                              {m.quantity.toLocaleString("pt-BR")}{" "}
                              {reportProduct.unit}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[#252B27]">
                                {fmtCurrency(valTotal)}
                              </div>
                              <div className="text-[11px] text-[#737D75]">
                                {fmtUnitCost(valUnit)} / {reportProduct.unit}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#737D75]">
                              {m.reason || "-"}
                              {m.recovered && m.recoveredAt && (
                                <div className="text-[11px] text-[#16A36A] font-medium">
                                  Reencontrado em {fmtDateTime(m.recoveredAt)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {isOut ? (
                                <span className="inline-flex items-center gap-1 text-[#737D75] bg-[#F1F3F1] px-2 py-1 rounded border border-[#E7EAE7]">
                                  <Lock className="w-3 h-3" />
                                  <span>Saída Bloqueada</span>
                                </span>
                              ) : isLoss ? (
                                !m.recovered ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      handleRecoverLoss(reportProduct, m)
                                    }
                                    leftIcon={<RotateCcw className="w-3 h-3" />}
                                  >
                                    Reencontrado
                                  </Button>
                                ) : (
                                  <span className="text-[#16A36A] font-medium">
                                    Retornado ao estoque
                                  </span>
                                )
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenEditMovement(reportProduct, m)
                                  }
                                  leftIcon={<Pencil className="w-3 h-3" />}
                                >
                                  Editar
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL DE CADASTRO / EDIÇÃO DE PRODUTO (CRUD)                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={
          editingProduct
            ? `Editar Produto — ${editingProduct.name}`
            : "Cadastrar Novo Produto / Insumo"
        }
        description="Configure os dados do produto, unidade de medida e estoque mínimo de alerta."
        size="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nome do Produto"
            required
            placeholder="Ex: Vonixx V-Floc Shampoo Concentrado"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Categoria"
              value={productForm.category}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  category: e.target.value as any,
                })
              }
              options={[
                { value: "CHEMICAL", label: "Químicos & Insumos" },
                { value: "ACCESSORY", label: "Acessórios & Boinas" },
                { value: "TOOL", label: "Ferramentas & Equipamentos" },
              ]}
            />

            <Select
              label="Unidade de Medida"
              value={productForm.unit}
              onChange={(e) =>
                setProductForm({ ...productForm, unit: e.target.value as any })
              }
              options={[
                { value: "ML", label: "Mililitros (ML)" },
                { value: "L", label: "Litros (L)" },
                { value: "G", label: "Gramas (G)" },
                { value: "KG", label: "Quilos (KG)" },
                { value: "UN", label: "Unidade (UN)" },
              ]}
            />
          </div>

          {!editingProduct ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label={`Saldo Inicial (${productForm.unit})`}
                type="number"
                step="any"
                required
                value={productForm.currentStock}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    currentStock: e.target.value,
                  })
                }
              />

              <Input
                label={`Estoque Mínimo (${productForm.unit})`}
                type="number"
                step="any"
                required
                value={productForm.minStock}
                onChange={(e) =>
                  setProductForm({ ...productForm, minStock: e.target.value })
                }
              />

              <Input
                label="Valor Pago Inicial (R$)"
                type="number"
                step="0.01"
                required
                hint={
                  parseFloat(productForm.currentStock) > 0 &&
                  parseFloat(productForm.totalPaidInitial) > 0
                    ? `Unit.: ${fmtUnitCost(
                        parseFloat(productForm.totalPaidInitial) /
                          parseFloat(productForm.currentStock)
                      )}/${productForm.unit}`
                    : undefined
                }
                value={productForm.totalPaidInitial}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    totalPaidInitial: e.target.value,
                  })
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label={`Estoque Mínimo (${productForm.unit})`}
                type="number"
                step="any"
                required
                value={productForm.minStock}
                onChange={(e) =>
                  setProductForm({ ...productForm, minStock: e.target.value })
                }
              />

              <Input
                label="Custo Unitário Base (R$)"
                type="number"
                step="any"
                required
                value={productForm.costPrice}
                onChange={(e) =>
                  setProductForm({ ...productForm, costPrice: e.target.value })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Data de Aquisição / Compra"
              type="date"
              value={productForm.purchasedAt}
              onChange={(e) =>
                setProductForm({ ...productForm, purchasedAt: e.target.value })
              }
              hint="Data da compra ou emissão da NF"
            />

            <Input
              label="Fornecedor / Distribuidor (opcional)"
              placeholder="Ex: Detailer Distribuidora, Vonixx"
              value={productForm.supplier}
              onChange={(e) =>
                setProductForm({ ...productForm, supplier: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowProductModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL DE NOVA MOVIMENTAÇÃO (ENTRADA COM VALOR PAGO, SAÍDA OU PERDA)       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title={
          movementForm.type === "IN"
            ? "Registrar Entrada de Produto (Compra)"
            : movementForm.type === "OUT"
            ? "Registrar Saída / Consumo de Estoque"
            : "Registrar Perda ou Extravio"
        }
        description={
          movementForm.type === "IN"
            ? "Informe a quantidade adquirida e o valor pago pelo produto para atualizar o Valor Médio Unitário."
            : movementForm.type === "OUT"
            ? "Atenção: Registros de saída são definitivos e não permitem edição posterior."
            : "Registre perdas ou extravios. Caso o item seja reencontrado depois, você poderá retorná-lo ao estoque."
        }
        size="md"
      >
        <form onSubmit={handleCreateMovement} className="space-y-4">
          {/* Seletor de Tipo de Movimentação */}
          <div>
            <label className="form-label">Tipo de Movimentação *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  setMovementForm({ ...movementForm, type: "IN" })
                }
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  movementForm.type === "IN"
                    ? "bg-[#ECFDF5] text-[#16A36A] border-[#16A36A]"
                    : "bg-white text-[#737D75] border-[#E7EAE7]"
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Entrada
              </button>
              <button
                type="button"
                onClick={() =>
                  setMovementForm({ ...movementForm, type: "OUT" })
                }
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  movementForm.type === "OUT"
                    ? "bg-[#FFFBEB] text-[#D97706] border-[#D97706]"
                    : "bg-white text-[#737D75] border-[#E7EAE7]"
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Saída
              </button>
              <button
                type="button"
                onClick={() =>
                  setMovementForm({ ...movementForm, type: "LOSS" })
                }
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  movementForm.type === "LOSS"
                    ? "bg-[#FEF2F2] text-[#DC4C4C] border-[#DC4C4C]"
                    : "bg-white text-[#737D75] border-[#E7EAE7]"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Perda
              </button>
            </div>
          </div>

          {/* Seletor do Produto com Barra de Busca + Dropdown */}
          <div ref={productDropdownRef} className="relative">
            <label className="form-label">Produto / Insumo *</label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#737D75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={
                  isProductDropdownOpen
                    ? productSearchQuery
                    : selectedMovementProduct
                    ? `${selectedMovementProduct.name} (Saldo: ${selectedMovementProduct.currentStock} ${selectedMovementProduct.unit} • Médio: ${fmtUnitCost(
                        selectedMovementProduct.averageUnitCost
                      )}/${selectedMovementProduct.unit})`
                    : productSearchQuery
                }
                onFocus={() => setIsProductDropdownOpen(true)}
                onClick={() => setIsProductDropdownOpen(true)}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  if (!isProductDropdownOpen) setIsProductDropdownOpen(true);
                }}
                placeholder={
                  selectedMovementProduct
                    ? `Buscar outro produto (Atual: ${selectedMovementProduct.name})...`
                    : "Digite para buscar produto por nome, fornecedor ou categoria..."
                }
                className="w-full h-10 pl-9 pr-16 text-sm text-[#252B27] bg-white border border-[#E7EAE7] rounded-lg focus:outline-none focus:border-[#247653] focus:ring-2 focus:ring-[#247653]/15 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isProductDropdownOpen && productSearchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductSearchQuery("");
                    }}
                    className="p-1 rounded-md text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setIsProductDropdownOpen((prev) => !prev)
                  }
                  className="p-1 rounded-md text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] cursor-pointer"
                  title="Abrir lista de produtos"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isProductDropdownOpen ? "rotate-180 text-[#247653]" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Dropdown Flutuante de Seleção de Produto */}
            {isProductDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E7EAE7] rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-3.5 py-2 bg-[#F7F8F6] border-b border-[#E7EAE7] flex items-center justify-between text-[11px] text-[#737D75] font-medium">
                  <span>
                    {filteredMovementProducts.length} produto(s) encontrado(s)
                  </span>
                  <span>Clique para selecionar</span>
                </div>

                {filteredMovementProducts.length === 0 ? (
                  <div className="p-5 text-center space-y-2">
                    <p className="text-xs text-[#737D75]">
                      Nenhum produto encontrado para &ldquo;{productSearchQuery}&rdquo;.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsProductDropdownOpen(false);
                        setShowMovementModal(false);
                        handleOpenCreateProduct();
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Cadastrar Novo Produto
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto divide-y divide-[#F1F3F1]">
                    {filteredMovementProducts.map((p) => {
                      const isSelected = p.id === movementProductId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setMovementProductId(p.id);
                            setProductSearchQuery("");
                            setIsProductDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#E9F3EC]/80 hover:bg-[#E9F3EC]"
                              : "hover:bg-[#F7F8F6]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm truncate ${
                                  isSelected
                                    ? "font-bold text-[#142D26]"
                                    : "font-semibold text-[#252B27]"
                                }`}
                              >
                                {p.name}
                              </span>
                              {p.isLowStock && (
                                <Badge variant="error" size="sm">
                                  Crítico
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-[#737D75] truncate">
                              {CATEGORY_NAMES[p.category] || p.category}
                              {p.supplier ? ` • ${p.supplier}` : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 text-right">
                            <div>
                              <div
                                className={`text-xs font-bold ${
                                  p.isLowStock
                                    ? "text-[#DC4C4C]"
                                    : "text-[#252B27]"
                                }`}
                              >
                                Saldo: {p.currentStock.toLocaleString("pt-BR")}{" "}
                                {p.unit}
                              </div>
                              <div className="text-[11px] text-[#737D75]">
                                Médio: {fmtUnitCost(p.averageUnitCost)}/{p.unit}
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isSelected
                                  ? "bg-[#247653] text-white"
                                  : "border border-[#D5DBD5] text-transparent"
                              }`}
                            >
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`grid grid-cols-1 ${
              movementForm.type === "IN" ? "sm:grid-cols-2" : ""
            } gap-3.5`}
          >
            <Input
              label={`Quantidade (${selectedMovementProduct?.unit || "UN"}) *`}
              type="number"
              step="any"
              required
              placeholder={`Ex: 500 (${selectedMovementProduct?.unit || "ML"})`}
              value={movementForm.quantity}
              onChange={(e) =>
                setMovementForm({ ...movementForm, quantity: e.target.value })
              }
            />

            {movementForm.type === "IN" && (
              <Input
                label="Valor Pago por este Produto (R$) *"
                type="number"
                step="0.01"
                required
                placeholder="Ex: 65,00"
                hint={
                  parseFloat(movementForm.quantity) > 0 &&
                  parseFloat(movementForm.totalCost) >= 0
                    ? `Custo unitário desta entrada: ${fmtUnitCost(
                        parseFloat(movementForm.totalCost) /
                          parseFloat(movementForm.quantity)
                      )} / ${selectedMovementProduct?.unit || "UN"}`
                    : "Valor total pago na compra deste lote"
                }
                value={movementForm.totalCost}
                onChange={(e) =>
                  setMovementForm({
                    ...movementForm,
                    totalCost: e.target.value,
                  })
                }
              />
            )}
          </div>

          <Input
            label="Motivo / Observação *"
            required
            placeholder={
              movementForm.type === "IN"
                ? "Ex: Compra Nota Fiscal #4821 — Fornecedor Vonixx"
                : movementForm.type === "OUT"
                ? "Ex: Preparação de diluição para lavagens da semana"
                : "Ex: Frasco extraviado na bancada / Produto vencido"
            }
            value={movementForm.reason}
            onChange={(e) =>
              setMovementForm({ ...movementForm, reason: e.target.value })
            }
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowMovementModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Confirmar Registro
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO DE MOVIMENTAÇÃO (APENAS ENTRADAS E PERDAS ATIVAS)         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!editingMovement}
        onClose={() => setEditingMovement(null)}
        title="Editar Registro de Movimentação"
        description={
          editingMovement
            ? `Produto: ${editingMovement.product.name} (${
                editingMovement.movement.type === "IN" ? "Entrada" : "Perda"
              })`
            : ""
        }
        size="md"
      >
        {editingMovement && (
          <form onSubmit={handleSaveEditMovement} className="space-y-4">
            <Input
              label={`Quantidade (${editingMovement.product.unit})`}
              type="number"
              step="any"
              required
              value={editMovementForm.quantity}
              onChange={(e) =>
                setEditMovementForm({
                  ...editMovementForm,
                  quantity: e.target.value,
                })
              }
            />

            {editingMovement.movement.type === "IN" && (
              <Input
                label="Valor Pago na Entrada (R$)"
                type="number"
                step="0.01"
                required
                value={editMovementForm.totalCost}
                onChange={(e) =>
                  setEditMovementForm({
                    ...editMovementForm,
                    totalCost: e.target.value,
                  })
                }
              />
            )}

            <Input
              label="Motivo / Justificativa"
              required
              value={editMovementForm.reason}
              onChange={(e) =>
                setEditMovementForm({
                  ...editMovementForm,
                  reason: e.target.value,
                })
              }
            />

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingMovement(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={submitting}>
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
