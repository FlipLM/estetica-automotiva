"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  Calculator,
  FileSpreadsheet,
  LayoutGrid,
  Plus,
  Receipt,
  Settings,
} from "lucide-react";
import {
  Alert,
  Button,
  ConfirmationDialog,
  LoadingState,
  Modal,
  PageHeader,
  Tabs,
} from "@/components/ui";
import { ResumoSimplesTab } from "@/components/modules/financeiro/resumo-simples-tab";
import { ContasAPagarTab } from "@/components/modules/financeiro/contas-a-pagar-tab";
import { EntradasReceberTab } from "@/components/modules/financeiro/entradas-receber-tab";
import { DreDetalhadoTab } from "@/components/modules/financeiro/dre-detalhado-tab";
import { CaixaDoDiaTab } from "@/components/modules/financeiro/caixa-do-dia-tab";
import {
  ExpenseFormModal,
  PayExpenseModal,
  ReceiveOrderModal,
} from "@/components/modules/financeiro/expense-modals";
import {
  DREOverviewData,
  ExpenseItem,
  PERIOD_OPTIONS,
  ReadyOrderItem,
  formatMoney,
} from "@/components/modules/financeiro/types";

type ActiveTab = "resumo" | "contas" | "entradas" | "caixa" | "dre";
type ExpenseStatusFilter = "ALL" | "OVERDUE" | "PENDING" | "PAID";

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("resumo");
  const [period, setPeriod] = useState<string>("current_month");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Overview / DRE data
  const [overview, setOverview] = useState<DREOverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Contas a Pagar state
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAllMonthsOpen, setShowAllMonthsOpen] = useState<boolean>(false);
  const [expensePage, setExpensePage] = useState<number>(1);
  const [expenseTotalPages, setExpenseTotalPages] = useState<number>(1);
  const [expenseTotalItems, setExpenseTotalItems] = useState<number>(0);
  const [expenseCounts, setExpenseCounts] = useState({
    paid: 0,
    pending: 0,
    overdue: 0,
  });
  const [expenseTotals, setExpenseTotals] = useState({
    paidTotal: 0,
    pendingTotal: 0,
    overdueTotal: 0,
  });

  // Modals
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [payingExpense, setPayingExpense] = useState<ExpenseItem | null>(null);
  const [receivingOrder, setReceivingOrder] = useState<ReadyOrderItem | null>(
    null
  );
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [reopeningExpense, setReopeningExpense] = useState<ExpenseItem | null>(
    null
  );
  const [reopening, setReopening] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    setAccessError(null);
    try {
      const res = await fetch(`/api/financial/dre?period=${period}`);
      if (res.status === 403) {
        setAccessError(
          "Acesso restrito a administradores. Operadores não têm acesso aos dados financeiros."
        );
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error("Erro ao carregar visão financeira:", err);
    } finally {
      setLoadingOverview(false);
    }
  }, [period]);

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const params = new URLSearchParams();
      params.set("period", showAllMonthsOpen ? "all" : period);
      params.set("status", statusFilter);
      params.set("page", String(expensePage));
      params.set("limit", "20");
      if (categoryFilter !== "ALL") {
        params.set("category", categoryFilter);
      }
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setExpenseCounts(data.counts || { paid: 0, pending: 0, overdue: 0 });
        setExpenseTotals({
          paidTotal: data.paidTotal || 0,
          pendingTotal: data.pendingTotal || 0,
          overdueTotal: data.overdueTotal || 0,
        });
        if (data.pagination) {
          setExpenseTotalPages(data.pagination.totalPages || 1);
          setExpenseTotalItems(data.pagination.totalItems || 0);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar contas a pagar:", err);
    } finally {
      setLoadingExpenses(false);
    }
  }, [
    period,
    showAllMonthsOpen,
    statusFilter,
    categoryFilter,
    searchQuery,
    expensePage,
  ]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (!accessError) {
      fetchExpenses();
    }
  }, [fetchExpenses, accessError]);

  const refreshAll = async () => {
    setRefreshKey((k) => k + 1);
    await Promise.all([fetchOverview(), fetchExpenses()]);
  };

  const handleConfirmDelete = async (scope: "single" | "future" = "single") => {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/expenses/${deletingExpense.id}?scope=${scope}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setDeletingExpense(null);
        await refreshAll();
      } else {
        const data = await res.json();
        alert(data.error || "Não foi possível excluir a despesa.");
      }
    } catch {
      alert("Falha de conexão ao excluir despesa.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmReopen = async () => {
    if (!reopeningExpense) return;
    setReopening(true);
    try {
      const res = await fetch(`/api/expenses/${reopeningExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: false, paidAt: null }),
      });
      if (res.ok) {
        setReopeningExpense(null);
        await refreshAll();
      } else {
        const data = await res.json();
        alert(data.error || "Não foi possível reabrir a conta.");
      }
    } catch {
      alert("Falha de conexão ao reabrir despesa.");
    } finally {
      setReopening(false);
    }
  };

  if (accessError) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Alert variant="error" title="Acesso Negado" description={accessError} />
      </div>
    );
  }

  const pendingAttentionCount =
    (overview?.payables?.overdueCount || 0) +
    (overview?.payables?.upcomingCount || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Acompanhe de forma simples o que entrou, o que saiu, quanto sobrou no bolso, o caixa do dia e suas contas parceladas."
        actions={
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <Link
              href="/configuracoes#taxas-maquininha"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-[#E7EAE7] bg-white hover:bg-[#F7F8F6] text-[13px] font-medium text-[#252B27] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#247653]" />
              <span>Taxas da Maquininha</span>
            </Link>

            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setExpensePage(1);
              }}
              aria-label="Selecionar período financeiro"
              className="h-9 bg-white border border-[#E7EAE7] rounded-[8px] px-3 text-[13px] font-medium text-[#252B27] focus:outline-none focus:border-[#247653]"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseForm(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nova Despesa
            </Button>
          </div>
        }
      />

      <Tabs
        variant="pills"
        className="print:hidden"
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as ActiveTab)}
        tabs={[
          {
            id: "resumo",
            label: "Resumo Simples",
            icon: <LayoutGrid className="w-4 h-4" />,
          },
          {
            id: "contas",
            label: "Contas a Pagar",
            icon: <Receipt className="w-4 h-4" />,
            count: pendingAttentionCount > 0 ? pendingAttentionCount : undefined,
          },
          {
            id: "entradas",
            label: "Entradas e A Receber",
            icon: <ArrowDownUp className="w-4 h-4" />,
            count:
              (overview?.receivables?.readyCount || 0) > 0
                ? overview?.receivables?.readyCount
                : undefined,
          },
          {
            id: "caixa",
            label: "Caixa do Dia",
            icon: <Calculator className="w-4 h-4" />,
          },
          {
            id: "dre",
            label: "DRE Detalhado",
            icon: <FileSpreadsheet className="w-4 h-4" />,
          },
        ]}
      />

      {loadingOverview && !overview ? (
        <LoadingState message="Calculando entradas, saídas e contas do período..." />
      ) : (
        <>
          {activeTab === "resumo" && overview && (
            <ResumoSimplesTab
              data={overview}
              onPayExpense={(exp) => setPayingExpense(exp)}
              onReceiveOrder={(ord) => setReceivingOrder(ord)}
              onGoToPayables={(status = "ALL") => {
                setStatusFilter(status);
                setShowAllMonthsOpen(
                  status === "OVERDUE" || status === "PENDING"
                );
                setExpensePage(1);
                setActiveTab("contas");
              }}
              onGoToReceivables={() => setActiveTab("entradas")}
            />
          )}

          {activeTab === "contas" && (
            <ContasAPagarTab
              expenses={expenses}
              loading={loadingExpenses}
              statusFilter={statusFilter}
              onStatusFilterChange={(st) => {
                setStatusFilter(st);
                setExpensePage(1);
              }}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={(cat) => {
                setCategoryFilter(cat);
                setExpensePage(1);
              }}
              searchQuery={searchQuery}
              onSearchQueryChange={(q) => {
                setSearchQuery(q);
                setExpensePage(1);
              }}
              showAllMonthsOpen={showAllMonthsOpen}
              onToggleShowAllMonthsOpen={(val) => {
                setShowAllMonthsOpen(val);
                setExpensePage(1);
              }}
              counts={expenseCounts}
              totals={expenseTotals}
              page={expensePage}
              totalPages={expenseTotalPages}
              totalItems={expenseTotalItems}
              onPageChange={(newPage) => setExpensePage(newPage)}
              onNewExpense={() => {
                setEditingExpense(null);
                setShowExpenseForm(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setShowExpenseForm(true);
              }}
              onPayExpense={(exp) => setPayingExpense(exp)}
              onReopenExpense={(exp) => setReopeningExpense(exp)}
              onDeleteExpense={(exp) => setDeletingExpense(exp)}
            />
          )}

          {activeTab === "entradas" && overview && (
            <EntradasReceberTab
              data={overview}
              onReceiveOrder={(ord) => setReceivingOrder(ord)}
            />
          )}

          {activeTab === "caixa" && <CaixaDoDiaTab refreshKey={refreshKey} />}

          {activeTab === "dre" && overview && <DreDetalhadoTab data={overview} />}
        </>
      )}

      {/* Modal Criar / Editar Despesa */}
      <ExpenseFormModal
        isOpen={showExpenseForm}
        onClose={() => {
          setShowExpenseForm(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        onSaved={refreshAll}
      />

      {/* Modal Confirmar Pagamento de Conta */}
      <PayExpenseModal
        expense={payingExpense}
        onClose={() => setPayingExpense(null)}
        onPaid={refreshAll}
      />

      {/* Modal Receber OS Pronta */}
      <ReceiveOrderModal
        order={receivingOrder}
        onClose={() => setReceivingOrder(null)}
        onReceived={refreshAll}
      />

      {/* Confirmação de Reabertura */}
      <ConfirmationDialog
        isOpen={!!reopeningExpense}
        onClose={() => setReopeningExpense(null)}
        onConfirm={handleConfirmReopen}
        title="Reabrir conta como pendente?"
        description={
          reopeningExpense
            ? `A despesa "${reopeningExpense.description}" (${formatMoney(
                reopeningExpense.amount
              )}) deixará de contar como paga no caixa até você confirmar o pagamento novamente.`
            : ""
        }
        confirmLabel="Sim, reabrir conta"
        loading={reopening}
      />

      {/* Confirmação de Exclusão (Simples vs Parcelada/Recorrente) */}
      {deletingExpense && deletingExpense.recurrenceGroupId ? (
        <Modal
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          title="Excluir despesa parcelada/recorrente"
          description="Esta conta faz parte de uma série. Escolha se deseja excluir somente esta parcela ou também as próximas em aberto."
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#991B1B]">
              <strong>{deletingExpense.description}</strong> •{" "}
              {formatMoney(deletingExpense.amount)}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                isLoading={deleting}
                onClick={() => handleConfirmDelete("single")}
                fullWidth
              >
                Excluir só esta parcela
              </Button>
              <Button
                variant="destructive"
                isLoading={deleting}
                onClick={() => handleConfirmDelete("future")}
                fullWidth
              >
                Excluir esta e as próximas em aberto
              </Button>
              <Button
                variant="ghost"
                disabled={deleting}
                onClick={() => setDeletingExpense(null)}
                fullWidth
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      ) : (
        <ConfirmationDialog
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onConfirm={() => handleConfirmDelete("single")}
          title="Excluir despesa permanentemente?"
          description={
            deletingExpense
              ? `Você está prestes a excluir "${deletingExpense.description}" no valor de ${formatMoney(
                  deletingExpense.amount
                )}. Essa ação não pode ser desfeita.`
              : ""
          }
          confirmLabel="Excluir Despesa"
          destructive
          loading={deleting}
        />
      )}
    </div>
  );
}
