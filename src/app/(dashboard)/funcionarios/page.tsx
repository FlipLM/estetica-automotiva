"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
  Wrench,
  Percent,
  Phone,
  Mail,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Award,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERATOR";
  phone?: string;
  commissionRate: number;
  active: boolean;
  createdAt: string;
  _count?: {
    assignedOrders: number;
    commissions: number;
  };
}

export default function FuncionariosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "OPERATOR" as "ADMIN" | "OPERATOR",
    phone: "",
    commissionRate: 10,
    active: true,
  });

  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (res.ok) {
        setEmployees(json.employees || []);
      }
    } catch (err) {
      console.error("Erro ao buscar equipe:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  function handleOpenCreate() {
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "OPERATOR",
      phone: "",
      commissionRate: 10,
      active: true,
    });
    setError(null);
    setModalOpen(true);
  }

  function handleOpenEdit(emp: Employee) {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: "",
      role: emp.role,
      phone: emp.phone || "",
      commissionRate: emp.commissionRate || 10,
      active: emp.active,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingEmployee
        ? `/api/employees/${editingEmployee.id}`
        : "/api/employees";
      const method = editingEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar funcionário.");
      }

      setFeedback(
        editingEmployee
          ? "Cadastro atualizado com sucesso!"
          : "Novo colaborador cadastrado com sucesso!"
      );
      setModalOpen(false);
      loadEmployees();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deseja realmente remover o funcionário ${name}?`)) return;

    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Não foi possível remover o colaborador.");
        return;
      }
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setFeedback("Colaborador removido da equipe.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      alert("Erro ao comunicar com o servidor.");
    }
  }

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.phone && e.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded carbon-card border-carbon-700 bg-carbon-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-carbon-800 border border-carbon-700 flex items-center justify-center text-lime-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-display font-extrabold tracking-wide text-white uppercase flex items-center gap-2">
              <span>Gestão de Funcionários & Equipe</span>
              <span className="led-pulse-lime" />
            </h1>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              CONTROLE DE COLABORADORES, PERMISSÕES DE ACESSO E TAXAS DE COMISSÃO
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-engine-start px-3.5 py-2 rounded text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ CADASTRAR FUNCIONÁRIO</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded bg-lime-400/10 border border-lime-400/40 text-lime-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-lime-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Busca */}
      <div className="flex items-center gap-3 font-mono">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BUSCAR COLABORADOR POR NOME, E-MAIL OU TELEFONE..."
            className="w-full pl-10 pr-4 py-2 rounded bg-carbon-900 border border-carbon-700 hover:border-carbon-600 text-white placeholder-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-lime-400/50 focus:border-lime-400 transition-all uppercase"
          />
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="carbon-card overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
            <Loader2 className="w-7 h-7 animate-spin text-lime-400" />
            <p className="text-xs uppercase tracking-wider">CARREGANDO QUADRO DE EQUIPE...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            // NENHUM COLABORADOR LOCALIZADO
          </div>
        ) : (
          <div className="overflow-x-auto font-mono">
            <table className="w-full text-left text-xs">
              <thead className="bg-carbon-950/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-carbon-800 font-bold">
                <tr>
                  <th className="py-3 px-4">COLABORADOR</th>
                  <th className="py-3 px-4">PERFIL DE ACESSO</th>
                  <th className="py-3 px-4">CONTATO</th>
                  <th className="py-3 px-4 text-center">COMISSÃO PADRÃO</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-800/70">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-carbon-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{emp.name}</div>
                      <div className="text-[10px] text-slate-500">{emp.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          emp.role === "ADMIN"
                            ? "bg-lime-400/10 text-lime-400 border-lime-400/30"
                            : "bg-blue-400/10 text-blue-400 border-blue-400/30"
                        }`}
                      >
                        {emp.role === "ADMIN" ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-lime-400" />
                            <span>Administrador</span>
                          </>
                        ) : (
                          <>
                            <Wrench className="w-3 h-3 text-blue-400" />
                            <span>Operador de Pátio</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-lime-400" />
                        <span>{emp.phone || "Não informado"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-carbon-900 border border-carbon-700 text-lime-400 font-bold">
                        <Percent className="w-3 h-3" />
                        <span>{emp.commissionRate}%</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          emp.active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.active ? "bg-emerald-400" : "bg-red-400"}`} />
                        <span>{emp.active ? "Ativo" : "Inativo"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="px-2 py-1 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-carbon-600 uppercase"
                          title="Editar cadastro do funcionário"
                        >
                          <Pencil className="w-3 h-3 text-lime-400" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="p-1.5 rounded hover:bg-carbon-800 text-slate-500 hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-carbon-700"
                          title="Excluir funcionário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição de Funcionário */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="carbon-card w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto bg-carbon-900 border-carbon-700">
            <div className="flex items-center justify-between pb-3 border-b border-carbon-700">
              <h2 className="text-base font-display font-extrabold text-white uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-lime-400" />
                <span>{editingEmployee ? "Editar Funcionário" : "Novo Colaborador"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-carbon-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label-carbon">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input-carbon w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label-carbon">E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@oficina.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input-carbon w-full"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">
                    {editingEmployee ? "Nova Senha (deixe vazio p/ manter)" : "Senha de Acesso *"}
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-input-carbon w-full"
                    {...(!editingEmployee ? { required: true } : {})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label-carbon">Perfil de Acesso</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="form-select-carbon w-full font-mono text-xs"
                  >
                    <option value="OPERATOR">Operador de Pátio</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="form-label-carbon">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input-carbon w-full font-mono"
                  />
                </div>

                <div>
                  <label className="form-label-carbon">Comissão Padrão (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    className="form-input-carbon w-full font-mono font-bold text-lime-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="form-checkbox-carbon"
                  />
                  <span>Colaborador com acesso ativo ao sistema</span>
                </label>
              </div>

              <div className="pt-4 border-t border-carbon-700 flex items-center justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded bg-carbon-800 hover:bg-carbon-700 text-slate-300 border border-carbon-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-engine-start px-4 py-2 rounded flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingEmployee ? "Salvar Alterações" : "Salvar Funcionário"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

