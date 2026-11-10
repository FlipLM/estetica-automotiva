"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Layers,
  TrendingDown,
} from "lucide-react";
import {
  Button,
  Badge,
  StatCard,
  PageHeader,
  Modal,
  EmptyState,
  LoadingState,
  Input,
  Select,
  SearchInput,
} from "@/components/ui";

interface Product {
  id: string;
  name: string;
  category: "CHEMICAL" | "ACCESSORY" | "TOOL";
  unit: "ML" | "L" | "G" | "KG" | "UN";
  currentStock: number;
  minStock: number;
  costPrice: number;
  supplier?: string;
  isLowStock: boolean;
  totalInventoryValue: number;
  movements?: {
    id: string;
    type: string;
    quantity: number;
    reason?: string;
    createdAt: string;
  }[];
}

interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  totalInventoryValue: number;
}

const CATEGORY_NAMES = {
  CHEMICAL: "Químicos & Insumos",
  ACCESSORY: "Acessórios & Boinas",
  TOOL: "Ferramentas & Maquinários",
};

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "CHEMICAL",
    unit: "ML",
    currentStock: 1000,
    minStock: 200,
    costPrice: 45.0,
    supplier: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: "IN",
    quantity: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productForm.name,
          category: productForm.category,
          unit: productForm.unit,
          currentStock: Number(productForm.currentStock),
          minStock: Number(productForm.minStock),
          costPrice: Number(productForm.costPrice),
          supplier: productForm.supplier || null,
        }),
      });

      if (res.ok) {
        setShowProductModal(false);
        setProductForm({
          name: "",
          category: "CHEMICAL",
          unit: "ML",
          currentStock: 1000,
          minStock: 200,
          costPrice: 45.0,
          supplier: "",
        });
        await fetchInventory();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar produto");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: movementForm.type,
          quantity: parseFloat(movementForm.quantity),
          reason: movementForm.reason,
        }),
      });

      if (res.ok) {
        setShowMovementModal(false);
        setMovementForm({ type: "IN", quantity: "", reason: "" });
        setSelectedProduct(null);
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

  const fmtCurrency = (val: number) =>
    `R$ ${(val ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque de Produtos e Insumos"
        description="Gestão de estoque mínimo, consumo de diluições e alertas de reposição de químicos e acessórios."
        actions={
          <Button
            variant="primary"
            onClick={() => setShowProductModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Produto
          </Button>
        }
      />

      {loading ? (
        <LoadingState message="Carregando inventário de produtos..." />
      ) : (
        <>
          {/* Cards de Resumo */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Total de Itens Cadastrados"
                value={`${summary.totalProducts} produtos`}
                subtitle="Controle por ML, L, G, KG e unidades"
                icon={<Layers className="w-5 h-5" />}
                variant="brand"
              />
              <div onClick={() => setLowStockFilter(!lowStockFilter)} className="cursor-pointer">
                <StatCard
                  label="Estoque Crítico / Abaixo do Mínimo"
                  value={`${summary.lowStockCount} alertas`}
                  subtitle={
                    lowStockFilter
                      ? "Mostrando apenas críticos (clique para mostrar todos)"
                      : "Clique para filtrar apenas estoque crítico"
                  }
                  icon={<AlertTriangle className="w-5 h-5" />}
                  variant={summary.lowStockCount > 0 ? "error" : "default"}
                />
              </div>
              <StatCard
                label="Valor Imobilizado em Estoque"
                value={fmtCurrency(summary.totalInventoryValue)}
                subtitle="Custo total estimado dos insumos"
                icon={<DollarSign className="w-5 h-5" />}
                variant="success"
              />
            </div>
          )}

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1">
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

          {/* Tabela de Produtos */}
          <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
            {products.length === 0 ? (
              <EmptyState
                icon={<Package className="w-6 h-6" />}
                title="Nenhum produto encontrado"
                description="Cadastre shampoos automotivos, vitrificadores, compostos polidores e boinas para controlar o consumo da estética."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowProductModal(true)}
                  >
                    Cadastrar Produto
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Produto / Insumo</th>
                      <th className="px-6 py-3 font-semibold">Categoria</th>
                      <th className="px-6 py-3 font-semibold">Saldo Atual</th>
                      <th className="px-6 py-3 font-semibold">Estoque Mínimo</th>
                      <th className="px-6 py-3 font-semibold">Custo Unitário</th>
                      <th className="px-6 py-3 font-semibold">Valor Total</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F1]">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-[#F7F8F6]/70 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-[#252B27]">{product.name}</div>
                          {product.supplier && (
                            <div className="text-xs text-[#737D75]">
                              Fornecedor: {product.supplier}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral" size="sm">
                            {CATEGORY_NAMES[product.category] || product.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                product.isLowStock ? "text-[#DC4C4C]" : "text-[#16A36A]"
                              }`}
                            >
                              {product.currentStock.toLocaleString("pt-BR")} {product.unit}
                            </span>
                            {product.isLowStock && (
                              <Badge variant="error" size="sm">
                                Repor
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-[#737D75]">
                          {product.minStock} {product.unit}
                        </td>
                        <td className="px-6 py-3.5 text-[#252B27]">
                          {fmtCurrency(product.costPrice)} / {product.unit}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-[#252B27]">
                          {fmtCurrency(product.totalInventoryValue)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowMovementModal(true);
                            }}
                            leftIcon={<ArrowDownRight className="w-3.5 h-3.5 text-[#247653]" />}
                          >
                            Movimentar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Novo Produto */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Cadastrar Produto / Insumo"
        description="Adicione um novo item químico, acessório ou ferramenta ao estoque."
        size="md"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Nome do Produto"
            required
            placeholder="Ex: Vonixx V-Floc Shampoo Concentrado"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Categoria"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              options={[
                { value: "CHEMICAL", label: "Químicos & Insumos" },
                { value: "ACCESSORY", label: "Acessórios & Boinas" },
                { value: "TOOL", label: "Ferramentas & Equipamentos" },
              ]}
            />

            <Select
              label="Unidade de Medida"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
              options={[
                { value: "ML", label: "Mililitros (ML)" },
                { value: "L", label: "Litros (L)" },
                { value: "G", label: "Gramas (G)" },
                { value: "KG", label: "Quilos (KG)" },
                { value: "UN", label: "Unidade (UN)" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="Saldo Inicial"
              type="number"
              step="any"
              required
              value={productForm.currentStock}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  currentStock: parseFloat(e.target.value) || 0,
                })
              }
            />

            <Input
              label="Estoque Mínimo"
              type="number"
              step="any"
              required
              value={productForm.minStock}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  minStock: parseFloat(e.target.value) || 0,
                })
              }
            />

            <Input
              label="Custo Unit. (R$)"
              type="number"
              step="0.01"
              required
              value={productForm.costPrice}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  costPrice: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <Input
            label="Fornecedor / Distribuidor (opcional)"
            placeholder="Ex: Detailer Distribuidora, Vonixx Oficial"
            value={productForm.supplier}
            onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowProductModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Salvar no Estoque
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Movimentação */}
      <Modal
        isOpen={showMovementModal && !!selectedProduct}
        onClose={() => setShowMovementModal(false)}
        title="Movimentação de Estoque"
        description={
          selectedProduct
            ? `Item: ${selectedProduct.name} (Saldo atual: ${selectedProduct.currentStock} ${selectedProduct.unit})`
            : ""
        }
        size="md"
      >
        {selectedProduct && (
          <form onSubmit={handleCreateMovement} className="space-y-4">
            <div>
              <label className="form-label">Tipo de Operação *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: "IN" })}
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
                  onClick={() => setMovementForm({ ...movementForm, type: "OUT" })}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    movementForm.type === "OUT"
                      ? "bg-[#FFFBEB] text-[#D97706] border-[#D97706]"
                      : "bg-white text-[#737D75] border-[#E7EAE7]"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Consumo
                </button>
                <button
                  type="button"
                  onClick={() => setMovementForm({ ...movementForm, type: "LOSS" })}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    movementForm.type === "LOSS"
                      ? "bg-[#FEF2F2] text-[#DC4C4C] border-[#DC4C4C]"
                      : "bg-white text-[#737D75] border-[#E7EAE7]"
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Perda / Avaria
                </button>
              </div>
            </div>

            <Input
              label={`Quantidade (${selectedProduct.unit})`}
              type="number"
              step="any"
              required
              placeholder={`Ex: 500 (${selectedProduct.unit})`}
              value={movementForm.quantity}
              onChange={(e) =>
                setMovementForm({ ...movementForm, quantity: e.target.value })
              }
            />

            <Input
              label="Motivo / Justificativa"
              required
              placeholder="Ex: Compra NF 4821, Preparação de diluição 1:40, Frasco avariado"
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
                Confirmar Movimentação
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
