"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Building2,
  Layers,
  Users,
  Wrench,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Camera,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Card, Button, Input } from "@/components/ui";

interface BoxItem {
  name: string;
  type: string;
  capacity: number;
  color: string;
}

interface EmployeeItem {
  name: string;
  phone: string;
  role: "OPERATOR" | "ADMIN";
  commissionRate: number;
}

interface ServiceItem {
  name: string;
  category: string;
  priceHatch: number;
  priceSedan: number;
  priceSuvPickup: number;
  estimatedMinutes: number;
  defaultCommission: number;
}

interface ProductItem {
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    name: "Lavagem Técnica Detalhada",
    category: "LAVAGEM",
    priceHatch: 90,
    priceSedan: 110,
    priceSuvPickup: 140,
    estimatedMinutes: 90,
    defaultCommission: 15,
  },
  {
    name: "Polimento Comercial (Brilho & Proteção)",
    category: "POLIMENTO",
    priceHatch: 450,
    priceSedan: 550,
    priceSuvPickup: 680,
    estimatedMinutes: 180,
    defaultCommission: 20,
  },
  {
    name: "Polimento Técnico & Correção de Pintura",
    category: "POLIMENTO",
    priceHatch: 850,
    priceSedan: 1050,
    priceSuvPickup: 1300,
    estimatedMinutes: 300,
    defaultCommission: 25,
  },
  {
    name: "Higienização Interna Completa",
    category: "HIGIENIZACAO",
    priceHatch: 350,
    priceSedan: 420,
    priceSuvPickup: 500,
    estimatedMinutes: 240,
    defaultCommission: 15,
  },
  {
    name: "Vitrificação Cerâmica 9H (Pintura)",
    category: "VITRIFICACAO",
    priceHatch: 1200,
    priceSedan: 1450,
    priceSuvPickup: 1750,
    estimatedMinutes: 360,
    defaultCommission: 20,
  },
  {
    name: "Cristalização & Repelência de Vidros",
    category: "CRISTALIZACAO",
    priceHatch: 120,
    priceSedan: 140,
    priceSuvPickup: 160,
    estimatedMinutes: 45,
    defaultCommission: 15,
  },
];

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    name: "Shampoo Neutro Automotivo (V-Floc ou similar)",
    category: "CHEMICAL",
    unit: "L",
    currentStock: 3,
    minStock: 1,
    costPrice: 45,
  },
  {
    name: "Composto Polidor de Corte Rápido",
    category: "CHEMICAL",
    unit: "KG",
    currentStock: 2,
    minStock: 1,
    costPrice: 120,
  },
  {
    name: "Vitrificador Cerâmico 9H (Frasco 50ml)",
    category: "CHEMICAL",
    unit: "UN",
    currentStock: 4,
    minStock: 2,
    costPrice: 280,
  },
  {
    name: "Toalhas de Microfibra 40x40 (Pacote)",
    category: "ACCESSORY",
    unit: "UN",
    currentStock: 20,
    minStock: 5,
    costPrice: 8,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Passo 1: Identidade
  const [companyName, setCompanyName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Passo 2: Boxes
  const [boxes, setBoxes] = useState<BoxItem[]>([
    { name: "Box 01 - Lavagem & Detalhamento", type: "LAVAGEM", capacity: 1, color: "#3B82F6" },
    { name: "Box 02 - Polimento Técnico", type: "POLIMENTO", capacity: 1, color: "#D97706" },
    { name: "Box 03 - Vitrificação & Secagem", type: "GERAL", capacity: 1, color: "#16A36A" },
  ]);

  // Passo 3: Equipe
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpPhone, setNewEmpPhone] = useState("");
  const [newEmpCommission, setNewEmpCommission] = useState(15);

  // Passo 4: Serviços
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);

  // Passo 5: Estoque
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);

  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const data = await res.json();
          if (data.tenant) {
            setCompanyName(data.tenant.name || "");
            setTradingName(data.tenant.tradingName || data.tenant.name || "");
            setPhone(data.tenant.phone || "");
            setWhatsapp(data.tenant.whatsapp || data.tenant.phone || "");
            setAddress(data.tenant.address || "");
            setLogoUrl(data.tenant.logoUrl || "");
            if (data.tenant.boxes && data.tenant.boxes.length > 0) {
              setBoxes(
                data.tenant.boxes.map((b: any) => ({
                  name: b.name,
                  type: b.type || "GERAL",
                  capacity: b.capacity || 1,
                  color: b.color || "#16A36A",
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  function handleAddBox() {
    const nextNum = boxes.length + 1;
    setBoxes([
      ...boxes,
      {
        name: `Box 0${nextNum} - Vaga Operacional`,
        type: "GERAL",
        capacity: 1,
        color: "#16A36A",
      },
    ]);
  }

  function handleRemoveBox(idx: number) {
    if (boxes.length <= 1) {
      alert("A oficina precisa ter no mínimo 1 box de atendimento.");
      return;
    }
    setBoxes(boxes.filter((_, i) => i !== idx));
  }

  function handleAddEmployee() {
    if (!newEmpName.trim()) return;
    setEmployees([
      ...employees,
      {
        name: newEmpName.trim(),
        phone: newEmpPhone.trim(),
        role: "OPERATOR",
        commissionRate: Number(newEmpCommission) || 15,
      },
    ]);
    setNewEmpName("");
    setNewEmpPhone("");
    setNewEmpCommission(15);
  }

  function handleRemoveEmployee(idx: number) {
    setEmployees(employees.filter((_, i) => i !== idx));
  }

  function handleToggleService(idx: number, checked: boolean) {
    if (!checked) {
      setServices(services.filter((_, i) => i !== idx));
    }
  }

  function handleUpdateServicePrice(idx: number, field: "priceHatch" | "priceSedan" | "priceSuvPickup", val: number) {
    const next = [...services];
    next[idx] = { ...next[idx], [field]: val };
    setServices(next);
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName || "Minha Estética Automotiva",
          tradingName: tradingName || companyName,
          phone,
          whatsapp: whatsapp || phone,
          address,
          logoUrl: logoUrl || null,
          boxes,
          employees,
          services,
          products,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar pré-configuração.");

      // Redireciona para o Pátio com a oficina configurada
      window.location.href = "/patio";
    } catch (err: any) {
      setError(err.message || "Falha na conexão.");
      setSaving(false);
    }
  }

  const steps = [
    { num: 1, title: "Identidade", icon: Building2 },
    { num: 2, title: "Boxes & Pátio", icon: Layers },
    { num: 3, title: "Equipe", icon: Users },
    { num: 4, title: "Serviços", icon: Wrench },
    { num: 5, title: "Estoque", icon: Package },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#247653]" />
        <p className="text-sm font-semibold text-[#737D75]">Carregando assistente de boas-vindas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#252B27] flex flex-col justify-between p-4 sm:p-8 antialiased">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#E7EAE7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#142D26] flex items-center justify-center text-white shadow-xs">
            <Car className="w-5 h-5 text-[#E9F3EC]" />
          </div>
          <div>
            <h1 className="font-bold text-base text-[#142D26] tracking-tight">DetailPro SaaS</h1>
            <p className="text-xs text-[#737D75]">Assistente de Configuração Inicial da sua Estética</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26]">
          Passo {step} de 5
        </span>
      </div>

      {/* Stepper Navigation */}
      <div className="max-w-4xl mx-auto w-full my-6">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = s.num < step;
            const isCurrent = s.num === step;

            return (
              <div
                key={s.num}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isCurrent
                    ? "bg-white border-[#247653] shadow-xs"
                    : isDone
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                    : "bg-white/60 border-[#E7EAE7] text-[#9CA49E]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 text-xs font-bold ${
                    isCurrent
                      ? "bg-[#247653] text-white"
                      : isDone
                      ? "bg-[#16A36A] text-white"
                      : "bg-[#F1F3F1] text-[#737D75]"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] font-bold hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full my-auto">
        <div className="bg-white border border-[#E7EAE7] rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#DC4C4C]">
              {error}
            </div>
          )}

          {/* ========================================================
              PASSO 1: IDENTIDADE DA ESTÉTICA
             ======================================================== */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Passo 1: Identidade da Oficina</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                  Personalize os dados da sua empresa
                </h2>
                <p className="text-xs text-[#737D75]">
                  Esses dados aparecerão nos laudos de vistoria 360º, orçamentos oficiais e ordens de serviço.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#343C36] mb-1">
                    Nome da Estética / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Prime Auto Detailing"
                    className="w-full h-10 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#343C36] mb-1">
                    Nome Fantasia (Como seus clientes conhecem)
                  </label>
                  <input
                    type="text"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    placeholder="Ex: Prime Detailing"
                    className="w-full h-10 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#343C36] mb-1">
                    WhatsApp Comercial (Envio de Laudos e Avisos de Conclusão)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full h-10 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#343C36] mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Principal, 1500 - Bairro, Cidade/UF"
                    className="w-full h-10 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#343C36] mb-1">
                    URL da Logomarca (Opcional - pode ser configurada depois)
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://sua-empresa.com.br/logo.png"
                    className="w-full h-10 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PASSO 2: BOXES E CAPACIDADE DO PÁTIO
             ======================================================== */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                  <Layers className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Passo 2: Capacidade do seu Pátio</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                  Quantas vagas e boxes sua oficina possui?
                </h2>
                <p className="text-xs text-[#737D75]">
                  Cada box representa uma estação de trabalho no Kanban ao vivo e ajuda no cálculo de ocupação.
                </p>
              </div>

              <div className="space-y-3">
                {boxes.map((box, bIdx) => (
                  <div
                    key={bIdx}
                    className="p-3.5 rounded-2xl bg-[#F7F8F6] border border-[#E7EAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#737D75]">Box #{bIdx + 1}</span>
                      <input
                        type="text"
                        value={box.name}
                        onChange={(e) => {
                          const next = [...boxes];
                          next[bIdx].name = e.target.value;
                          setBoxes(next);
                        }}
                        className="w-full h-9 px-3 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#737D75] block">Tipo</span>
                        <select
                          value={box.type}
                          onChange={(e) => {
                            const next = [...boxes];
                            next[bIdx].type = e.target.value;
                            setBoxes(next);
                          }}
                          className="h-9 px-2 text-xs bg-white border border-[#E7EAE7] rounded-lg font-semibold"
                        >
                          <option value="LAVAGEM">Lavagem</option>
                          <option value="POLIMENTO">Polimento</option>
                          <option value="HIGIENIZACAO">Higienização</option>
                          <option value="GERAL">Geral / Acabamento</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#737D75] block">Vagas</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={box.capacity}
                          onChange={(e) => {
                            const next = [...boxes];
                            next[bIdx].capacity = parseInt(e.target.value) || 1;
                            setBoxes(next);
                          }}
                          className="w-16 h-9 px-2 text-center text-xs bg-white border border-[#E7EAE7] rounded-lg font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBox(bIdx)}
                        className="p-2 mt-4 rounded-lg text-[#DC4C4C] hover:bg-[#FEF2F2] transition cursor-pointer"
                        title="Remover Box"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddBox}
                  className="w-full py-3 rounded-2xl border border-dashed border-[#247653] text-[#247653] bg-[#ECFDF5]/50 hover:bg-[#ECFDF5] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Mais Um Box</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              PASSO 3: EQUIPE E COLABORADORES
             ======================================================== */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Passo 3: Equipe & Colaboradores</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                  Cadastre seus polidores e operadores de pátio
                </h2>
                <p className="text-xs text-[#737D75]">
                  Vincule serviços a cada profissional para cálculo automático de comissões e produtividade.
                </p>
              </div>

              {/* Formulário Rápido de Adição */}
              <div className="p-4 rounded-2xl bg-[#F7F8F6] border border-[#E7EAE7] grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#343C36] mb-1">
                    Nome do Profissional
                  </label>
                  <input
                    type="text"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    placeholder="Ex: João Silva (Polidor)"
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E7EAE7] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#343C36] mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E7EAE7] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#343C36] mb-1">
                    Comissão Padrão (%)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newEmpCommission}
                      onChange={(e) => setNewEmpCommission(parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-2 text-center text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleAddEmployee}
                      className="px-3 h-9 rounded-lg bg-[#247653] hover:bg-[#1E6346] text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Colaboradores Adicionados */}
              {employees.length > 0 ? (
                <div className="space-y-2">
                  {employees.map((emp, eIdx) => (
                    <div
                      key={eIdx}
                      className="p-3 rounded-xl bg-white border border-[#E7EAE7] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E9F3EC] text-[#142D26] font-bold flex items-center justify-center">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#252B27]">{emp.name}</p>
                          <p className="text-[11px] text-[#737D75]">
                            {emp.phone || "Sem telefone"} • Comissão: <strong>{emp.commissionRate}%</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(eIdx)}
                        className="text-[#DC4C4C] hover:bg-[#FEF2F2] p-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#737D75] bg-[#F7F8F6] rounded-2xl border border-dashed border-[#E7EAE7]">
                  Trabalha sozinho no momento? Sem problemas! Você pode avançar e adicionar a equipe depois.
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              PASSO 4: CATÁLOGO DE SERVIÇOS & TABELA DE PREÇOS
             ======================================================== */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                  <Wrench className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Passo 4: Catálogo de Serviços</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                  Ajuste seus principais serviços e preços por porte
                </h2>
                <p className="text-xs text-[#737D75]">
                  Defina os valores cobrados por categoria de veículo (Hatch, Sedan, SUV/Caminhonete).
                </p>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {services.map((srv, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-2xl bg-[#F7F8F6] border border-[#E7EAE7] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]" />
                        <span className="font-bold text-xs text-[#252B27]">{srv.name}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E7EAE7] text-[#737D75]">
                        {srv.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#737D75] mb-0.5">
                          Hatch
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#737D75]">R$</span>
                          <input
                            type="number"
                            value={srv.priceHatch}
                            onChange={(e) =>
                              handleUpdateServicePrice(sIdx, "priceHatch", parseFloat(e.target.value) || 0)
                            }
                            className="w-full h-8 pl-7 pr-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#737D75] mb-0.5">
                          Sedan
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#737D75]">R$</span>
                          <input
                            type="number"
                            value={srv.priceSedan}
                            onChange={(e) =>
                              handleUpdateServicePrice(sIdx, "priceSedan", parseFloat(e.target.value) || 0)
                            }
                            className="w-full h-8 pl-7 pr-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#737D75] mb-0.5">
                          SUV / Pickup
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#737D75]">R$</span>
                          <input
                            type="number"
                            value={srv.priceSuvPickup}
                            onChange={(e) =>
                              handleUpdateServicePrice(sIdx, "priceSuvPickup", parseFloat(e.target.value) || 0)
                            }
                            className="w-full h-8 pl-7 pr-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              PASSO 5: ESTOQUE INICIAL & CONCLUSÃO
             ======================================================== */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                  <Package className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Passo 5: Estoque Inicial Recomendado</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                  Controle inicial de insumos da oficina
                </h2>
                <p className="text-xs text-[#737D75]">
                  Deixamos produtos essenciais pré-carregados para você controlar baixas e alertas de reposição.
                </p>
              </div>

              <div className="space-y-2.5">
                {products.map((prod, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#252B27]">{prod.name}</p>
                      <p className="text-[11px] text-[#737D75]">
                        Unidade: {prod.unit} • Custo Estimado: R$ {prod.costPrice}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#737D75]">Qtd Inicial:</span>
                      <input
                        type="number"
                        min={0}
                        value={prod.currentStock}
                        onChange={(e) => {
                          const next = [...products];
                          next[pIdx].currentStock = parseFloat(e.target.value) || 0;
                          setProducts(next);
                        }}
                        className="w-16 h-8 px-2 text-center text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#16A36A] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[#065F46]">Tudo pronto para começar!</p>
                  <p className="text-[#343C36] mt-0.5">
                    Ao clicar no botão abaixo, sua oficina estará configurada com seus boxes, serviços e insumos prontos para operar no Kanban e nas vistorias.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação do Wizard */}
          <div className="pt-4 border-t border-[#E7EAE7] flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-[#E7EAE7] bg-[#F7F8F6] hover:bg-[#E9F3EC] text-xs font-bold text-[#343C36] flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !companyName.trim()) {
                    setError("Informe o nome da sua estética automotiva.");
                    return;
                  }
                  setError(null);
                  setStep(step + 1);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#247653] hover:bg-[#1E6346] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <span>Próximo Passo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="px-7 py-3 rounded-xl bg-[#16A36A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Configurando Sua Oficina...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Concluir e Acessar Meu Pátio</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-[#737D75] pt-6">
        DetailPro SaaS • Gestão Profissional para Estética Automotiva & Detailing
      </div>
    </div>
  );
}
