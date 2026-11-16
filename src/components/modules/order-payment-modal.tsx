"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { formatDateInputValue } from "@/lib/date-utils";
import {
  calculatePaymentFeeBreakdown,
  PaymentMethodType,
  resolveDefaultFeeRate,
  roundMoney,
  TenantCardFeeRates,
} from "@/lib/payment-fees";

export interface OrderPaymentTarget {
  id: string;
  orderNumber: number;
  plate: string;
  model: string;
  customerName?: string | null;
  totalAmount: number;
  paidAmount?: number | null;
}

interface OrderPaymentModalProps {
  order: OrderPaymentTarget | null;
  onClose: () => void;
  onPaid: () => Promise<void> | void;
  tenantRates?: TenantCardFeeRates | null;
  title?: string;
}

export function OrderPaymentModal({
  order,
  onClose,
  onPaid,
  tenantRates: initialRates,
  title,
}: OrderPaymentModalProps) {
  const [rates, setRates] = useState<TenantCardFeeRates>(initialRates || {});
  const [method, setMethod] = useState<PaymentMethodType>("PIX");
  const [installments, setInstallments] = useState<number>(1);
  const [amountInput, setAmountInput] = useState<string>("");
  const [feeRateInput, setFeeRateInput] = useState<string>("0");
  const [paidAtInput, setPaidAtInput] = useState<string>(
    formatDateInputValue(new Date())
  );
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = order?.totalAmount ?? 0;
  const alreadyPaid = order?.paidAmount ?? 0;
  const remaining = roundMoney(Math.max(0, totalAmount - alreadyPaid));

  useEffect(() => {
    if (!order) return;
    setError(null);
    setMethod("PIX");
    setInstallments(1);
    setAmountInput(remaining.toFixed(2));
    setPaidAtInput(formatDateInputValue(new Date()));
    setNotes("");

    if (initialRates) {
      setRates(initialRates);
      setFeeRateInput("0");
    } else {
      fetch("/api/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.tenant) {
            setRates({
              debitFeeRate: data.tenant.debitFeeRate ?? 0,
              credit1xFeeRate: data.tenant.credit1xFeeRate ?? 0,
              credit2to6FeeRate: data.tenant.credit2to6FeeRate ?? 0,
              credit7to12FeeRate: data.tenant.credit7to12FeeRate ?? 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [order, initialRates, remaining]);

  // Atualiza a taxa sugerida sempre que trocar método ou parcelas
  useEffect(() => {
    const suggested = resolveDefaultFeeRate({
      method,
      installments,
      tenantRates: rates,
    });
    setFeeRateInput(String(suggested));
  }, [method, installments, rates]);

  const parsedAmount = Number(String(amountInput || "0").replace(",", "."));
  const parsedFeeRate = Number(String(feeRateInput || "0").replace(",", "."));
  const safeAmount = Number.isFinite(parsedAmount) ? Math.max(0, parsedAmount) : 0;
  const safeFeeRate = Number.isFinite(parsedFeeRate)
    ? Math.max(0, Math.min(100, parsedFeeRate))
    : 0;

  const preview = calculatePaymentFeeBreakdown({
    amount: safeAmount,
    method,
    installments,
    overrideFeeRate: safeFeeRate,
    tenantRates: rates,
  });

  const isPartial = safeAmount > 0 && safeAmount < remaining - 0.01;

  const fmt = (v: number) =>
    `R$ ${(v ?? 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setError(null);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    if (parsedAmount > remaining + 0.01) {
      setError(
        `O valor informado (${fmt(parsedAmount)}) é maior que o saldo restante (${fmt(
          remaining
        )}).`
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          method,
          installments: method === "CREDIT_CARD" ? installments : 1,
          feeRate: safeFeeRate,
          paidAt: paidAtInput || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível registrar o pagamento.");
        return;
      }

      onClose();
      await onPaid();
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!order}
      onClose={onClose}
      title={title || (order ? `Receber Pagamento — OS #${order.orderNumber}` : "Receber Pagamento")}
      description="Registre o pagamento total ou um sinal/entrada parcial. Taxas de cartão são calculadas automaticamente."
      size="md"
    >
      {order && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-[13px] font-medium">
              {error}
            </div>
          )}

          {/* Resumo da OS */}
          <div className="p-3.5 rounded-[10px] bg-[#E9F3EC] border border-[#C5E2CE] space-y-1.5">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#142D26]">
              <span>
                OS #{order.orderNumber} • {order.customerName || "Cliente"}
              </span>
              <span className="font-mono">{order.plate}</span>
            </div>
            <p className="text-[12px] text-[#343C36]">{order.model}</p>
            <div className="pt-2 mt-1 border-t border-[#C5E2CE] grid grid-cols-3 gap-2 text-[12px]">
              <div>
                <span className="text-[#737D75] block">Total da OS</span>
                <strong className="text-[#142D26]">{fmt(totalAmount)}</strong>
              </div>
              <div>
                <span className="text-[#737D75] block">Já Pago</span>
                <strong className="text-[#16A36A]">{fmt(alreadyPaid)}</strong>
              </div>
              <div className="text-right">
                <span className="text-[#737D75] block">Falta Receber</span>
                <strong className="text-[#247653] text-[14px]">
                  {fmt(remaining)}
                </strong>
              </div>
            </div>
          </div>

          {/* Valor + Atalhos */}
          <div className="space-y-2">
            <Input
              label="Valor que o cliente está pagando agora (R$)"
              type="number"
              step="0.01"
              min="0.01"
              max={remaining + 0.01}
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              rightLabel={
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setAmountInput(roundMoney(remaining * 0.5).toFixed(2))
                    }
                    className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F1F3F1] hover:bg-[#E7EAE7] text-[#343C36] cursor-pointer"
                  >
                    50% Sinal
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountInput(remaining.toFixed(2))}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#E9F3EC] hover:bg-[#D2E7D9] text-[#247653] cursor-pointer"
                  >
                    Restante 100%
                  </button>
                </div>
              }
            />
            {isPartial && (
              <p className="text-[12px] font-medium text-[#D97706]">
                Pagamento parcial (sinal): a OS continuará no pátio com{" "}
                {fmt(roundMoney(remaining - safeAmount))} a receber.
              </p>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Forma de Pagamento"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethodType)}
              options={[
                { value: "PIX", label: "PIX (Taxa 0%)" },
                { value: "DEBIT_CARD", label: "Cartão de Débito" },
                { value: "CREDIT_CARD", label: "Cartão de Crédito" },
                { value: "CASH", label: "Dinheiro em Espécie" },
                { value: "TRANSFER", label: "Transferência Bancária" },
              ]}
            />

            <Input
              label="Data do Recebimento"
              type="date"
              required
              value={paidAtInput}
              onChange={(e) => setPaidAtInput(e.target.value)}
            />
          </div>

          {/* Parcelas + Taxa quando cartão */}
          {(method === "CREDIT_CARD" || method === "DEBIT_CARD") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {method === "CREDIT_CARD" && (
                <Select
                  label="Parcelas no Cartão"
                  value={String(installments)}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  options={Array.from({ length: 12 }, (_, idx) => {
                    const n = idx + 1;
                    return {
                      value: String(n),
                      label:
                        n === 1
                          ? "1x (À vista no crédito)"
                          : `${n}x parcelado`,
                    };
                  })}
                />
              )}

              <Input
                label="Taxa da Maquininha (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={feeRateInput}
                onChange={(e) => setFeeRateInput(e.target.value)}
                description="Preenchida pelas configurações da empresa (editável)."
              />
            </div>
          )}

          {/* Preview claro de Taxa vs Líquido */}
          <div className="p-3.5 rounded-[10px] bg-[#F7F8F6] border border-[#E7EAE7] grid grid-cols-3 gap-2 text-[12px]">
            <div>
              <span className="text-[#737D75] block">Valor cobrado</span>
              <strong className="text-[#252B27] text-[14px]">
                {fmt(safeAmount)}
              </strong>
            </div>
            <div>
              <span className="text-[#737D75] block">
                Taxa ({preview.feeRate.toFixed(2)}%)
              </span>
              <strong className="text-[#DC4C4C] text-[14px]">
                - {fmt(preview.feeAmount)}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[#737D75] block">Cai líquido no caixa</span>
              <strong className="text-[#16A36A] text-[14px]">
                {fmt(preview.netAmount)}
              </strong>
            </div>
          </div>

          <Input
            label="Observação (opcional)"
            placeholder="Ex: Sinal para agendamento, comprovante..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7EAE7]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              {isPartial
                ? "Registrar Sinal / Parcial"
                : "Confirmar Recebimento"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
