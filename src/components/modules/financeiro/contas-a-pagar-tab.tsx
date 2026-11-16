"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Plus,
  Receipt,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  LoadingState,
  Pagination,
  SearchInput,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  CATEGORY_LABELS,
  ExpenseItem,
  PAYMENT_METHOD_LABELS,
  formatMoney,
  formatShortDate,
  isExpenseOverdue,
} from "./types";

interface ContasAPagarTabProps {
  expenses: ExpenseItem[];
  loading: boolean;
  statusFilter: "ALL" | "OVERDUE" | "PENDING" | "PAID";
  onStatusFilterChange: (status: "ALL" | "OVERDUE" | "PENDING" | "PAID") => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  showAllMonthsOpen: boolean;
  onToggleShowAllMonthsOpen: (val: boolean) => void;
  counts: { paid: number; pending: number; overdue: number };
  totals: { paidTotal: number; pendingTotal: number; overdueTotal: number };
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onNewExpense: () => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onPayExpense: (expense: ExpenseItem) => void;
  onReopenExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expense: ExpenseItem) => void;
}

export function ContasAPagarTab({
  expenses,
  loading,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  showAllMonthsOpen,
  onToggleShowAllMonthsOpen,
  counts,
  totals,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onNewExpense,
  onEditExpense,
  onPayExpense,
  onReopenExpense,
  onDeleteExpense,
}: ContasAPagarTabProps) {
  const filterPills: Array<{
    id: "ALL" | "OVERDUE" | "PENDING" | "PAID";
    label: string;
    count?: number;
    tone?: "error" | "warning" | "success";
  }> = [
    { id: "ALL", label: "Todas" },
    { id: "OVERDUE", label: "Atrasadas", count: counts.overdue, tone: "error" },
    { id: "PENDING", label: "A Vencer", count: counts.pending, tone: "warning" },
    { id: "PAID", label: "Pagas", count: counts.paid, tone: "success" },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de Resumo Rápido das Contas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#FECACA] rounded-[12px] p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#737D75]">Atrasadas</p>
            <p className="text-[20px] font-bold text-[#DC4C4C]">
              {formatMoney(totals.overdueTotal)}
            </p>
          </div>
          <Badge variant="error" size="sm">
            {counts.overdue} conta(s)
          </Badge>
        </div>

        <div className="bg-white border border-[#FDE68A] rounded-[12px] p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#737D75]">A Vencer</p>
            <p className="text-[20px] font-bold text-[#D97706]">
              {formatMoney(totals.pendingTotal)}
            </p>
          </div>
          <Badge variant="warning" size="sm">
            {counts.pending} conta(s)
          </Badge>
        </div>

        <div className="bg-white border border-[#A7F3D0] rounded-[12px] p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#737D75]">
              Pagas no Filtro
            </p>
            <p className="text-[20px] font-bold text-[#16A36A]">
              {formatMoney(totals.paidTotal)}
            </p>
          </div>
          <Badge variant="success" size="sm">
            {counts.paid} conta(s)
          </Badge>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="bg-white border border-[#E7EAE7] rounded-[12px] p-4 space-y-3 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Pílulas de Status */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filterPills.map((pill) => {
              const active = statusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => onStatusFilterChange(pill.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#142D26] text-white border-[#142D26]"
                      : "bg-[#F7F8F6] text-[#343C36] border-[#E7EAE7] hover:bg-[#F1F3F1]"
                  }`}
                >
                  <span>{pill.label}</span>
                  {pill.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : pill.tone === "error" && pill.count > 0
                          ? "bg-[#FEF2F2] text-[#DC4C4C]"
                          : pill.tone === "warning" && pill.count > 0
                          ? "bg-[#FFFBEB] text-[#D97706]"
                          : "bg-[#E7EAE7] text-[#343C36]"
                      }`}
                    >
                      {pill.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Checkbox
            label="Ver de todos os meses (ignorar período)"
            checked={showAllMonthsOpen}
            onChange={onToggleShowAllMonthsOpen}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={onSearchQueryChange}
              placeholder="Buscar por descrição, fornecedor ou observação..."
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            aria-label="Filtrar por categoria"
            options={[
              { value: "ALL", label: "Todas as Categorias" },
              { value: "PRODUCTS", label: CATEGORY_LABELS.PRODUCTS },
              { value: "COMMISSION", label: CATEGORY_LABELS.COMMISSION },
              { value: "SALARY", label: CATEGORY_LABELS.SALARY },
              { value: "RENT", label: CATEGORY_LABELS.RENT },
              { value: "UTILITIES", label: CATEGORY_LABELS.UTILITIES },
              { value: "MAINTENANCE", label: CATEGORY_LABELS.MAINTENANCE },
              { value: "MARKETING", label: CATEGORY_LABELS.MARKETING },
              { value: "OTHER", label: CATEGORY_LABELS.OTHER },
            ]}
          />
        </div>
      </div>

      {/* Tabela de Contas a Pagar */}
      {loading ? (
        <LoadingState message="Carregando contas e despesas..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="Nenhuma conta encontrada neste filtro"
          description="Ajuste os filtros acima ou cadastre uma nova despesa para acompanhar seus vencimentos e pagamentos."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={onNewExpense}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nova Despesa
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Descrição / Fornecedor</TableHead>
                <TableHead>Categoria / Origem</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const overdue = isExpenseOverdue(expense);
                const isFromStock = Boolean(expense.stockMovement);
                const isFromCommission = expense.category === "COMMISSION";
                const isInstallment =
                  expense.recurrenceType === "INSTALLMENT" &&
                  expense.installmentNumber &&
                  expense.totalInstallments;
                const isRecurring =
                  expense.recurrenceType === "RECURRING" &&
                  expense.installmentNumber &&
                  expense.totalInstallments;

                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="font-semibold text-[#252B27]">
                        {expense.description}
                      </div>
                      {expense.supplier && (
                        <div className="text-[12px] text-[#343C36] font-medium mt-0.5">
                          Fornecedor: {expense.supplier}
                        </div>
                      )}
                      {expense.notes && (
                        <div className="text-[12px] text-[#737D75] mt-0.5 max-w-md truncate">
                          {expense.notes}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="neutral" size="sm">
                          {CATEGORY_LABELS[expense.category] || expense.category}
                        </Badge>
                        {isInstallment && (
                          <Badge variant="brand" size="sm">
                            Parcela {expense.installmentNumber}/
                            {expense.totalInstallments}
                          </Badge>
                        )}
                        {isRecurring && (
                          <Badge variant="info" size="sm">
                            Recorrente {expense.installmentNumber}/
                            {expense.totalInstallments}
                          </Badge>
                        )}
                        {isFromStock && (
                          <Badge variant="info" size="sm">
                            Estoque
                          </Badge>
                        )}
                        {isFromCommission && (
                          <Badge variant="brand" size="sm">
                            Comissões
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-[13px] text-[#737D75] whitespace-nowrap">
                      {formatShortDate(expense.dueDate)}
                    </TableCell>

                    <TableCell className="text-[13px] text-[#737D75] whitespace-nowrap">
                      {expense.paid ? (
                        <div>
                          <span className="text-[#252B27] font-medium">
                            {formatShortDate(expense.paidAt || expense.dueDate)}
                          </span>
                          {expense.paymentMethod && (
                            <span className="block text-[11px] text-[#737D75]">
                              {PAYMENT_METHOD_LABELS[expense.paymentMethod] ||
                                expense.paymentMethod}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9CA49E]">—</span>
                      )}
                    </TableCell>

                    <TableCell className="font-bold text-[#252B27] whitespace-nowrap">
                      {formatMoney(expense.amount)}
                    </TableCell>

                    <TableCell>
                      {expense.paid ? (
                        <Badge variant="success" dot size="sm">
                          Paga
                        </Badge>
                      ) : overdue ? (
                        <Badge variant="error" dot size="sm">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Atrasada
                          </span>
                        </Badge>
                      ) : (
                        <Badge variant="warning" dot size="sm">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> A Vencer
                          </span>
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {expense.paid ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReopenExpense(expense)}
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            title="Voltar conta para pendente"
                          >
                            Reabrir
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onPayExpense(expense)}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Pagar
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditExpense(expense)}
                          aria-label={`Editar ${expense.description}`}
                          title="Editar despesa"
                          className="p-2 rounded-[8px] text-[#737D75] hover:text-[#247653] hover:bg-[#E9F3EC] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteExpense(expense)}
                          aria-label={`Excluir ${expense.description}`}
                          title="Excluir despesa"
                          className="p-2 rounded-[8px] text-[#737D75] hover:text-[#DC4C4C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
