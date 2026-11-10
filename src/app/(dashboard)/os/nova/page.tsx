"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Trash2,
  Plus,
  AlertCircle,
  AlertTriangle,
  Car,
  Wrench,
  Gauge,
  CheckCircle2,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
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
        const [resVehicles, resServices, resBoxes] = await Promise.all([
          fetch("/api/vehicles"),
          fetch("/api/services?active=true"),
          fetch("/api/boxes"),
        ]);
        const jsonVehicles = await resVehicles.json();
        const jsonServices = await resServices.json();
        const jsonBoxes = await resBoxes.json();

        setVehicles(jsonVehicles.vehicles || []);
        setServicesCatalog(jsonServices.services || []);
        
        const loadedBoxes: WorkBay[] = jsonBoxes.boxes || [];
        setBoxes(loadedBoxes);

        // Define automaticamente o primeiro box com vaga disponível
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

  // Verificações de Lotação do Box Selecionado
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
          status: "TODO", // Vai direto para o Pátio (Para Fazer)
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
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono">
        <Loader2 className="w-7 h-7 animate-spin text-lime-400" />
        <p className="text-xs uppercase tracking-wider">CARREGANDO CATÁLOGO E STATUS DO PÁTIO...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <Link
          href="/os"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4 text-lime-400" />
          <span>Voltar para Ordens de Serviço</span>
        </Link>

        <Link
          href="/boxes"
          className="text-xs text-slate-400 hover:text-lime-400 flex items-center gap-1.5 transition-colors font-mono"
        >
          <Gauge className="w-3.5 h-3.5 text-lime-400" />
          <span>Ver Ocupação dos Boxes</span>
        </Link>
      </div>

      {/* Alerta Geral: Pátio Completamente Lotado */}
      {allBoxesFull && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 font-mono">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block text-rose-200">
              ⛔ CAPACIDADE TOTAL DO PÁTIO ESGOTADA
            </span>
            <p className="text-[11px] text-rose-300/80 leading-relaxed">
              Todos os {boxes.length} boxes cadastrados atingiram o limite máximo de vagas simultâneas.
              Para liberar novas entradas, finalize ordens de serviço pendentes no{" "}
              <Link href="/patio" className="underline font-bold text-rose-200 hover:text-white">
                Pátio Kanban
              </Link>{" "}
              ou aumente a capacidade das baias em{" "}
              <Link href="/boxes" className="underline font-bold text-rose-200 hover:text-white">
                Boxes & Baias
              </Link>.
            </p>
          </div>
        </div>
      )}

      {/* Formulário Principal */}
      <div className="carbon-card p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-carbon-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="led-pulse-lime" />
              <span className="text-[10px] font-mono tracking-widest text-lime-400 uppercase">
                // CHECK-IN & RECEPTIVO
              </span>
            </div>
            <h1 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-lime-400" />
              <span>Nova Ordem de Serviço (Entrada no Pátio)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Abra a OS, direcione para um box disponível e envie o veículo para a linha de produção.
            </p>
          </div>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateOrder} className="space-y-5">
          {/* 1. Seleção de Veículo e Cliente */}
          <div className="space-y-2">
            <label className="form-label-carbon">1. Veículo & Cliente *</label>
            <div className="p-3.5 bg-carbon-950 border border-carbon-700 rounded-lg">
              <CustomerVehicleSelector
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={(vehId, vehObj) => handleSelectVehicle(vehId, vehObj)}
              />
            </div>
          </div>

          {/* 2. Seleção de Box com Indicador de Vagas e Bloqueio Automático */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label-carbon flex items-center justify-between">
                <span>Local / Box do Pátio *</span>
                {selectedBoxObj && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      selectedBoxObj.isFull
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-lime-500/10 text-lime-400 border-lime-500/30"
                    }`}
                  >
                    {selectedBoxObj.occupiedCount}/{selectedBoxObj.capacity} VAGAS{" "}
                    {selectedBoxObj.isFull ? "(LOTADO)" : "OCUPADAS"}
                  </span>
                )}
              </label>

              <select
                value={box}
                onChange={(e) => setBox(e.target.value)}
                className={`form-select-carbon w-full ${
                  isSelectedBoxFull ? "border-rose-500/50 bg-rose-950/20 text-rose-300" : ""
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
                      className={b.isFull ? "text-slate-500 bg-carbon-950" : "text-white bg-carbon-900"}
                    >
                      {b.name} — ({b.occupiedCount}/{b.capacity} vagas{b.isFull ? " - LOTADO / BLOQUEADO" : ` - ${b.availableSlots} livre${b.availableSlots > 1 ? "s" : ""}`})
                    </option>
                  ))
                )}
              </select>

              {/* Alerta de Box Cheio */}
              {isSelectedBoxFull && selectedBoxObj && (
                <div className="mt-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    <strong>Box Lotado:</strong> O <strong>{selectedBoxObj.name}</strong> atingiu o limite de {selectedBoxObj.capacity} veículo(s). Selecione outro box livre para dar entrada.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="form-label-carbon">Quilometragem Atual (KM)</label>
              <input
                type="number"
                min="0"
                value={mileage}
                onChange={(e) => setMileage(e.target.value ? Number(e.target.value) : "")}
                placeholder="Ex: 52000"
                className="form-input-carbon w-full"
              />
            </div>
          </div>

          {/* 3. Seleção de Serviços do Catálogo */}
          <div className="space-y-2">
            <label className="form-label-carbon">2. Serviços a serem Executados *</label>
            <select
              disabled={!selectedVehicleId}
              onChange={(e) => {
                handleAddService(e.target.value);
                e.target.value = "";
              }}
              className="form-select-carbon w-full disabled:opacity-50"
            >
              <option value="">+ Clique para selecionar e adicionar um serviço...</option>
              {servicesCatalog.map((s) => (
                <option key={s.id} value={s.id} className="bg-carbon-900 text-white">
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Tabela de Itens Selecionados */}
          {selectedItems.length > 0 && (
            <div className="border border-carbon-700 rounded-lg overflow-hidden text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-carbon-950 text-slate-400 text-[10px] uppercase border-b border-carbon-700">
                  <tr>
                    <th className="py-2.5 px-3">Serviço</th>
                    <th className="py-2.5 px-3 text-right">Preço Unit. (Porte)</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-800 bg-carbon-900/40">
                  {selectedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-carbon-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">{item.name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-lime-400">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-carbon-700">
            <div>
              <label className="form-label-carbon">Desconto Concedido (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="form-input-carbon w-full"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col justify-end text-right font-mono bg-carbon-950/60 p-3 rounded-lg border border-carbon-800">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Total da OS Previsto:</p>
              <p className="text-2xl font-black text-lime-400">{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Observações da OS */}
          <div>
            <label className="form-label-carbon">Observações Técnicas / Operacionais</label>
            <input
              type="text"
              placeholder="Instruções para o operador, cuidados com a pintura, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input-carbon w-full"
            />
          </div>

          {/* Ações do Rodapé */}
          <div className="pt-4 border-t border-carbon-700 flex flex-col sm:flex-row items-center justify-end gap-3 font-mono">
            <Link
              href="/os"
              className="w-full sm:w-auto px-4 py-2.5 rounded hover:bg-carbon-800 text-slate-400 hover:text-white text-xs text-center transition-colors"
            >
              CANCELAR
            </Link>

            <button
              type="submit"
              disabled={saving || isSelectedBoxFull}
              className={`w-full sm:w-auto px-6 py-2.5 text-xs flex items-center justify-center gap-2 ${
                isSelectedBoxFull
                  ? "bg-carbon-800 text-slate-500 border border-carbon-700 cursor-not-allowed opacity-60"
                  : "btn-engine-start cursor-pointer"
              }`}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSelectedBoxFull ? "BOX LOTADO (SELECIONE OUTRO)" : "ABRIR OS & ENVIAR AO PÁTIO"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
