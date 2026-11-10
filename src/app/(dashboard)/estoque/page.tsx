"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  DollarSign,
  Layers,
  History,
  TrendingDown,
} from "lucide-react";

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

  // Modal Novo Produto
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

  // Modal Movimentação
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: "IN", // IN | OUT | LOSS
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-7 h-7 text-cyan-400" />
            Controle de Insumos & Produtos Químicos
          </h1>
          <p className="text-slate-400 text-sm">
            Gestão de estoque mínimo, consumo de diluições e inventário com alertas de reposição.
          </p>
        </div>

        <button
          onClick={() => setShowProductModal(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Total de Itens Cadastrados</span>
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">
              {summary.totalProducts} produtos
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Controle por mililitros, litros, gramas e unidades
            </div>
          </div>

          <div
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`border rounded-xl p-5 shadow-sm cursor-pointer transition-all ${
              summary.lowStockCount > 0
                ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
                : "bg-slate-900 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span className="font-semibold text-rose-400">Estoque Crítico / Abaixo do Mínimo</span>
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">
              {summary.lowStockCount} alertas
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {lowStockFilter ? "Mostrando apenas críticos (clique para limpar)" : "Clique para filtrar apenas estoque crítico"}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Valor Imobilizado em Estoque</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              R$ {summary.totalInventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Custo de reposição total dos químicos e insumos
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar produto ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
        >
          <option value="">Todas as Categorias</option>
          <option value="CHEMICAL">Químicos & Insumos</option>
          <option value="ACCESSORY">Acessórios & Boinas</option>
          <option value="TOOL">Ferramentas & Maquinários</option>
        </select>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Produto / Insumo</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Saldo em Estoque</th>
                <th className="px-6 py-3">Estoque Mínimo</th>
                <th className="px-6 py-3">Custo Unitário</th>
                <th className="px-6 py-3">Valor Total</th>
                <th className="px-6 py-3 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Nenhum produto cadastrado no estoque.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-100">{product.name}</div>
                      {product.supplier && (
                        <div className="text-xs text-slate-500">Fornecedor: {product.supplier}</div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {CATEGORY_NAMES[product.category] || product.category}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            product.isLowStock ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {product.currentStock.toLocaleString("pt-BR")} {product.unit}
                        </span>
                        {product.isLowStock && (
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-semibold">
                            Repor
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {product.minStock} {product.unit}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      R$ {product.costPrice.toFixed(2)} / {product.unit}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-100">
                      R$ {product.totalInventoryValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowMovementModal(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 text-xs px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        Movimentar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Produto */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Cadastrar Produto / Insumo Químico
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vonixx V-Floc Shampoo Concentrado"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value="CHEMICAL">Químicos & Insumos</option>
                    <option value="ACCESSORY">Acessórios & Boinas</option>
                    <option value="TOOL">Ferramentas & Equipamentos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value="ML">Mililitros (ML)</option>
                    <option value="L">Litros (L)</option>
                    <option value="G">Gramas (G)</option>
                    <option value="KG">Quilos (KG)</option>
                    <option value="UN">Unidade (UN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Saldo Inicial
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={productForm.currentStock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, currentStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={productForm.minStock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, minStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Custo Unit. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.costPrice}
                    onChange={(e) =>
                      setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Fornecedor / Distribuidor (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Detailer Distribuidora, Vonixx Oficial"
                  value={productForm.supplier}
                  onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Salvando..." : "Salvar no Estoque"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Movimentação */}
      {showMovementModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-cyan-400" />
              Movimentação de Estoque
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Item: <span className="text-slate-200 font-semibold">{selectedProduct.name}</span>{" "}
              (Saldo atual: {selectedProduct.currentStock} {selectedProduct.unit})
            </p>

            <form onSubmit={handleCreateMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tipo de Operação *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: "IN" })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      movementForm.type === "IN"
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: "OUT" })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      movementForm.type === "OUT"
                        ? "bg-amber-600 text-white border-amber-500"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Saída / Consumo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, type: "LOSS" })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                      movementForm.type === "LOSS"
                        ? "bg-rose-600 text-white border-rose-500"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Perda / Avaria
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantidade ({selectedProduct.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={`Ex: 500 (${selectedProduct.unit})`}
                  value={movementForm.quantity}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, quantity: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Motivo / Justificativa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra NF 4821, Preparação de diluição 1:40, Frasco quebrado"
                  value={movementForm.reason}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, reason: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Registrando..." : "Confirmar Movimentação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

