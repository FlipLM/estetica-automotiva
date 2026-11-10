"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Gauge,
  User,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import CustomerVehicleSelector from "@/components/modules/customer-vehicle-selector";

interface WorkBay {
  id: string;
  name: string;
  capacity: number;
  occupiedCount: number;
  availableSlots: number;
  isFull: boolean;
  status: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<WorkBay[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; role: string; active?: boolean }>>([]);
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [box, setBox] = useState("");
  const [mileage, setMileage] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<
    Array<{ serviceId: string; quantity: number; unitPrice: number; name: string }>
  >([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resVehicles, resServices, resBoxes, resMe, resEmployees] = await Promise.all([
          fetch("/api/vehicles"),
          fetch("/api/services?active=true"),
          fetch("/api/boxes"),
          fetch("/api/auth/me"),
          fetch("/api/employees").catch(() => null),
        ]);
        const jsonVehicles = await resVehicles.json();
        const jsonServices = await resServices.json();
        const jsonBoxes = await resBoxes.json();
        const jsonMe = resMe.ok ? await resMe.json() : null;
        const jsonEmployees = resEmployees && resEmployees.ok ? await resEmployees.json() : null;

        setVehicles(jsonVehicles.vehicles || []);
        setServicesCatalog(jsonServices.services || []);

        const loadedBoxes: WorkBay[] = jsonBoxes.boxes || [];
        setBoxes(loadedBoxes);

        // Identifica o colaborador logado
        if (jsonMe?.user) {
          setCurrentUser({ id: jsonMe.user.id, name: jsonMe.user.name });
          // Define por padrão o colaborador logado como responsável inicial
          setAssignedUserId(jsonMe.user.id);
        }

        // Colaboradores da equipe
        if (jsonEmployees?.employees) {
          setEmployees(jsonEmployees.employees.filter((e: any) => e.active !== false));
        } else if (jsonMe?.user) {
          setEmployees([{ id: jsonMe.user.id, name: jsonMe.user.name, role: jsonMe.user.role }]);
        }

        const firstAvailable = loadedBoxes.find((b) => !b.isFull);
        if (firstAvailable) {
          setBox(firstAvailable.name);
        } else if (loadedBoxes.length > 0) {
          setBox(loadedBoxes[0].name);
        } else {
          setBox("Box Padrão");
        }
      } catch (err) {
        console.error("Erro ao carregar dados da OS:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleSelectVehicle(vehicleId: string, vehicleObj?: any) {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicleObj || vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    if (!vehicle) return;

    setSelectedItems((prev) =>
      prev.map((item) => {
        const serv = servicesCatalog.find((s) => s.id === item.serviceId);
        if (!serv) return item;
        return {
          ...item,
          unitPrice: getPriceForCategory(serv, vehicle.category),
        };
      })
    );
  }

  function getPriceForCategory(service: any, category: string): number {
    switch (category) {
      case "HATCH":
        return service.priceHatch;
      case "SEDAN":
        return service.priceSedan;
      case "SUV_PICKUP":
        return service.priceSuvPickup;
      case "MOTORCYCLE":
        return service.priceMotorcycle;
      case "SPECIAL_UTILITY":
        return service.priceSpecial;
      default:
        return service.priceSedan;
    }
  }

  function handleAddService(serviceId: string) {
    if (!serviceId) return;
    const serv = servicesCatalog.find((s) => s.id === serviceId);
    if (!serv) return;

    const vehicle = selectedVehicle || vehicles.find((v) => v.id === selectedVehicleId);
    const category = vehicle?.category || "SEDAN";
    const price = getPriceForCategory(serv, category);

    setSelectedItems((prev) => [
      ...prev,
      {
        serviceId: serv.id,
        name: serv.name,
        quantity: 1,
        unitPrice: price,
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = selectedItems.reduce((acc, curr) => acc + curr.unitPrice * curr.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const selectedBoxObj = boxes.find(
    (b) => b.name === box || b.id === box || (b.name && box && b.name.trim().toLowerCase() === box.trim().toLowerCase())
  );
  const isSelectedBoxFull = selectedBoxObj ? selectedBoxObj.isFull : false;
  const allBoxesFull = boxes.length > 0 && boxes.every((b) => b.isFull);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicleId) {
      setError("Selecione o veículo do cliente.");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Adicione ao menos um serviço para abrir a ordem de serviço.");
      return;
    }

    if (isSelectedBoxFull && selectedBoxObj) {
      setError(
        `Bloqueado: O ${selectedBoxObj.name} está LOTADO (${selectedBoxObj.occupiedCount}/${selectedBoxObj.capacity} vagas ocupadas). Selecione outro box disponível no pátio.`
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          assignedUserId: assignedUserId || null,
          status: "TODO",
          box,
          mileage: mileage ? Number(mileage) : null,
          discount,
          notes,
          items: selectedItems.map((i) => ({
            serviceId: i.serviceId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar OS.");
      }

      router.push("/patio");
    } catch (err: any) {
      setError(err.message || "Erro na conexão.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#737D75]">
        <Loader2 className="w-7 h-7 animate-spin text-[#247653]" />
        <p className="text-xs font-medium">Carregando catálogo e status do pátio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/os"
          className="text-xs font-semibold text-[#737D75] hover:text-[#252B27] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#247653]" />
          <span>Voltar para Ordens de Serviço</span>
        </Link>

        <Link
          href="/boxes"
          className="text-xs font-semibold text-[#247653] hover:text-[#142D26] flex items-center gap-1.5 transition-colors"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Ver Ocupação dos Boxes</span>
        </Link>
      </div>

      {/* Alerta Geral: Pátio Completamente Lotado */}
      {allBoxesFull && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Capacidade Total do Pátio Esgotada
            </span>
            <p className="text-xs leading-relaxed">
              Todos os {boxes.length} boxes cadastrados atingiram o limite máximo de vagas simultâneas.
              Para liberar novas entradas, finalize ordens de serviço pendentes no{" "}
              <Link href="/patio" className="underline font-bold">
                Pátio Kanban
              </Link>{" "}
              ou aumente a capacidade das baias em{" "}
              <Link href="/boxes" className="underline font-bold">
                Boxes e Baias
              </Link>.
            </p>
          </div>
        </div>
      )}

      {/* Formulário Principal */}
      <div className="bg-white border border-[#E7EAE7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="pb-4 border-b border-[#E7EAE7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E9F3EC] flex items-center justify-center text-[#247653]">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[#252B27]">
                Nova Ordem de Serviço (Entrada no Pátio)
              </h1>
              <p className="text-xs text-[#737D75] mt-0.5">
                Abra a OS, direcione para um box disponível e envie o veículo para a linha de produção
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {error && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateOrder} className="space-y-5">
          {/* 1. Seleção de Veículo e Cliente */}
          <div className="space-y-2">
            <div className="p-4 bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl">
              <CustomerVehicleSelector
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={(vehId, vehObj) => handleSelectVehicle(vehId, vehObj)}
              />
            </div>
          </div>

          {/* 2. Seleção de Box com Indicador de Vagas e Bloqueio Automático */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#343C36] flex items-center justify-between mb-1.5">
                <span>Local / Box do Pátio <span className="text-[#DC4C4C]">*</span></span>
                {selectedBoxObj && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedBoxObj.isFull
                        ? "bg-[#FEF2F2] text-[#DC4C4C] border-[#FECACA]"
                        : "bg-[#ECFDF5] text-[#16A36A] border-[#A7F3D0]"
                    }`}
                  >
                    {selectedBoxObj.occupiedCount}/{selectedBoxObj.capacity} vagas{" "}
                    {selectedBoxObj.isFull ? "(Lotado)" : "ocupadas"}
                  </span>
                )}
              </label>

              <select
                value={box}
                onChange={(e) => setBox(e.target.value)}
                className={`dp-input ${
                  isSelectedBoxFull ? "border-[#DC4C4C] bg-[#FEF2F2] text-[#DC4C4C]" : ""
                }`}
                required
              >
                {boxes.length === 0 ? (
                  <option value="Box Padrão">Box Padrão (1 vaga)</option>
                ) : (
                  boxes.map((b) => (
                    <option
                      key={b.id}
                      value={b.name}
                      disabled={b.isFull}
                    >
                      {b.name} — ({b.occupiedCount}/{b.capacity} vagas{b.isFull ? " - LOTADO" : ` - ${b.availableSlots} livre${b.availableSlots > 1 ? "s" : ""}`})
                    </option>
                  ))
                )}
              </select>

              {isSelectedBoxFull && selectedBoxObj && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Box Lotado:</strong> O <strong>{selectedBoxObj.name}</strong> atingiu o limite de {selectedBoxObj.capacity} veículo(s). Selecione outro box livre para dar entrada.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#343C36] mb-1.5">
                Quilometragem Atual (KM)
              </label>
              <input
                type="number"
                min="0"
                value={mileage}
                onChange={(e) => setMileage(e.target.value ? Number(e.target.value) : "")}
                placeholder="Ex: 52000"
                className="dp-input"
              />
            </div>
          </div>

          {/* 3. Responsável / Colaborador pelo Serviço (Opcional & Auto-Preenchido com o Usuário Logado) */}
          <div className="p-3.5 bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <label className="text-xs font-semibold text-[#343C36] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#247653]" />
                <span>Colaborador / Operador Responsável (Opcional)</span>
              </label>
              {currentUser && (
                <span className="text-[11px] text-[#737D75]">
                  Logado como: <strong className="text-[#247653]">{currentUser.name}</strong>
                </span>
              )}
            </div>

            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="dp-input bg-white"
            >
              <option value="">Nenhum colaborador atribuído agora (Definir depois)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.id === currentUser?.id ? "— (Você)" : ""} {emp.role === "ADMIN" ? "[Admin]" : "[Operador]"}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#737D75]">
              O colaborador logado foi selecionado por padrão. Você pode alterar para outro membro da equipe ou deixar em branco para atribuir durante a execução no pátio.
            </p>
          </div>

          {/* 4. Seleção de Serviços do Catálogo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#343C36]">
              2. Serviços a serem Executados <span className="text-[#DC4C4C]">*</span>
            </label>
            <select
              disabled={!selectedVehicleId}
              onChange={(e) => {
                handleAddService(e.target.value);
                e.target.value = "";
              }}
              className="dp-input disabled:opacity-50"
            >
              <option value="">+ Clique para selecionar e adicionar um serviço...</option>
              {servicesCatalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Tabela de Itens Selecionados */}
          {selectedItems.length > 0 && (
            <div className="border border-[#E7EAE7] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F7F8F6] text-[#737D75] text-[11px] font-semibold uppercase border-b border-[#E7EAE7]">
                  <tr>
                    <th className="py-2.5 px-3">Serviço</th>
                    <th className="py-2.5 px-3 text-right">Preço Unit. (Porte)</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAE7] bg-white">
                  {selectedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F7F8F6] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#252B27]">{item.name}</td>
                      <td className="py-2.5 px-3 text-right text-[#737D75]">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#247653]">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[#9CA49E] hover:text-[#DC4C4C] p-1 transition-colors"
                          title="Remover serviço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Desconto e Totalização */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E7EAE7]">
            <div>
              <label className="block text-xs font-semibold text-[#343C36] mb-1.5">
                Desconto Concedido (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="dp-input"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col justify-end text-right bg-[#E9F3EC]/60 p-3.5 rounded-xl border border-[#C6E2D0]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#343C36]">
                Total da OS Previsto:
              </p>
              <p className="text-2xl font-extrabold text-[#142D26]">{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Observações da OS */}
          <div>
            <label className="block text-xs font-semibold text-[#343C36] mb-1.5">
              Observações Técnicas / Operacionais
            </label>
            <input
              type="text"
              placeholder="Instruções para o operador, cuidados com a pintura, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="dp-input"
            />
          </div>

          {/* Ações do Rodapé */}
          <div className="pt-4 border-t border-[#E7EAE7] flex flex-col sm:flex-row items-center justify-end gap-3">
            <Link
              href="/os"
              className="dp-btn-secondary w-full sm:w-auto text-xs text-center"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={saving || isSelectedBoxFull}
              className={`w-full sm:w-auto text-xs ${
                isSelectedBoxFull
                  ? "px-5 py-2.5 rounded-lg bg-[#F1F3F1] text-[#9CA49E] border border-[#E7EAE7] cursor-not-allowed"
                  : "dp-btn-primary cursor-pointer"
              }`}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSelectedBoxFull ? "Box Lotado (Selecione Outro)" : "Abrir OS e Enviar ao Pátio"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
