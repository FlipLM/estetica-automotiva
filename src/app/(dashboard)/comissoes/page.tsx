"use client";

import { useState, useEffect } from "react";
import {
  Award,
  DollarSign,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Car,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
} from "lucide-react";

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
    totalAmount: number;
    vehicle: {
      plate: string;
      model: string;
      customer: {
        name: string;
        phone: string;
      };
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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Liquidação
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settling, setSettling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [createExpense, setCreateExpense] = useState(true);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      let url = "/api/commissions";
      if (statusFilter !== "ALL") {
        url += `?status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.commissions || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Erro ao carregar comissões:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAllPending = () => {
    const pendingIds = commissions
      .filter((c) => c.status === "PENDING")
      .map((c) => c.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleSettle = async () => {
    if (selectedIds.length === 0) return;
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-400" />
            Extrato de Comissões & Repasse aos Colaboradores
          </h1>
          <p className="text-slate-400 text-sm">
            Apuração transparente de bonificações por serviços concluídos e liquidação financeira.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={() => setShowSettleModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors animate-pulse"
          >
            <CheckCircle2 className="w-4 h-4" />
            Liquidar ({selectedIds.length}) • R$ {selectedTotal.toFixed(2)}
          </button>
        )}
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Total de Comissões Geradas</span>
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">
              R$ {summary.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {summary.totalCount} itens bonificados registrados
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Saldo a Pagar (Pendente)</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              R$ {summary.pendingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Aguardando pagamento ou fechamento quinzenal
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
              <span>Comissões Já Liquidadas</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              R$ {summary.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Valores já repassados e integrados ao fluxo de caixa
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Comissões */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAllPending}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 border border-slate-700 bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {selectedIds.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Selecionar Pendentes
            </button>
            <span className="text-xs text-slate-400">
              {commissions.length} registros listados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PENDING">Somente Pendentes</option>
              <option value="PAID">Somente Liquidadas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-6 py-3">Colaborador</th>
                <th className="px-6 py-3">Ordem de Serviço</th>
                <th className="px-6 py-3">Veículo / Cliente</th>
                <th className="px-6 py-3">Valor da Comissão</th>
                <th className="px-6 py-3">Data / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma comissão encontrada para este filtro.
                  </td>
                </tr>
              ) : (
                commissions.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isPending = c.status === "PENDING";
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isSelected ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(c.id)}
                            className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500/40 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          {c.user.name}
                        </div>
                        <div className="text-xs text-slate-500">{c.user.email}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-slate-200">
                          OS #{c.serviceOrder.orderNumber}
                        </span>
                        <div className="text-xs text-slate-400">
                          Total OS: R$ {c.serviceOrder.totalAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          {c.serviceOrder.vehicle.model} ({c.serviceOrder.vehicle.plate})
                        </div>
                        <div className="text-xs text-slate-400">
                          {c.serviceOrder.vehicle.customer?.name || "Cliente"}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-amber-300">
                        R$ {c.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              c.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {c.status === "PAID" ? "Liquidada" : "Pendente"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Liquidação */}
      {showSettleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Confirmar Liquidação de Comissões
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Você está liquidando {selectedIds.length} comissão(ões) pendente(s).
            </p>

            <div className="bg-slate-800/60 p-4 rounded-lg mb-4 border border-slate-700">
              <div className="text-xs text-slate-400">Valor Total a Repassar</div>
              <div className="text-2xl font-bold text-emerald-400">
                R$ {selectedTotal.toFixed(2)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Forma de Pagamento Utilizada
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="PIX">PIX (Transferência Instantânea)</option>
                  <option value="CASH">Dinheiro em Espécie</option>
                  <option value="TRANSFER">Transferência Bancária / TED</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createExp"
                  checked={createExpense}
                  onChange={(e) => setCreateExpense(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="createExp" className="text-xs text-slate-300 cursor-pointer">
                  Lançar automaticamente no fluxo de caixa (DRE) como despesa de comissão
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={settling}
                onClick={handleSettle}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {settling ? "Processando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

