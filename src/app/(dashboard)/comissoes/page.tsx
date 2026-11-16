"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Award,
  DollarSign,
  Clock,
  CheckCircle2,
  User,
  Car,
  Filter,
  CheckSquare,
  Square,
  Calendar,
} from "lucide-react";
import {
  Button,
  Badge,
  StatCard,
  PageHeader,
  Modal,
  EmptyState,
  LoadingState,
  Select,
  Checkbox,
  Pagination,
} from "@/components/ui";

interface Commission {
  id: string;
  amount: number;
  status: "PENDING" | "PAID";
  paidAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  serviceOrder: {
    id: string;
    orderNumber: number;
    status: string;
    totalAmount: number | null;
    vehicle: {
      plate: string;
      model: string;
      customer?: {
        name: string;
        phone?: string;
      } | null;
    };
  };
}

interface Summary {
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  totalCount: number;
}

export default function ComissoesPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userRole, setUserRole] = useState<"ADMIN" | "OPERATOR">("OPERATOR");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settling, setSettling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [createExpense, setCreateExpense] = useState(true);

  const isAdmin = userRole === "ADMIN";

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (periodFilter !== "all") {
        params.set("period", periodFilter);
      }

      const res = await fetch(`/api/commissions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.commissions || []);
        setSummary(data.summary || null);
        if (data.role) {
          setUserRole(data.role);
        }
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.totalItems || 0);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar comissões:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, periodFilter]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleStatusFilterChange = (newStatus: string) => {
    setSelectedIds([]);
    setPage(1);
    setStatusFilter(newStatus);
  };

  const handlePeriodFilterChange = (newPeriod: string) => {
    setSelectedIds([]);
    setPage(1);
    setPeriodFilter(newPeriod);
  };

  const toggleSelect = (id: string) => {
    if (!isAdmin) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAllPending = () => {
    if (!isAdmin) return;
    const pendingIds = commissions
      .filter((c) => c.status === "PENDING")
      .map((c) => c.id);
    if (pendingIds.length > 0 && selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleSettle = async () => {
    if (!isAdmin || selectedIds.length === 0) return;
    setSettling(true);
    try {
      const res = await fetch("/api/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionIds: selectedIds,
          createExpense,
          paymentMethod,
        }),
      });

      if (res.ok) {
        setShowSettleModal(false);
        setSelectedIds([]);
        await fetchCommissions();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao liquidar comissões");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com o servidor");
    } finally {
      setSettling(false);
    }
  };

  const selectedTotal = commissions
    .filter((c) => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);

  const fmtCurrency = (val: number) =>
    `R$ ${(val ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões da Equipe"
        description={
          isAdmin
            ? "Apuração transparente de comissões por serviços concluídos e repasse financeiro aos colaboradores."
            : "Acompanhe suas comissões geradas por serviços concluídos e os valores já repassados."
        }
        actions={
          isAdmin && selectedIds.length > 0 ? (
            <Button
              variant="primary"
              onClick={() => setShowSettleModal(true)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Liquidar Selecionadas ({selectedIds.length}) • {fmtCurrency(selectedTotal)}
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingState message="Carregando extrato de comissões..." />
      ) : (
        <>
          {/* Cards de Resumo */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Total de Comissões Geradas"
                value={fmtCurrency(summary.totalAmount)}
                subtitle={`${summary.totalCount} itens bonificados no período`}
                icon={<DollarSign className="w-5 h-5" />}
                variant="brand"
              />
              <StatCard
                label="Saldo a Pagar (Pendente)"
                value={fmtCurrency(summary.pendingAmount)}
                subtitle="Aguardando pagamento ou fechamento"
                icon={<Clock className="w-5 h-5" />}
                variant="warning"
              />
              <StatCard
                label="Comissões Já Liquidadas"
                value={fmtCurrency(summary.paidAmount)}
                subtitle="Valores já repassados"
                icon={<CheckCircle2 className="w-5 h-5" />}
                variant="success"
              />
            </div>
          )}

          {/* Tabela de Comissões */}
          <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-[#E7EAE7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPending}
                    leftIcon={
                      selectedIds.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#247653]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )
                    }
                  >
                    Selecionar Pendentes
                  </Button>
                )}
                <span className="text-xs text-[#737D75]">
                  {totalItems} registro(s) encontrado(s)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#737D75]" />
                  <select
                    value={periodFilter}
                    onChange={(e) => handlePeriodFilterChange(e.target.value)}
                    className="form-select text-xs h-9 py-1.5"
                    aria-label="Filtrar período das comissões"
                  >
                    <option value="all">Todo o Período</option>
                    <option value="current_month">Mês Atual</option>
                    <option value="last_month">Mês Anterior</option>
                    <option value="7_days">Últimos 7 dias</option>
                    <option value="year">Ano Atual</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-[#737D75]" />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="form-select text-xs h-9 py-1.5"
                    aria-label="Filtrar status das comissões"
                  >
                    <option value="ALL">Todos os Status</option>
                    <option value="PENDING">Somente Pendentes</option>
                    <option value="PAID">Somente Liquidadas</option>
                  </select>
                </div>
              </div>
            </div>

            {commissions.length === 0 ? (
              <EmptyState
                icon={<Award className="w-6 h-6" />}
                title="Nenhuma comissão encontrada"
                description="As comissões são geradas automaticamente quando uma Ordem de Serviço com colaborador atribuído é paga."
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                      <tr>
                        {isAdmin && <th className="px-4 py-3 w-10"></th>}
                        <th className="px-6 py-3 font-semibold">Colaborador</th>
                        <th className="px-6 py-3 font-semibold">Ordem de Serviço</th>
                        <th className="px-6 py-3 font-semibold">Veículo / Cliente</th>
                        <th className="px-6 py-3 font-semibold">Valor da Comissão</th>
                        <th className="px-6 py-3 font-semibold">Data / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F3F1]">
                      {commissions.map((c) => {
                        const isSelected = selectedIds.includes(c.id);
                        const isPending = c.status === "PENDING";
                        return (
                          <tr
                            key={c.id}
                            className={`hover:bg-[#F7F8F6]/70 transition-colors ${
                              isSelected ? "bg-[#E9F3EC]/40" : ""
                            }`}
                          >
                            {isAdmin && (
                              <td className="px-4 py-3.5 text-center">
                                {isPending ? (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelect(c.id)}
                                    className="w-4 h-4 rounded border-[#D4D9D4] text-[#247653] focus:ring-[#247653] cursor-pointer"
                                  />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] mx-auto" />
                                )}
                              </td>
                            )}
                            <td className="px-6 py-3.5">
                              <div className="font-semibold text-[#252B27] flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#247653]" />
                                {c.user.name}
                              </div>
                              <div className="text-xs text-[#737D75]">{c.user.email}</div>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="font-semibold text-[#252B27]">
                                OS #{c.serviceOrder.orderNumber}
                              </span>
                              {isAdmin &&
                                c.serviceOrder.totalAmount !== null &&
                                c.serviceOrder.totalAmount !== undefined && (
                                  <div className="text-xs text-[#737D75]">
                                    Total OS: {fmtCurrency(c.serviceOrder.totalAmount)}
                                  </div>
                                )}
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="text-xs font-semibold text-[#252B27] flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-[#737D75]" />
                                {c.serviceOrder.vehicle.model} ({c.serviceOrder.vehicle.plate})
                              </div>
                              <div className="text-xs text-[#737D75]">
                                {c.serviceOrder.vehicle.customer?.name || "Cliente"}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 font-bold text-[#247653]">
                              {fmtCurrency(c.amount)}
                            </td>
                            <td className="px-6 py-3.5">
                              <Badge variant={c.status === "PAID" ? "success" : "warning"} size="sm">
                                {c.status === "PAID" ? "Liquidada" : "Pendente"}
                              </Badge>
                              <div className="text-xs text-[#737D75] mt-1">
                                {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-6 pb-4">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      onPageChange={(newPage) => {
                        setSelectedIds([]);
                        setPage(newPage);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Modal de Liquidação (Apenas ADMIN) */}
      {isAdmin && (
        <Modal
          isOpen={showSettleModal}
          onClose={() => setShowSettleModal(false)}
          title="Confirmar Liquidação de Comissões"
          description={`Você está liquidando ${selectedIds.length} comissão(ões) pendente(s).`}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-[#E9F3EC] p-4 rounded-xl border border-[#247653]/20 flex items-center justify-between">
              <span className="text-xs font-medium text-[#142D26]">Valor Total a Repassar:</span>
              <span className="text-xl font-bold text-[#247653]">
                {fmtCurrency(selectedTotal)}
              </span>
            </div>

            <Select
              label="Forma de Pagamento Utilizada"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: "PIX", label: "PIX (Transferência Instantânea)" },
                { value: "CASH", label: "Dinheiro em Espécie" },
                { value: "TRANSFER", label: "Transferência Bancária / TED" },
              ]}
            />

            <Checkbox
              label="Lançar automaticamente no fluxo de caixa (DRE) como despesa de comissão"
              checked={createExpense}
              onChange={(checked) => setCreateExpense(checked)}
            />

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7EAE7]">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowSettleModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={settling}
                onClick={handleSettle}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
