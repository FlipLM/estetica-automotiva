"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { formatDateInputValue } from "@/lib/date-utils";
import {
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  UNIT_FULL_LABELS,
} from "@/lib/inventory";
import type { InventoryProduct, ProductCategory, ProductUnit } from "./types";

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: InventoryProduct | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function ProductFormModal({
  isOpen,
  editingProduct,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEditing = !!editingProduct;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("CHEMICAL");
  const [unit, setUnit] = useState<ProductUnit>("ML");
  const [minStock, setMinStock] = useState("500");
  const [currentStock, setCurrentStock] = useState("0");
  const [costPrice, setCostPrice] = useState("0");
  const [totalPaidInitial, setTotalPaidInitial] = useState("");
  const [packSize, setPackSize] = useState("");
  const [packLabel, setPackLabel] = useState("");
  const [defaultDilution, setDefaultDilution] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [daysValidAfterOpen, setDaysValidAfterOpen] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(formatDateInputValue(new Date()));
  const [paid, setPaid] = useState(true);
  const [dueDate, setDueDate] = useState(formatDateInputValue(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [createExpense, setCreateExpense] = useState(true);
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setUnit(editingProduct.unit);
      setMinStock(String(editingProduct.minStock));
      setCurrentStock(String(editingProduct.currentStock));
      setCostPrice(String(editingProduct.costPrice || 0));
      setTotalPaidInitial("");
      setPackSize(editingProduct.packSize ? String(editingProduct.packSize) : "");
      setPackLabel(editingProduct.packLabel || "");
      setDefaultDilution(editingProduct.defaultDilution || "");
      setExpirationDate(
        editingProduct.expirationDate
          ? formatDateInputValue(new Date(editingProduct.expirationDate))
          : ""
      );
      setDaysValidAfterOpen(
        editingProduct.daysValidAfterOpen
          ? String(editingProduct.daysValidAfterOpen)
          : ""
      );
      setSupplier(editingProduct.supplier || "");
      setPurchasedAt(
        editingProduct.purchasedAt
          ? formatDateInputValue(new Date(editingProduct.purchasedAt))
          : formatDateInputValue(new Date())
      );
      setPaid(true);
      setDueDate(formatDateInputValue(new Date()));
      setPaymentMethod("PIX");
      setCreateExpense(true);
      setActive(editingProduct.active);
    } else {
      const today = formatDateInputValue(new Date());
      setName("");
      setCategory("CHEMICAL");
      setUnit("ML");
      setMinStock("500");
      setCurrentStock("0");
      setCostPrice("");
      setTotalPaidInitial("");
      setPackSize("");
      setPackLabel("");
      setDefaultDilution("");
      setExpirationDate("");
      setDaysValidAfterOpen("");
      setSupplier("");
      setPurchasedAt(today);
      setPaid(true);
      setDueDate(today);
      setPaymentMethod("PIX");
      setCreateExpense(true);
      setActive(true);
    }
  }, [isOpen, editingProduct]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const parsedMin = parseFloat(minStock) || 0;
      const parsedPack = packSize.trim() ? parseFloat(packSize) : null;
      const parsedPotLife = daysValidAfterOpen.trim()
        ? parseInt(daysValidAfterOpen, 10)
        : null;

      if (isEditing && editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            category,
            unit,
            minStock: parsedMin,
            costPrice: parseFloat(costPrice) || 0,
            supplier: supplier.trim() || null,
            purchasedAt: purchasedAt || null,
            packSize: parsedPack,
            packLabel: packLabel.trim() || null,
            defaultDilution: defaultDilution.trim() || null,
            expirationDate: expirationDate || null,
            daysValidAfterOpen: parsedPotLife,
            active,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Não foi possível atualizar o produto.");
        }
        onSaved(`Produto "${name.trim()}" atualizado com sucesso.`);
      } else {
        const parsedStock = parseFloat(currentStock) || 0;
        const parsedTotalPaid = totalPaidInitial.trim()
          ? parseFloat(totalPaidInitial)
          : undefined;
        const parsedCost = costPrice.trim() ? parseFloat(costPrice) : undefined;

        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            category,
            unit,
            currentStock: parsedStock,
            minStock: parsedMin,
            costPrice: parsedCost,
            totalPaidInitial: parsedTotalPaid,
            packSize: parsedPack,
            packLabel: packLabel.trim() || null,
            defaultDilution: defaultDilution.trim() || null,
            expirationDate: expirationDate || null,
            daysValidAfterOpen: parsedPotLife,
            supplier: supplier.trim() || null,
            purchasedAt: purchasedAt || null,
            createExpense,
            paid,
            dueDate: paid ? purchasedAt : dueDate,
            paymentMethod,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Não foi possível cadastrar o produto.");
        }
        onSaved(`Produto "${name.trim()}" cadastrado no catálogo.`);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Produto: ${editingProduct?.name}` : "Novo Insumo / Produto"}
      description={
        isEditing
          ? "Altere ficha técnica, embalagem de compra, validade e custo unitário."
          : "Cadastre químicos, panos, acessórios ou equipamentos com controle de custo e validade."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              Nome do Produto / Insumo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Vonixx V-Floc 5L, Menzerna 400, Vitrificador 9H"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="dp-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="dp-input"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              Unidade Base de Consumo
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              className="dp-input"
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {UNIT_FULL_LABELS[u]}
                </option>
              ))}
            </select>
            {isEditing && editingProduct && unit !== editingProduct.unit && (
              <p className="text-[11px] text-[#D97706] mt-1">
                Conversões entre ML/L ou G/KG ajustam saldo e histórico automaticamente.
              </p>
            )}
          </div>
        </div>

        {/* Embalagem de Compra & Padrão de Diluição */}
        <div className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-3">
          <p className="text-xs font-bold text-[#252B27] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#247653]" />
            Embalagem de Compra & Ficha Química
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                Qtd por Embalagem ({unit})
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder={unit === "ML" ? "Ex: 5000" : "Ex: 1"}
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                className="dp-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                Nome da Embalagem
              </label>
              <input
                type="text"
                placeholder="Ex: Galão 5L, Caixa c/ 12"
                value={packLabel}
                onChange={(e) => setPackLabel(e.target.value)}
                className="dp-input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                Diluição Padrão
              </label>
              <input
                type="text"
                placeholder="Ex: 1:10, 1:50 ou Pronto uso"
                value={defaultDilution}
                onChange={(e) => setDefaultDilution(e.target.value)}
                className="dp-input"
              />
            </div>
          </div>
        </div>

        {/* Estoque Mínimo & Validade */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              Estoque Mínimo de Alerta ({unit})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="dp-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              Validade (Lote Fechado)
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="dp-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              Pot-Life após aberto (dias)
            </label>
            <input
              type="number"
              min="1"
              max="3650"
              placeholder="Ex: 30 (vitrificador)"
              value={daysValidAfterOpen}
              onChange={(e) => setDaysValidAfterOpen(e.target.value)}
              className="dp-input"
            />
          </div>
        </div>

        {/* Financeiro / Saldo Inicial */}
        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#343C36] mb-1">
                Custo Médio por {unit} (R$)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="dp-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#343C36] mb-1">
                Fornecedor Principal
              </label>
              <input
                type="text"
                placeholder="Ex: Vonixx, Miromi"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="dp-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#343C36] mb-1">
                Última Compra
              </label>
              <input
                type="date"
                value={purchasedAt}
                onChange={(e) => setPurchasedAt(e.target.value)}
                className="dp-input"
              />
            </div>
            {editingProduct && !editingProduct.active && (
              <div className="sm:col-span-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#247653] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 accent-[#247653]"
                  />
                  <span>Reativar este produto no catálogo operacional</span>
                </label>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#E9F3EC]/45 border border-[#C6E2D0] space-y-3">
            <p className="text-xs font-bold text-[#142D26]">
              Saldo & Compra Inicial (Opcional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                  Quantidade Inicial ({unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  className="dp-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                  Valor Total Pago (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 149.90"
                  value={totalPaidInitial}
                  onChange={(e) => setTotalPaidInitial(e.target.value)}
                  className="dp-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  placeholder="Ex: Distribuidora Detail"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="dp-input"
                />
              </div>
            </div>

            {parseFloat(currentStock) > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    className="dp-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                    Pagamento
                  </label>
                  <select
                    value={paid ? "PAID" : "CREDIT"}
                    onChange={(e) => setPaid(e.target.value === "PAID")}
                    className="dp-input"
                  >
                    <option value="PAID">À Vista (Pago agora)</option>
                    <option value="CREDIT">A Prazo (Contas a Pagar)</option>
                  </select>
                </div>
                {!paid ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                      Vencimento do Boleto
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="dp-input"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                      Meio de Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="dp-input"
                    >
                      <option value="PIX">PIX</option>
                      <option value="CASH">Dinheiro</option>
                      <option value="DEBIT">Cartão de Débito</option>
                      <option value="CREDIT">Cartão de Crédito</option>
                      <option value="TRANSFER">Transferência</option>
                      <option value="BOLETO">Boleto</option>
                    </select>
                  </div>
                )}

                <div className="sm:col-span-3">
                  <label className="inline-flex items-center gap-2 text-xs text-[#343C36] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createExpense}
                      onChange={(e) => setCreateExpense(e.target.checked)}
                      className="w-4 h-4 accent-[#247653]"
                    />
                    <span>Lançar automaticamente no módulo Financeiro (Despesa de Produtos)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7EAE7]">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {isEditing ? "Salvar Alterações" : "Cadastrar Produto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
