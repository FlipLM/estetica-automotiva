"use client";

import { useEffect, useMemo, useState } from "react";
import { Beaker, Calculator, PackageCheck, Wrench } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { formatDateInputValue } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/utils";
import {
  calculateMovingAverageCost,
  computeConcentrateFromDilution,
  formatStockQuantity,
  parseDilutionRatio,
} from "@/lib/inventory";
import type {
  ActiveOrderOption,
  InventoryProduct,
  ProductMovementItem,
} from "./types";

export type MovementModalMode = "IN" | "OUT" | "LOSS" | "ADJUSTMENT";

interface StockMovementModalProps {
  isOpen: boolean;
  product: InventoryProduct | null;
  mode: MovementModalMode;
  isAdmin: boolean;
  activeOrders: ActiveOrderOption[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function StockMovementModal({
  isOpen,
  product,
  mode,
  isAdmin,
  activeOrders,
  onClose,
  onSuccess,
}: StockMovementModalProps) {
  const [buyMode, setBuyMode] = useState<"DIRECT" | "PACK">("DIRECT");
  const [packCount, setPackCount] = useState("1");
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(formatDateInputValue(new Date()));
  const [paid, setPaid] = useState(true);
  const [dueDate, setDueDate] = useState(formatDateInputValue(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [createExpense, setCreateExpense] = useState(true);

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [markOpened, setMarkOpened] = useState(false);

  // Calculadora rápida de diluição (para borrifadores / baldes no pátio)
  const [useDilutionHelper, setUseDilutionHelper] = useState(false);
  const [bottleVolume, setBottleVolume] = useState("1000");
  const [dilutionText, setDilutionText] = useState("1:10");

  // Ajuste físico de inventário
  const [targetStock, setTargetStock] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !product) return;
    setError(null);
    const today = formatDateInputValue(new Date());

    setBuyMode(product.packSize && product.packSize > 0 ? "PACK" : "DIRECT");
    setPackCount("1");
    setQuantity(
      mode === "IN" && product.packSize ? String(product.packSize) : ""
    );
    setTotalCost("");
    setSupplier(product.supplier || "");
    setPurchasedAt(today);
    setPaid(true);
    setDueDate(today);
    setPaymentMethod("PIX");
    setCreateExpense(true);
    setSelectedOrderId("");
    setReason("");
    setMarkOpened(
      Boolean(product.daysValidAfterOpen && !product.openedAt && mode === "OUT")
    );
    setUseDilutionHelper(false);
    setBottleVolume("1000");
    setDilutionText(product.defaultDilution || "1:10");
    setTargetStock(String(product.currentStock));
  }, [isOpen, product, mode]);

  // Sincroniza quantidade ao comprar por embalagens
  useEffect(() => {
    if (mode === "IN" && buyMode === "PACK" && product?.packSize) {
      const packs = parseFloat(packCount) || 0;
      const computed = Math.round(packs * product.packSize * 1000) / 1000;
      setQuantity(computed > 0 ? String(computed) : "");
    }
  }, [mode, buyMode, packCount, product]);

  // Calculadora de diluição ao preparar solução
  const dilutionCalc = useMemo(() => {
    const ratio = parseDilutionRatio(dilutionText);
    const vol = parseFloat(bottleVolume) || 0;
    if (!ratio || vol <= 0) return null;
    return computeConcentrateFromDilution({ containerVolume: vol, ratio });
  }, [dilutionText, bottleVolume]);

  useEffect(() => {
    if (mode === "OUT" && useDilutionHelper && dilutionCalc) {
      setQuantity(String(dilutionCalc.concentrateAmount));
    }
  }, [mode, useDilutionHelper, dilutionCalc]);

  const numericQty = parseFloat(quantity) || 0;
  const numericTotalCost = parseFloat(totalCost) || 0;

  const avgCostPreview = useMemo(() => {
    if (!product || mode !== "IN" || numericQty <= 0) return null;
    return calculateMovingAverageCost({
      currentStock: product.currentStock,
      currentCostPrice: product.costPrice,
      incomingQty: numericQty,
      incomingTotalCost: numericTotalCost,
    });
  }, [product, mode, numericQty, numericTotalCost]);

  if (!product) return null;

  const titleByMode: Record<MovementModalMode, string> = {
    IN: `Registrar Compra / Entrada — ${product.name}`,
    OUT: `Pegar / Usar Produto — ${product.name}`,
    LOSS: `Registrar Perda ou Avaria — ${product.name}`,
    ADJUSTMENT: `Ajuste de Inventário Físico — ${product.name}`,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError(null);

    try {
      if (mode === "ADJUSTMENT") {
        const parsedTarget = parseFloat(targetStock);
        if (Number.isNaN(parsedTarget) || parsedTarget < 0) {
          throw new Error("Informe uma contagem física válida maior ou igual a zero.");
        }
        const res = await fetch(`/api/products/${product.id}/movement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ADJUSTMENT",
            targetStock: parsedTarget,
            reason: reason.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao ajustar inventário.");
        onSuccess(`Saldo de "${product.name}" ajustado para ${formatStockQuantity(parsedTarget, product.unit)}.`);
        onClose();
        return;
      }

      if (numericQty <= 0) {
        throw new Error("Informe uma quantidade maior que zero.");
      }

      if (mode === "IN") {
        const res = await fetch(`/api/products/${product.id}/movement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "IN",
            quantity: numericQty,
            totalCost: totalCost.trim() ? numericTotalCost : undefined,
            supplier: supplier.trim() || null,
            purchasedAt,
            paid,
            dueDate: paid ? purchasedAt : dueDate,
            paymentMethod,
            createExpense,
            reason: reason.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao lançar entrada.");
        onSuccess(
          `Entrada de ${formatStockQuantity(numericQty, product.unit)} registrada para "${product.name}".`
        );
        onClose();
        return;
      }

      // OUT ou LOSS (com vínculo opcional à OS tornando OS_CONSUMPTION quando aplicável)
      const effectiveType =
        mode === "LOSS"
          ? "LOSS"
          : selectedOrderId
          ? "OS_CONSUMPTION"
          : "OUT";

      const dilutionNote =
        mode === "OUT" && useDilutionHelper && dilutionCalc
          ? `Diluição ${dilutionText} (${bottleVolume}ml total -> ${dilutionCalc.concentrateAmount}${product.unit} produto)`
          : "";
      const finalReason = [dilutionNote, reason.trim()].filter(Boolean).join(" • ");

      const res = await fetch(`/api/products/${product.id}/movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: effectiveType,
          quantity: numericQty,
          serviceOrderId: selectedOrderId || null,
          reason: finalReason || undefined,
          markOpened: mode === "OUT" ? markOpened : false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar movimentação.");

      onSuccess(
        mode === "LOSS"
          ? `Perda de ${formatStockQuantity(numericQty, product.unit)} registrada.`
          : `Baixa de ${formatStockQuantity(numericQty, product.unit)} registrada em "${product.name}".`
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao processar movimentação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleByMode[mode]}
      description={`Saldo atual em estoque: ${formatStockQuantity(product.currentStock, product.unit)}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {mode === "IN" && isAdmin && (
          <>
            {product.packSize && product.packSize > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBuyMode("PACK")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    buyMode === "PACK"
                      ? "bg-[#E9F3EC] border-[#247653] text-[#142D26]"
                      : "bg-white border-[#E7EAE7] text-[#737D75]"
                  }`}
                >
                  Comprar por Embalagem ({product.packLabel || `${product.packSize} ${product.unit}`})
                </button>
                <button
                  type="button"
                  onClick={() => setBuyMode("DIRECT")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    buyMode === "DIRECT"
                      ? "bg-[#E9F3EC] border-[#247653] text-[#142D26]"
                      : "bg-white border-[#E7EAE7] text-[#737D75]"
                  }`}
                >
                  Informar em {product.unit}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buyMode === "PACK" && product.packSize ? (
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Qtd de Embalagens ({product.packLabel || `${product.packSize} ${product.unit}`})
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={packCount}
                    onChange={(e) => setPackCount(e.target.value)}
                    className="dp-input font-semibold"
                  />
                  <p className="text-[11px] text-[#247653] mt-1 font-medium">
                    Total convertido: {formatStockQuantity(numericQty, product.unit)}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Quantidade Comprada ({product.unit}) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="dp-input font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Valor Total da Nota/Compra (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 189.90"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="dp-input font-semibold"
                />
              </div>
            </div>

            {avgCostPreview !== null && (
              <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] text-xs flex items-center justify-between">
                <span className="text-[#737D75]">Novo Custo Médio Ponderado:</span>
                <span className="font-bold text-[#142D26]">
                  {formatCurrency(avgCostPreview)} / {product.unit}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Fornecedor
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
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={purchasedAt}
                  onChange={(e) => setPurchasedAt(e.target.value)}
                  className="dp-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Condição de Pagamento
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
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Vencimento
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
                  <label className="block text-xs font-semibold text-[#343C36] mb-1">
                    Forma de Pagamento
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
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-[#343C36] cursor-pointer">
              <input
                type="checkbox"
                checked={createExpense}
                onChange={(e) => setCreateExpense(e.target.checked)}
                className="w-4 h-4 accent-[#247653]"
              />
              <span>Gerar despesa vinculada no módulo Financeiro</span>
            </label>
          </>
        )}

        {(mode === "OUT" || mode === "LOSS") && (
          <>
            {mode === "OUT" && product.category === "CHEMICAL" && (
              <div className="p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-2.5">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-[#252B27] flex items-center gap-1.5">
                    <Beaker className="w-4 h-4 text-[#247653]" />
                    Calculadora de Diluição (Borrifador / Balde)
                  </span>
                  <input
                    type="checkbox"
                    checked={useDilutionHelper}
                    onChange={(e) => setUseDilutionHelper(e.target.checked)}
                    className="w-4 h-4 accent-[#247653]"
                  />
                </label>

                {useDilutionHelper && (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                          Recipiente ({product.unit})
                        </label>
                        <select
                          value={bottleVolume}
                          onChange={(e) => setBottleVolume(e.target.value)}
                          className="dp-input text-xs"
                        >
                          <option value="500">500 {product.unit} (Borrifador)</option>
                          <option value="1000">1000 {product.unit} (1 Litro / Snow Foam)</option>
                          <option value="2000">2000 {product.unit} (2 Litros)</option>
                          <option value="5000">5000 {product.unit} (5 Litros / Balde)</option>
                          <option value="10000">10000 {product.unit} (10 Litros / Balde)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#343C36] mb-1">
                          Proporção (ex: 1:10)
                        </label>
                        <input
                          type="text"
                          value={dilutionText}
                          onChange={(e) => setDilutionText(e.target.value)}
                          placeholder="1:10"
                          className="dp-input text-xs"
                        />
                      </div>
                    </div>
                    {dilutionCalc ? (
                      <div className="p-2.5 rounded-lg bg-[#E9F3EC] text-[#142D26] text-xs flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-[#247653] shrink-0" />
                        <span>
                          Use <strong>{dilutionCalc.concentrateAmount} {product.unit}</strong> de produto concentrado +{" "}
                          <strong>{dilutionCalc.waterAmount} {product.unit}</strong> de água.
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#DC4C4C]">
                        Informe uma diluição válida no formato 1:10, 1:20 ou 1:50.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#343C36] mb-1">
                Quantidade {mode === "LOSS" ? "Perdida / Danificada" : "Retirada"} ({product.unit}) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                placeholder={`Disponível: ${product.currentStock}`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="dp-input text-base font-bold"
              />
            </div>

            {mode === "OUT" && activeOrders.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1">
                  Vincular a uma Ordem de Serviço (Opcional)
                </label>
                <div className="relative">
                  <Wrench className="w-3.5 h-3.5 text-[#737D75] absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="dp-input pl-9"
                  >
                    <option value="">Uso geral no pátio / bancada</option>
                    {activeOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        OS #{o.orderNumber} — {o.vehicleLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {mode === "OUT" && product.daysValidAfterOpen && !product.openedAt && (
              <label className="inline-flex items-center gap-2 text-xs text-[#343C36] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2 w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={markOpened}
                  onChange={(e) => setMarkOpened(e.target.checked)}
                  className="w-4 h-4 accent-[#D97706]"
                />
                <span>
                  Este frasco acabou de ser aberto agora (iniciar contagem de{" "}
                  <strong>{product.daysValidAfterOpen} dias</strong> de validade)
                </span>
              </label>
            )}
          </>
        )}

        {mode === "ADJUSTMENT" && isAdmin && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] text-xs flex items-center justify-between">
              <span className="text-[#737D75]">Saldo registrado no sistema:</span>
              <span className="font-bold text-[#252B27]">
                {formatStockQuantity(product.currentStock, product.unit)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#343C36] mb-1">
                Saldo Físico Contado na Prateleira ({product.unit}) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={targetStock}
                onChange={(e) => setTargetStock(e.target.value)}
                className="dp-input text-base font-bold"
              />
              {targetStock !== "" && !Number.isNaN(parseFloat(targetStock)) && (
                <p className="text-[11px] mt-1 font-medium text-[#343C36]">
                  Diferença de ajuste:{" "}
                  <strong
                    className={
                      parseFloat(targetStock) - product.currentStock >= 0
                        ? "text-[#16A36A]"
                        : "text-[#DC4C4C]"
                    }
                  >
                    {parseFloat(targetStock) - product.currentStock >= 0 ? "+" : ""}
                    {formatStockQuantity(
                      parseFloat(targetStock) - product.currentStock,
                      product.unit
                    )}
                  </strong>
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#343C36] mb-1">
            {mode === "LOSS" ? "Motivo da Perda / Ocorrência *" : "Observação (Opcional)"}
          </label>
          <input
            type="text"
            required={mode === "LOSS"}
            placeholder={
              mode === "LOSS"
                ? "Ex: Galão caiu no pátio, frasco cristalizou"
                : mode === "ADJUSTMENT"
                ? "Ex: Conferência física mensal de prateleira"
                : "Ex: Preparo de bancada ou box"
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="dp-input"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7EAE7]">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={mode === "LOSS" ? "destructive" : "primary"}
            loading={saving}
            leftIcon={<PackageCheck className="w-4 h-4" />}
          >
            {mode === "IN"
              ? "Confirmar Entrada"
              : mode === "LOSS"
              ? "Registrar Perda"
              : mode === "ADJUSTMENT"
              ? "Aplicar Ajuste"
              : "Confirmar Retirada"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditMovementModalProps {
  isOpen: boolean;
  movement: ProductMovementItem | null;
  productUnit: string;
  productName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function EditMovementModal({
  isOpen,
  movement,
  productUnit,
  productName,
  onClose,
  onSuccess,
}: EditMovementModalProps) {
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !movement) return;
    setError(null);
    setQuantity(String(movement.quantity));
    setTotalCost(
      movement.totalCost !== null && movement.totalCost !== undefined
        ? String(movement.totalCost)
        : ""
    );
    setReason(movement.reason || "");
  }, [isOpen, movement]);

  if (!movement) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!movement) return;
    setSaving(true);
    setError(null);
    try {
      const parsedQty = parseFloat(quantity);
      if (!parsedQty || parsedQty <= 0) {
        throw new Error("Quantidade deve ser maior que zero.");
      }

      const res = await fetch(`/api/products/${movement.productId}/movement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EDIT_MOVEMENT",
          movementId: movement.id,
          quantity: parsedQty,
          totalCost:
            movement.type === "IN" && totalCost.trim() !== ""
              ? parseFloat(totalCost)
              : undefined,
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar movimentação.");
      onSuccess(`Movimentação de "${productName}" atualizada.`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao editar movimentação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Movimentação — ${productName}`}
      description="Corrige quantidade, motivo e (se entrada) o custo da despesa vinculada."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <label className="block text-xs font-semibold text-[#343C36] mb-1">
            Quantidade ({productUnit}) *
          </label>
          <input
            type="number"
            min="0.01"
            step="any"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="dp-input font-semibold"
          />
        </div>

        {movement.type === "IN" && (
          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1">
              Valor Total Pago (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              className="dp-input font-semibold"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#343C36] mb-1">
            Observação / Motivo
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="dp-input"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7EAE7]">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Salvar Correção
          </Button>
        </div>
      </form>
    </Modal>
  );
}
