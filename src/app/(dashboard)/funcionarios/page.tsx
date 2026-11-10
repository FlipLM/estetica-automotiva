"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Wrench,
  Percent,
  Phone,
} from "lucide-react";
import {
  Button,
  Badge,
  PageHeader,
  Modal,
  Alert,
  EmptyState,
  LoadingState,
  Input,
  Select,
  Checkbox,
  SearchInput,
} from "@/components/ui";

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
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deseja realmente remover o colaborador ${name}?`)) return;

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

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.phone && e.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe e Colaboradores"
        description="Gerencie os profissionais da estética, permissões de acesso (Administrador ou Operador) e percentuais de comissão."
        actions={
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Cadastrar Colaborador
          </Button>
        }
      />

      {feedback && <Alert variant="success" title={feedback} />}

      <SearchInput
        value={search}
        onChange={(val) => setSearch(val)}
        onClear={search ? () => setSearch("") : undefined}
        placeholder="Buscar colaborador por nome, e-mail ou telefone..."
      />

      {/* Tabela de Colaboradores */}
      <div className="bg-white border border-[#E7EAE7] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <LoadingState message="Carregando equipe..." />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Nenhum colaborador encontrado"
            description="Cadastre os membros da sua equipe para atribuir ordens de serviço e calcular comissões automaticamente."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Cadastrar Colaborador
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8F6] text-[#737D75] uppercase text-xs border-b border-[#E7EAE7]">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Colaborador</th>
                  <th className="py-3.5 px-6 font-semibold">Perfil de Acesso</th>
                  <th className="py-3.5 px-6 font-semibold">Contato</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Comissão Padrão</th>
                  <th className="py-3.5 px-6 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F1]">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F7F8F6]/70 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-[#252B27]">{emp.name}</div>
                      <div className="text-xs text-[#737D75]">{emp.email}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      {emp.role === "ADMIN" ? (
                        <Badge variant="brand" size="sm">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Administrador
                        </Badge>
                      ) : (
                        <Badge variant="info" size="sm">
                          <Wrench className="w-3.5 h-3.5 mr-1" />
                          Operador de Pátio
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-[#252B27] text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#247653]" />
                        <span>{emp.phone || "Não informado"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-[#E9F3EC] text-[#142D26] font-semibold text-xs">
                        <Percent className="w-3 h-3 text-[#247653]" />
                        <span>{emp.commissionRate}%</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <Badge variant={emp.active ? "success" : "error"} size="sm" dot>
                        {emp.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(emp)}
                          leftIcon={<Pencil className="w-3.5 h-3.5" />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(emp.id, emp.name)}
                          className="text-[#737D75] hover:text-[#DC4C4C]"
                          title="Excluir colaborador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
        description="Defina os dados de acesso, o nível de permissão e a taxa de comissão padrão."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error" title={error} />}

          <Input
            label="Nome Completo"
            required
            placeholder="Ex: Carlos Eduardo de Oliveira"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="E-mail de Acesso"
              type="email"
              required
              placeholder="carlos@oficina.com.br"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label={
                editingEmployee
                  ? "Nova Senha (deixe vazio p/ manter)"
                  : "Senha de Acesso"
              }
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              {...(!editingEmployee ? { required: true } : {})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Select
              label="Perfil de Acesso"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as "ADMIN" | "OPERATOR" })
              }
              options={[
                { value: "OPERATOR", label: "Operador de Pátio" },
                { value: "ADMIN", label: "Administrador" },
              ]}
            />

            <Input
              label="Telefone / WhatsApp"
              placeholder="(11) 99999-8888"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Comissão Padrão (%)"
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={formData.commissionRate}
              onChange={(e) =>
                setFormData({ ...formData, commissionRate: Number(e.target.value) })
              }
            />
          </div>

          <Checkbox
            label="Colaborador com acesso ativo ao sistema"
            checked={formData.active}
            onChange={(checked) => setFormData({ ...formData, active: checked })}
          />

          <div className="pt-4 border-t border-[#E7EAE7] flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingEmployee ? "Salvar Alterações" : "Cadastrar Colaborador"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
