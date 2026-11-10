"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  PieChart,
  Receipt,
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
  Checkbox,
} from "@/components/ui";

interface DREData {
  period: string;
  startDate: string;
  endDate: string;
  ordersCount: number;
  averageTicket: number;
  grossRevenue: number;
  discounts: number;
  netRevenue: number;
  variableCosts: {
    products: number;
    commissions: number;
    total: number;
  };
  grossProfit: number;
  grossMarginPercentage: number;
  fixedCosts: {
    rent: number;
    utilities: number;
    salaries: number;
    maintenance: number;
    marketing: number;
    other: number;
    total: number;
  };
  totalExpenses: number;
  netProfit: number;
  netMarginPercentage: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCTS: "Insumos & Produtos",
  SALARY: "Salários & Equipe",
  COMMISSION: "Comissões",
  RENT: "Aluguel & Ponto",
  UTILITIES: "Água, Luz e Internet",
  MAINTENANCE: "Manutenção de Equipamentos",
  MARKETING: "Marketing & Anúncios",
  OTHER: "Outras Despesas",
};

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<string>("current_month");
  const [dre, setDre] = useState<DREData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "OTHER",
    dueDate: new Date().toISOString().split("T")[0],
    paid: true,
    paymentMethod: "PIX",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dreRes, expRes] = await Promise.all([
        fetch(`/api/financial/dre?period=${period}`),
        fetch("/api/expenses"),
      ]);

      if (dreRes.ok) {
        const dreData = await dreRes.json();
        if (dreData.netRevenue !== undefined) {
          setDre(dreData);
        } else if (dreData.dre) {
          setDre({
            period: dreData.period || period,
            startDate: dreData.startDate || new Date().toISOString(),
            endDate: dreData.endDate || new Date().toISOString(),
            ordersCount: dreData.dre.billedVehiclesCount || 0,
            averageTicket: dreData.dre.averageTicket || 0,
            grossRevenue: dreData.dre.grossRevenue || 0,
            discounts: dreData.dre.totalDiscounts || 0,
            netRevenue: dreData.dre.netRevenue || 0,
            variableCosts: {
              products: dreData.expenseBreakdown?.PRODUCTS || 0,
              commissions: dreData.expenseBreakdown?.COMMISSION || 0,
              total: dreData.dre.variableCosts || 0,
            },
            grossProfit: dreData.dre.grossProfit || 0,
            grossMarginPercentage: dreData.dre.grossMargin || 0,
            fixedCosts: {
              rent: dreData.expenseBreakdown?.RENT || 0,
              utilities: dreData.expenseBreakdown?.UTILITIES || 0,
              salaries: dreData.expenseBreakdown?.SALARY || 0,
              maintenance: dreData.expenseBreakdown?.MAINTENANCE || 0,
              marketing: dreData.expenseBreakdown?.MARKETING || 0,
              other: dreData.expenseBreakdown?.OTHER || 0,
              total: dreData.dre.fixedCosts || 0,
            },
            totalExpenses: dreData.dre.totalExpenses || 0,
            netProfit: dreData.dre.netProfit || 0,
            netMarginPercentage: dreData.dre.netMargin || 0,
          });
        }
      }

      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData.expenses || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          amount: parseFloat(form.amount),
          category: form.category,
          dueDate: form.dueDate,
          paid: form.paid,
          paymentMethod: form.paymentMethod,
          notes: form.notes || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          description: "",
          amount: "",
          category: "OTHER",
          dueDate: new Date().toISOString().split("T")[0],
          paid: true,
          paymentMethod: "PIX",
          notes: "",
        });
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar despesa");
      }
    } catch (err) {
      console.error(err);
      alert("Falha na requisição");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePaid = async (expense: Expense) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paid: !expense.paid,
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Erro ao alternar status da despesa:", err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta despesa?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const fmtCurrency = (val: number) =>
    `R$ ${(val ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro, DRE e Contas a Pagar"
        description="Demonstrativo do Resultado do Exercício (DRE) com apuração de receitas, custos e despesas da estética."
        actions={
          <div className="flex items-center gap-2.5">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="form-select text-xs h-9 py-1.5"
            >
              <option value="current_month">Mês Atual</option>
              <option value="last_month">Mês Anterior</option>
              <option value="7_days">Últimos 7 dias</option>
              <option value="year">Ano Atual</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nova Despesa
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Calculando indicadores financeiros e DRE..." />
      ) : (
        <>
          {/* Cards de Métricas Principais */}
          {dre && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Faturamento Líquido"
                value={fmtCurrency(dre.netRevenue)}
                subtitle={`${dre.ordersCount ?? 0} atendimentos • Ticket: ${fmtCurrency(dre.averageTicket)}`}
                icon={<DollarSign className="w-5 h-5" />}
                variant="brand"
              />
              <StatCard
                label="Custos e Despesas"
                value={fmtCurrency(dre.totalExpenses)}
                subtitle={`Variáveis: ${fmtCurrency(dre.variableCosts?.total)} • Fixos: ${fmtCurrency(dre.fixedCosts?.total)}`}
                icon={<TrendingDown className="w-5 h-5" />}
                variant="error"
              />
              <StatCard
                label="Lucro Líquido Real"
                value={fmtCurrency(dre.netProfit)}
                subtitle="Após insumos, comissões e custos fixos"
                icon={<TrendingUp className="w-5 h-5" />}
                variant={(dre.netProfit ?? 0) >= 0 ? "success" : "error"}
              />
              <StatCard
                label="Margem Líquida"
                value={`${(dre.netMarginPercentage ?? 0).toFixed(1)}%`}
                subtitle={`Margem Bruta: ${(dre.grossMarginPercentage ?? 0).toFixed(1)}%`}
                icon={<PieChart className="w-5 h-5" />}
                variant="info"
              />
            </div>
          )}

          {/* DRE Detalhado em Tabela Contábil */}
          {dre && (
            <div className="bg-white rounded-xl border border-[#E7EAE7] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E7EAE7] bg-[#F7F8F6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#247653]" />
                  <h2 className="font-semibold text-[#252B27] text-sm">
                    DRE Gerencial — Demonstrativo de Resultado
                  </h2>
                </div>
                <span className="text-xs text-[#737D75]">
                  Período: {dre.startDate ? new Date(dre.startDate).toLocaleDateString("pt-BR") : "--"} até{" "}
                  {dre.endDate ? new Date(dre.endDate).toLocaleDateString("pt-BR") : "--"}
                </span>
              </div>

              <div className="p-6 divide-y divide-[#F1F3F1] text-sm">
                {/* 1. Receita Bruta */}
                <div className="py-2.5 flex justify-between items-center">
                  <span className="font-medium text-[#252B27]">(+) Receita Bruta de Serviços</span>
                  <span className="font-semibold text-[#16A36A]">{fmtCurrency(dre.grossRevenue)}</span>
                </div>

                {/* 2. Deduções */}
                <div className="py-2 pl-4 flex justify-between items-center text-xs text-[#737D75]">
                  <span>(-) Descontos Concedidos</span>
                  <span className="text-[#DC4C4C]">- {fmtCurrency(dre.discounts)}</span>
                </div>

                {/* 3. Receita Líquida */}
                <div className="py-2.5 px-3 bg-[#F7F8F6] rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-[#252B27]">(=) Receita Operacional Líquida</span>
                  <span className="font-bold text-[#252B27]">{fmtCurrency(dre.netRevenue)}</span>
                </div>

                {/* 4. Custos Variáveis */}
                <div className="py-2 pl-4 flex justify-between items-center text-xs text-[#737D75]">
                  <span>(-) Custos Variáveis (Insumos Químicos e Comissões)</span>
                  <span className="text-[#DC4C4C]">- {fmtCurrency(dre.variableCosts?.total)}</span>
                </div>

                {/* 5. Lucro Bruto */}
                <div className="py-2.5 px-3 bg-[#EFF6FF]/60 rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-[#1E40AF]">(=) Lucro Bruto da Operação</span>
                  <span className="font-bold text-[#1E40AF]">
                    {fmtCurrency(dre.grossProfit)} ({(dre.grossMarginPercentage ?? 0).toFixed(1)}%)
                  </span>
                </div>

                {/* 6. Custos Fixos Detalhados */}
                <div className="py-3 pl-4 flex flex-col gap-1.5 text-xs text-[#737D75]">
                  <div className="flex justify-between">
                    <span>• Aluguel e Ponto Comercial</span>
                    <span>{fmtCurrency(dre.fixedCosts?.rent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Energia, Água e Internet</span>
                    <span>{fmtCurrency(dre.fixedCosts?.utilities)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Folha de Pagamento e Salários Fixos</span>
                    <span>{fmtCurrency(dre.fixedCosts?.salaries)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Marketing e Anúncios</span>
                    <span>{fmtCurrency(dre.fixedCosts?.marketing)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Manutenção de Equipamentos</span>
                    <span>{fmtCurrency(dre.fixedCosts?.maintenance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Outras Despesas Gerais</span>
                    <span>{fmtCurrency(dre.fixedCosts?.other)}</span>
                  </div>
                </div>

                {/* 7. Total Custos Fixos */}
                <div className="py-2 pl-4 flex justify-between items-center text-xs text-[#737D75]">
                  <span>(-) Total de Custos Fixos Operacionais</span>
                  <span className="text-[#DC4C4C]">- {fmtCurrency(dre.fixedCosts?.total)}</span>
                </div>

                {/* 8. Lucro Líquido Final */}
                <div className="py-3.5 px-4 bg-[#E9F3EC] border border-[#247653]/20 rounded-xl flex justify-between items-center mt-2">
                  <span className="font-bold text-[#142D26]">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
                  <span
                    className={`text-base font-bold ${
                      (dre.netProfit ?? 0) >= 0 ? "text-[#16A36A]" : "text-[#DC4C4C]"
                    }`}
                  >
                    {fmtCurrency(dre.netProfit)} ({(dre.netMarginPercentage ?? 0).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Despesas Lançadas */}
          <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#E7EAE7] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#252B27] text-base">Contas a Pagar e Despesas</h2>
                <p className="text-xs text-[#737D75]">
                  {expenses.length} lançamentos registrados no sistema
                </p>
              </div>
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                icon={<Receipt className="w-6 h-6" />}
                title="Nenhuma despesa cadastrada"
                description="Registre suas contas de aluguel, energia, insumos ou manutenção para calcular o lucro líquido exato no DRE."
                action={
                  <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                    Lançar Primeira Despesa
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Descrição</th>
                      <th className="px-6 py-3 font-semibold">Categoria</th>
                      <th className="px-6 py-3 font-semibold">Vencimento</th>
                      <th className="px-6 py-3 font-semibold">Valor</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F1]">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-[#F7F8F6]/70 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-[#252B27]">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-xs text-[#737D75]">{expense.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="neutral" size="sm">
                            {CATEGORY_LABELS[expense.category] || expense.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-[#737D75]">
                          {new Date(expense.dueDate).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-[#252B27]">
                          {fmtCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePaid(expense)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              expense.paid
                                ? "bg-[#ECFDF5] text-[#16A36A] border border-[#16A36A]/20 hover:bg-[#D1FAE5]"
                                : "bg-[#FFFBEB] text-[#D97706] border border-[#D97706]/20 hover:bg-[#FEF3C7]"
                            }`}
                            title="Clique para alternar entre paga e pendente"
                          >
                            {expense.paid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paga
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5" /> Pendente
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-[#737D75] hover:text-[#DC4C4C] p-1.5 rounded-lg hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                            title="Excluir despesa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Modal Nova Despesa */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Lançar Nova Despesa"
        description="Registre contas fixas ou variáveis para manter o Demonstrativo de Resultado atualizado."
        size="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Descrição da Despesa"
            required
            placeholder="Ex: Conta de Energia, Compra de Boinas, Aluguel"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <Input
              label="Data de Vencimento"
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
                { value: "RENT", label: "Aluguel & Ponto" },
                { value: "UTILITIES", label: "Água, Luz e Internet" },
                { value: "SALARY", label: "Salários & Pró-labore" },
                { value: "PRODUCTS", label: "Insumos & Produtos" },
                { value: "MARKETING", label: "Marketing & Anúncios" },
                { value: "MAINTENANCE", label: "Manutenção" },
                { value: "OTHER", label: "Outras Despesas" },
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

          <Checkbox
            label="Despesa já está paga / liquidada"
            checked={form.paid}
            onChange={(checked) => setForm({ ...form, paid: checked })}
          />

          <Input
            label="Observações (opcional)"
            placeholder="Número de nota fiscal, fornecedor, etc."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Salvar Despesa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
