"use client";

import { useState, useEffect } from "react";
import {
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Filter,
  PieChart,
} from "lucide-react";

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

  // Modal nova despesa
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="led-pulse-lime"></span>
            <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
              // CONTROLADORIA & DRE
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-lime-400" />
            Gestão Financeira & DRE
          </h1>
          <p className="text-slate-400 text-xs">
            Demonstrativo do Resultado do Exercício com controle de despesas e lucratividade real da oficina.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de Período */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-select-carbon text-xs"
          >
            <option value="current_month">Mês Atual</option>
            <option value="last_month">Mês Anterior</option>
            <option value="7_days">Últimos 7 dias</option>
            <option value="year">Ano Atual</option>
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="btn-engine-start px-4 py-2 text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      {dre && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="carbon-card p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-mono tracking-wider mb-2">
              <span>Faturamento Líquido</span>
              <DollarSign className="w-4 h-4 text-lime-400" />
            </div>
            <div className="text-2xl font-black text-slate-100 font-mono">
              R$ {(dre.netRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              {dre.ordersCount ?? 0} veículos atendidos • Médio: R${" "}
              {(dre.averageTicket ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="carbon-card p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-mono tracking-wider mb-2">
              <span>Custos & Despesas</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              R$ {(dre.totalExpenses ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Variáveis: R$ {(dre.variableCosts?.total ?? 0).toFixed(2)} | Fixos: R$ {(dre.fixedCosts?.total ?? 0).toFixed(2)}
            </div>
          </div>

          <div className="carbon-card p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-mono tracking-wider mb-2">
              <span>Lucro Líquido Real</span>
              <TrendingUp className={`w-4 h-4 ${(dre.netProfit ?? 0) >= 0 ? "text-lime-400" : "text-rose-400"}`} />
            </div>
            <div
              className={`text-2xl font-black font-mono ${
                (dre.netProfit ?? 0) >= 0 ? "text-lime-400" : "text-rose-400"
              }`}
            >
              R$ {(dre.netProfit ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Após dedução de insumos, comissões e custos fixos
            </div>
          </div>

          <div className="carbon-card p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-mono tracking-wider mb-2">
              <span>Margem Líquida</span>
              <PieChart className="w-4 h-4 text-cyan-400" />
            </div>
            <div
              className={`text-2xl font-black font-mono ${
                (dre.netMarginPercentage ?? 0) >= 20
                  ? "text-lime-400"
                  : (dre.netMarginPercentage ?? 0) >= 0
                  ? "text-cyan-400"
                  : "text-rose-400"
              }`}
            >
              {(dre.netMarginPercentage ?? 0).toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Margem Bruta Operacional: {(dre.grossMarginPercentage ?? 0).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* DRE Detalhado em Tabela Contábil */}
      {dre && (
        <div className="carbon-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1c2230] bg-[#0c0e14] flex items-center justify-between">
            <h2 className="font-bold text-slate-200 text-xs uppercase font-mono tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span>
              DRE Gerencial — Demonstrativo de Resultado
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Período de apuração: {dre.startDate ? new Date(dre.startDate).toLocaleDateString("pt-BR") : "--"} até{" "}
              {dre.endDate ? new Date(dre.endDate).toLocaleDateString("pt-BR") : "--"}
            </span>
          </div>

          <div className="p-6 divide-y divide-[#1c2230]/60 font-mono text-xs">
            {/* 1. Receita Bruta */}
            <div className="py-2.5 flex justify-between font-sans">
              <span className="font-semibold text-slate-200">(+) Receita Bruta de Serviços</span>
              <span className="font-bold text-lime-400 font-mono">
                R$ {(dre.grossRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* 2. Deduções */}
            <div className="py-2 pl-4 flex justify-between text-slate-400">
              <span>(-) Descontos Concedidos</span>
              <span className="text-rose-400 font-mono">
                - R$ {(dre.discounts ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* 3. Receita Líquida */}
            <div className="py-2.5 flex justify-between font-sans bg-[#121620]/60 px-3 rounded">
              <span className="font-bold text-slate-100">(=) Receita Operacional Líquida</span>
              <span className="font-black text-slate-100 font-mono">
                R$ {(dre.netRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* 4. Custos Variáveis */}
            <div className="py-2 pl-4 flex justify-between text-slate-400">
              <span>(-) Custos Variáveis (Insumos Químicos e Comissões)</span>
              <span className="text-rose-400 font-mono">
                - R$ {(dre.variableCosts?.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* 5. Lucro Bruto */}
            <div className="py-2.5 flex justify-between font-sans bg-[#121620]/60 px-3 rounded">
              <span className="font-bold text-cyan-300">(=) Lucro Bruto da Operação</span>
              <span className="font-black text-cyan-300 font-mono">
                R$ {(dre.grossProfit ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (
                {(dre.grossMarginPercentage ?? 0).toFixed(1)}%)
              </span>
            </div>

            {/* 6. Custos Fixos Detalhados */}
            <div className="py-2 pl-4 flex flex-col gap-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>• Aluguel & Ponto Comercial</span>
                <span className="font-mono">R$ {(dre.fixedCosts?.rent ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Energia, Água & Internet</span>
                <span className="font-mono">R$ {(dre.fixedCosts?.utilities ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Folha de Pagamento & Salários Fixos</span>
                <span className="font-mono">R$ {(dre.fixedCosts?.salaries ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Marketing & Anúncios</span>
                <span className="font-mono">R$ {(dre.fixedCosts?.marketing ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Manutenção de Equipamentos</span>
                <span className="font-mono">R$ {(dre.fixedCosts?.maintenance ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Outras Despesas Gerais</span>
                <span className="font-mono">R$ {(dre.fixedCosts?.other ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {/* 7. Total Custos Fixos */}
            <div className="py-2 pl-4 flex justify-between text-slate-400">
              <span>(-) Total de Custos Fixos Operacionais</span>
              <span className="text-rose-400 font-mono">
                - R$ {(dre.fixedCosts?.total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* 8. Lucro Líquido Final */}
            <div className="py-3 flex justify-between font-sans bg-lime-950/20 border border-lime-500/30 px-3 rounded text-sm">
              <span className="font-black text-lime-400 tracking-wide">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
              <span
                className={`font-black font-mono ${
                  (dre.netProfit ?? 0) >= 0 ? "text-lime-400" : "text-rose-400"
                }`}
              >
                R$ {(dre.netProfit ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (
                {(dre.netMarginPercentage ?? 0).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Despesas Lançadas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-100">Contas a Pagar & Despesas</h2>
            <p className="text-xs text-slate-400">
              {expenses.length} lançamentos registrados no sistema
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Vencimento</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma despesa cadastrada ainda.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-100">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-slate-500">{expense.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {CATEGORY_LABELS[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {new Date(expense.dueDate).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-100">
                      R$ {expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleTogglePaid(expense)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          expense.paid
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                        title="Clique para alternar o status pago/pendente"
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
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Despesa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="carbon-card max-w-md w-full p-6 border border-[#2b354c] shadow-2xl">
            <h3 className="text-sm font-black text-slate-100 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Plus className="w-4 h-4 text-lime-400" />
              Lançar Nova Despesa Operacional
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="form-label-carbon">
                  Descrição da Despesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta de Luz Enel, Compra de Boinas"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-input-carbon w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-select-carbon w-full"
                  >
                    <option value="RENT">Aluguel & Ponto</option>
                    <option value="UTILITIES">Água, Luz e Internet</option>
                    <option value="SALARY">Salários & Pró-labore</option>
                    <option value="PRODUCTS">Insumos & Produtos</option>
                    <option value="MARKETING">Marketing & Anúncios</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="OTHER">Outras Despesas</option>
                  </select>
                </div>

                <div>
                  <label className="form-label-carbon">
                    Forma de Pagamento
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="form-select-carbon w-full"
                  >
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                    <option value="DEBIT_CARD">Cartão de Débito</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="TRANSFER">Transferência</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={form.paid}
                  onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                  className="form-checkbox-carbon"
                />
                <label htmlFor="paidCheck" className="text-xs text-slate-300 cursor-pointer font-mono">
                  Despesa já está liquidada/paga
                </label>
              </div>

              <div>
                <label className="form-label-carbon">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Número de nota fiscal, fornecedor, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="form-input-carbon w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1c2230]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-engine-start px-4 py-2 text-xs disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Despesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

