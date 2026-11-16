"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import {
  addMonthsPreservingDay,
  formatDateInputValue,
  parseDateInput,
} from "@/lib/date-utils";
import {
  OrderPaymentModal,
} from "@/components/modules/order-payment-modal";
import {
  CATEGORY_LABELS,
  ExpenseItem,
  ReadyOrderItem,
  formatMoney,
  formatShortDate,
} from "./types";

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense: ExpenseItem | null;
  onSaved: () => Promise<void>;
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  editingExpense,
  onSaved,
}: ExpenseFormModalProps) {
  const todayStr = formatDateInputValue(new Date());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "OTHER",
    dueDate: todayStr,
    paid: true,
    paidAt: todayStr,
    paymentMethod: "PIX",
    supplier: "",
    notes: "",
    recurrenceType: "SINGLE" as "SINGLE" | "INSTALLMENT" | "RECURRING",
    totalInstallments: "2",
    amountMode: "TOTAL" as "TOTAL" | "INSTALLMENT_VALUE",
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingExpense) {
      setForm({
        description: editingExpense.description || "",
        amount: String(editingExpense.amount ?? ""),
        category: editingExpense.category || "OTHER",
        dueDate: formatDateInputValue(editingExpense.dueDate) || todayStr,
        paid: editingExpense.paid,
        paidAt:
          formatDateInputValue(editingExpense.paidAt || editingExpense.dueDate) ||
          todayStr,
        paymentMethod: editingExpense.paymentMethod || "PIX",
        supplier: editingExpense.supplier || "",
        notes: editingExpense.notes || "",
        recurrenceType: "SINGLE",
        totalInstallments: "2",
        amountMode: "TOTAL",
      });
    } else {
      setForm({
        description: "",
        amount: "",
        category: "OTHER",
        dueDate: todayStr,
        paid: true,
        paidAt: todayStr,
        paymentMethod: "PIX",
        supplier: "",
        notes: "",
        recurrenceType: "SINGLE",
        totalInstallments: "2",
        amountMode: "TOTAL",
      });
    }
  }, [isOpen, editingExpense, todayStr]);

  const parsedAmount = Number(String(form.amount || "0").replace(",", "."));
  const parsedCount = Math.max(
    2,
    Math.min(
      form.recurrenceType === "RECURRING" ? 24 : 48,
      Math.floor(Number(form.totalInstallments || "2") || 2)
    )
  );

  // Preview de parcelas/recorrência
  let previewText: string | null = null;
  if (!editingExpense && form.recurrenceType !== "SINGLE" && parsedAmount > 0 && form.dueDate) {
    try {
      const firstDate = parseDateInput(form.dueDate);
      const lastDate = addMonthsPreservingDay(firstDate, parsedCount - 1);
      const perInstallment =
        form.recurrenceType === "INSTALLMENT" && form.amountMode === "TOTAL"
          ? parsedAmount / parsedCount
          : parsedAmount;

      previewText =
        form.recurrenceType === "INSTALLMENT"
          ? `Serão geradas ${parsedCount} parcelas de ${formatMoney(
              perInstallment
            )} (1ª em ${formatShortDate(firstDate)}, última em ${formatShortDate(
              lastDate
            )}).`
          : `Será repetida por ${parsedCount} meses com valor de ${formatMoney(
              perInstallment
            )}/mês (de ${formatShortDate(firstDate)} até ${formatShortDate(
              lastDate
            )}).`;
    } catch {
      previewText = null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    setSaving(true);
    try {
      const payload = editingExpense
        ? {
            description: form.description.trim(),
            amount: parsedAmount,
            category: form.category,
            dueDate: form.dueDate,
            paid: form.paid,
            paidAt: form.paid ? form.paidAt || form.dueDate : null,
            paymentMethod: form.paymentMethod,
            supplier: form.supplier.trim() || null,
            notes: form.notes.trim() || null,
          }
        : {
            description: form.description.trim(),
            amount: parsedAmount,
            category: form.category,
            dueDate: form.dueDate,
            paid: form.paid,
            paidAt: form.paid ? form.paidAt || form.dueDate : null,
            paymentMethod: form.paymentMethod,
            supplier: form.supplier.trim() || null,
            notes: form.notes.trim() || null,
            recurrenceType: form.recurrenceType,
            totalInstallments:
              form.recurrenceType === "SINGLE" ? 1 : parsedCount,
            amountMode:
              form.recurrenceType === "INSTALLMENT"
                ? form.amountMode
                : "INSTALLMENT_VALUE",
          };

      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível salvar a despesa.");
        return;
      }

      onClose();
      await onSaved();
    } catch {
      setError("Falha de conexão ao salvar despesa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? "Editar Despesa" : "Lançar Nova Despesa"}
      description={
        editingExpense
          ? "Atualize os dados da conta ou a data em que foi paga."
          : "Registre contas únicas, compras parceladas ou despesas mensais recorrentes."
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-[13px] font-medium">
            {error}
          </div>
        )}

        <Input
          label="Descrição da Despesa"
          required
          placeholder="Ex: Compra de Politriz, Aluguel, Conta de Energia"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Tipo de frequência (apenas na criação) */}
        {!editingExpense && (
          <div className="p-3.5 rounded-[10px] bg-[#F7F8F6] border border-[#E7EAE7] space-y-3">
            <Select
              label="Como essa conta se repete?"
              value={form.recurrenceType}
              onChange={(e) =>
                setForm({
                  ...form,
                  recurrenceType: e.target.value as
                    | "SINGLE"
                    | "INSTALLMENT"
                    | "RECURRING",
                })
              }
              options={[
                { value: "SINGLE", label: "Conta única (1 lançamento)" },
                {
                  value: "INSTALLMENT",
                  label: "Compra parcelada (Nx no boleto/cartão)",
                },
                {
                  value: "RECURRING",
                  label: "Repetir todo mês (Aluguel, Internet, etc.)",
                },
              ]}
            />

            {form.recurrenceType !== "SINGLE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={
                    form.recurrenceType === "INSTALLMENT"
                      ? "Quantidade de parcelas (2 a 48)"
                      : "Quantos meses gerar (2 a 24)"
                  }
                  type="number"
                  min={2}
                  max={form.recurrenceType === "INSTALLMENT" ? 48 : 24}
                  required
                  value={form.totalInstallments}
                  onChange={(e) =>
                    setForm({ ...form, totalInstallments: e.target.value })
                  }
                />

                {form.recurrenceType === "INSTALLMENT" && (
                  <Select
                    label="O valor digitado abaixo é:"
                    value={form.amountMode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amountMode: e.target.value as
                          | "TOTAL"
                          | "INSTALLMENT_VALUE",
                      })
                    }
                    options={[
                      {
                        value: "TOTAL",
                        label: "Valor Total (dividir em Nx)",
                      },
                      {
                        value: "INSTALLMENT_VALUE",
                        label: "Valor de cada parcela",
                      },
                    ]}
                  />
                )}
              </div>
            )}

            {previewText && (
              <p className="text-[12px] text-[#142D26] bg-[#E9F3EC] border border-[#C5E2CE] rounded-[8px] px-3 py-2 font-medium">
                {previewText}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label={
              !editingExpense &&
              form.recurrenceType === "INSTALLMENT" &&
              form.amountMode === "TOTAL"
                ? "Valor Total da Compra (R$)"
                : !editingExpense && form.recurrenceType !== "SINGLE"
                ? "Valor de Cada Mês/Parcela (R$)"
                : "Valor (R$)"
            }
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <Input
            label={
              !editingExpense && form.recurrenceType !== "SINGLE"
                ? "Vencimento da 1ª Parcela/Mês"
                : "Data de Vencimento"
            }
            type="date"
            required
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: "RENT", label: CATEGORY_LABELS.RENT },
              { value: "UTILITIES", label: CATEGORY_LABELS.UTILITIES },
              { value: "SALARY", label: CATEGORY_LABELS.SALARY },
              { value: "PRODUCTS", label: CATEGORY_LABELS.PRODUCTS },
              { value: "COMMISSION", label: CATEGORY_LABELS.COMMISSION },
              { value: "MARKETING", label: CATEGORY_LABELS.MARKETING },
              { value: "MAINTENANCE", label: CATEGORY_LABELS.MAINTENANCE },
              { value: "OTHER", label: CATEGORY_LABELS.OTHER },
            ]}
          />

          <Select
            label="Forma de Pagamento"
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            options={[
              { value: "PIX", label: "PIX" },
              { value: "BOLETO", label: "Boleto" },
              { value: "CREDIT_CARD", label: "Cartão de Crédito" },
              { value: "DEBIT_CARD", label: "Cartão de Débito" },
              { value: "CASH", label: "Dinheiro" },
              { value: "TRANSFER", label: "Transferência" },
            ]}
          />
        </div>

        <Input
          label="Fornecedor / Loja (opcional)"
          placeholder="Ex: Vonixx, Enel, Imobiliária Central"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        />

        <div className="p-3.5 rounded-[10px] bg-[#F7F8F6] border border-[#E7EAE7] space-y-3">
          <Checkbox
            label={
              !editingExpense && form.recurrenceType !== "SINGLE"
                ? "A 1ª parcela/mês já está paga"
                : "Despesa já está paga / liquidada"
            }
            description={
              !editingExpense && form.recurrenceType !== "SINGLE"
                ? "As parcelas futuras serão criadas como pendentes automaticamente."
                : "Somente despesas pagas entram na conta do que já saiu do caixa."
            }
            checked={form.paid}
            onChange={(checked) =>
              setForm({
                ...form,
                paid: checked,
                paidAt: checked ? form.paidAt || todayStr : "",
              })
            }
          />

          {form.paid && (
            <Input
              label="Data em que foi paga"
              type="date"
              required
              value={form.paidAt}
              onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
            />
          )}
        </div>

        <Input
          label="Observações (opcional)"
          placeholder="Número da nota fiscal, detalhes, etc."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {editingExpense ? "Salvar Alterações" : "Salvar Despesa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface PayExpenseModalProps {
  expense: ExpenseItem | null;
  onClose: () => void;
  onPaid: () => Promise<void>;
}

export function PayExpenseModal({
  expense,
  onClose,
  onPaid,
}: PayExpenseModalProps) {
  const todayStr = formatDateInputValue(new Date());
  const [paidAt, setPaidAt] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setPaidAt(formatDateInputValue(new Date()));
      setPaymentMethod(expense.paymentMethod || "PIX");
    }
  }, [expense]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paid: true,
          paidAt,
          paymentMethod,
        }),
      });
      if (res.ok) {
        onClose();
        await onPaid();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao registrar pagamento da conta.");
      }
    } catch {
      alert("Falha de conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!expense}
      onClose={onClose}
      title="Confirmar Pagamento da Conta"
      description="Informe quando e como essa despesa foi paga para manter seu caixa exato."
      size="sm"
    >
      {expense && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="p-3.5 rounded-[10px] bg-[#E9F3EC] border border-[#C5E2CE] space-y-1">
            <p className="text-[13px] font-semibold text-[#142D26]">
              {expense.description}
            </p>
            {expense.supplier && (
              <p className="text-[12px] text-[#343C36]">
                Fornecedor: {expense.supplier}
              </p>
            )}
            <p className="text-[20px] font-bold text-[#247653]">
              {formatMoney(expense.amount)}
            </p>
          </div>

          <Input
            label="Data real do pagamento"
            type="date"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />

          <Select
            label="Forma de pagamento"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: "PIX", label: "PIX" },
              { value: "BOLETO", label: "Boleto" },
              { value: "CREDIT_CARD", label: "Cartão de Crédito" },
              { value: "DEBIT_CARD", label: "Cartão de Débito" },
              { value: "CASH", label: "Dinheiro" },
              { value: "TRANSFER", label: "Transferência" },
            ]}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7EAE7]">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirmar Pagamento
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

interface ReceiveOrderModalProps {
  order: ReadyOrderItem | null;
  onClose: () => void;
  onReceived: () => Promise<void>;
}

export function ReceiveOrderModal({
  order,
  onClose,
  onReceived,
}: ReceiveOrderModalProps) {
  return (
    <OrderPaymentModal
      order={
        order
          ? {
              id: order.id,
              orderNumber: order.orderNumber,
              plate: order.plate,
              model: order.model,
              customerName: order.customerName,
              totalAmount: order.totalAmount,
              paidAmount: order.paidAmount ?? 0,
            }
          : null
      }
      onClose={onClose}
      onPaid={onReceived}
      title="Receber Pagamento do Cliente"
    />
  );
}
