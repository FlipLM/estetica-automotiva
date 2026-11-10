"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Layers,
  Users,
  Wrench,
  Package,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Car,
  Loader2,
  Upload,
  Image as ImageIcon,
  Tag,
  SkipForward,
} from "lucide-react";

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
  estimatedMinutes?: number;
  defaultCommission?: number;
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
    name: "Lavagem Detalhada Completa",
    category: "LAVAGEM",
    priceHatch: 90,
    priceSedan: 110,
    priceSuvPickup: 140,
    estimatedMinutes: 90,
    defaultCommission: 15,
  },
  {
    name: "Polimento Técnico Comercial",
    category: "POLIMENTO",
    priceHatch: 450,
    priceSedan: 550,
    priceSuvPickup: 700,
    estimatedMinutes: 240,
    defaultCommission: 20,
  },
  {
    name: "Polimento Técnico Detalhado (Correção)",
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Passo 1: Identidade
  const [companyName, setCompanyName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Passo 2: Boxes e Categorias de Box
  const [boxCategories, setBoxCategories] = useState<string[]>([
    "LAVAGEM",
    "POLIMENTO",
    "HIGIENIZACAO",
    "GERAL",
    "VITRIFICACAO",
    "PPF_INSULFILM",
    "ESTUFA",
    "RAMPA",
  ]);
  const [newBoxCategory, setNewBoxCategory] = useState("");
  const [showAddBoxCat, setShowAddBoxCat] = useState(false);
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

  // Passo 4: Serviços e Categorias de Serviços
  const [serviceCategories, setServiceCategories] = useState<string[]>([
    "LAVAGEM",
    "POLIMENTO",
    "HIGIENIZACAO",
    "VITRIFICACAO",
    "CRISTALIZACAO",
    "PPF_PELICULAS",
    "MARTELINHO",
    "ESTETICA_RODAS",
    "OUTROS",
  ]);
  const [newServiceCategory, setNewServiceCategory] = useState("");
  const [showAddServiceCat, setShowAddServiceCat] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  
  // Novo serviço formulário
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCat, setNewServiceCat] = useState("LAVAGEM");
  const [newServiceHatch, setNewServiceHatch] = useState(100);
  const [newServiceSedan, setNewServiceSedan] = useState(120);
  const [newServiceSuv, setNewServiceSuv] = useState(150);
  const [newServiceMinutes, setNewServiceMinutes] = useState(60);

  // Passo 5: Estoque
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCat, setNewProdCat] = useState("CHEMICAL");
  const [newProdUnit, setNewProdUnit] = useState("UN");
  const [newProdCost, setNewProdCost] = useState(0);
  const [newProdStock, setNewProdStock] = useState(1);

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
            if (data.tenant.services && data.tenant.services.length > 0) {
              setServices(
                data.tenant.services.map((s: any) => ({
                  name: s.name,
                  category: s.category || "LAVAGEM",
                  priceHatch: s.priceHatch || 80,
                  priceSedan: s.priceSedan || 100,
                  priceSuvPickup: s.priceSuvPickup || 130,
                  estimatedMinutes: s.estimatedMinutes || 60,
                  defaultCommission: s.defaultCommission || 15,
                }))
              );
            }
            if (data.tenant.products && data.tenant.products.length > 0) {
              setProducts(
                data.tenant.products.map((p: any) => ({
                  name: p.name,
                  category: p.category || "CHEMICAL",
                  unit: p.unit || "UN",
                  currentStock: p.currentStock || 0,
                  minStock: p.minStock || 1,
                  costPrice: p.costPrice || 0,
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no upload da logomarca.");

      setLogoUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Falha ao enviar arquivo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  // Ações de Boxes
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
    setBoxes(boxes.filter((_, i) => i !== idx));
  }

  function handleCreateBoxCategory() {
    const clean = newBoxCategory.trim().toUpperCase().replace(/\s+/g, "_");
    if (!clean) return;
    if (!boxCategories.includes(clean)) {
      setBoxCategories([...boxCategories, clean]);
    }
    setNewBoxCategory("");
    setShowAddBoxCat(false);
  }

  // Ações de Colaboradores
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

  // Ações de Serviços
  function handleRemoveService(idx: number) {
    setServices(services.filter((_, i) => i !== idx));
  }

  function handleUpdateServicePrice(idx: number, field: "priceHatch" | "priceSedan" | "priceSuvPickup", val: number) {
    const next = [...services];
    next[idx] = { ...next[idx], [field]: val };
    setServices(next);
  }

  function handleCreateServiceCategory() {
    const clean = newServiceCategory.trim().toUpperCase().replace(/\s+/g, "_");
    if (!clean) return;
    if (!serviceCategories.includes(clean)) {
      setServiceCategories([...serviceCategories, clean]);
    }
    setNewServiceCategory("");
    setShowAddServiceCat(false);
  }

  function handleAddNewService() {
    if (!newServiceName.trim()) return;
    setServices([
      ...services,
      {
        name: newServiceName.trim(),
        category: newServiceCat,
        priceHatch: Number(newServiceHatch) || 80,
        priceSedan: Number(newServiceSedan) || 100,
        priceSuvPickup: Number(newServiceSuv) || 130,
        estimatedMinutes: Number(newServiceMinutes) || 60,
        defaultCommission: 15,
      },
    ]);
    setNewServiceName("");
    setShowAddServiceModal(false);
  }

  // Ações de Produtos
  function handleRemoveProduct(idx: number) {
    setProducts(products.filter((_, i) => i !== idx));
  }

  function handleAddNewProduct() {
    if (!newProdName.trim()) return;
    setProducts([
      ...products,
      {
        name: newProdName.trim(),
        category: newProdCat,
        unit: newProdUnit,
        costPrice: Number(newProdCost) || 0,
        currentStock: Number(newProdStock) || 0,
        minStock: 1,
      },
    ]);
    setNewProdName("");
    setNewProdCost(0);
    setNewProdStock(1);
    setShowAddProductModal(false);
  }

  async function handleFinish(skipAll = false) {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        companyName: companyName.trim() || "Minha Estética Automotiva",
        tradingName: tradingName.trim() || companyName.trim() || "Estética Automotiva",
        phone: phone.trim() || "",
        whatsapp: whatsapp.trim() || phone.trim() || "",
        address: address.trim() || "",
        logoUrl: logoUrl.trim() || "",
        boxes: skipAll
          ? []
          : boxes.map((b) => ({
              name: b.name.trim(),
              type: b.type || "GERAL",
              capacity: Number(b.capacity) || 1,
              color: b.color || "#16A36A",
            })),
        employees: skipAll
          ? []
          : employees.map((e) => ({
              name: e.name.trim(),
              phone: e.phone ? e.phone.trim() : "",
              role: e.role || "OPERATOR",
              commissionRate: Number(e.commissionRate) || 15,
            })),
        services: skipAll
          ? []
          : services.map((s) => ({
              name: s.name.trim(),
              category: s.category || "LAVAGEM",
              priceHatch: Number(s.priceHatch) || 80,
              priceSedan: Number(s.priceSedan) || 100,
              priceSuvPickup: Number(s.priceSuvPickup) || 130,
              estimatedMinutes: Number(s.estimatedMinutes) || 60,
              defaultCommission: Number(s.defaultCommission) || 15,
            })),
        products: skipAll
          ? []
          : products.map((p) => ({
              name: p.name.trim(),
              category: p.category || "CHEMICAL",
              unit: p.unit || "UN",
              currentStock: Number(p.currentStock) || 0,
              minStock: Number(p.minStock) || 1,
              costPrice: Number(p.costPrice) || 0,
            })),
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar pré-configuração.");

      // Redireciona para o Pátio com a oficina pronta
      window.location.href = "/patio";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha na conexão com o servidor.");
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleFinish(true)}
            disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E7EAE7] bg-white hover:bg-[#F1F3F1] text-[#737D75] hover:text-[#252B27] transition flex items-center gap-1.5 cursor-pointer"
            title="Pular todas as etapas e configurar mais tarde nas opções do sistema"
          >
            <SkipForward className="w-3.5 h-3.5 text-[#737D75]" />
            <span className="hidden sm:inline">Pular tudo e ir ao Pátio</span>
          </button>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#E9F3EC] text-[#142D26]">
            Passo {step} de 5
          </span>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="max-w-4xl mx-auto w-full my-6">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = s.num < step;
            const isCurrent = s.num === step;

            return (
              <button
                type="button"
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full my-auto">
        <div className="bg-white border border-[#E7EAE7] rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#DC4C4C] flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[#DC4C4C] hover:opacity-75 font-bold text-xs"
              >
                ✕
              </button>
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
                    WhatsApp Comercial (Envio de Laudos e Avisos)
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
                    Telefone Fixo / Adicional
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 3333-4444"
                    className="w-full h-10 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#343C36] mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. dos Bandeirantes, 1500 - São Paulo, SP"
                    className="w-full h-10 px-3 text-xs bg-[#F7F8F6] border border-[#E7EAE7] rounded-xl focus:outline-none focus:border-[#247653]"
                  />
                </div>

                {/* Upload de Logo */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F7F8F6] border border-[#E7EAE7]">
                  <label className="block text-xs font-bold text-[#343C36] mb-2">
                    Logomarca da sua Estética (PNG ou JPG)
                  </label>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="relative w-20 h-20 rounded-xl border border-[#E7EAE7] bg-white overflow-hidden p-1 flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border border-dashed border-[#D2D7D3] bg-white flex flex-col items-center justify-center text-[#9CA49E] shrink-0">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Sem logo</span>
                      </div>
                    )}

                    <div className="space-y-2 flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="px-3.5 py-2 rounded-xl bg-[#247653] hover:bg-[#1E6346] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Enviando foto...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Selecionar Imagem</span>
                            </>
                          )}
                        </button>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl("")}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-[#DC4C4C] hover:bg-[#FEF2F2] transition cursor-pointer"
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-[#737D75]">
                        Sua marca sairá com destaque nos laudos PDF gerados para os seus clientes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PASSO 2: BOXES E VAGAS OPERACIONAIS
             ======================================================== */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                    <Layers className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Passo 2: Boxes & Pátio Operacional</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                    Defina a estrutura física e categorias de boxes
                  </h2>
                  <p className="text-xs text-[#737D75]">
                    Organize as baias de lavagem, salas de polimento ou crie novas categorias conforme a sua oficina.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddBoxCat(!showAddBoxCat)}
                  className="px-3 py-1.5 rounded-xl border border-[#247653]/30 bg-[#ECFDF5] text-[#247653] hover:bg-[#D1FAE5] text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-center transition cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>+ Criar Categoria de Box</span>
                </button>
              </div>

              {/* Modal / Card para criar nova categoria */}
              {showAddBoxCat && (
                <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                  <span className="text-xs font-bold text-[#065F46] block">
                    Nome da Nova Categoria de Box / Baia:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBoxCategory}
                      onChange={(e) => setNewBoxCategory(e.target.value)}
                      placeholder="Ex: PPF / Insulfilm, Rampa 3D, Estufa de Secagem..."
                      className="flex-1 h-9 px-3 text-xs bg-white border border-[#A7F3D0] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleCreateBoxCategory}
                      className="px-4 h-9 rounded-lg bg-[#247653] text-white text-xs font-bold hover:bg-[#1E6346] transition cursor-pointer"
                    >
                      Salvar Categoria
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddBoxCat(false)}
                      className="px-3 h-9 rounded-lg border border-[#A7F3D0] text-[#065F46] text-xs font-bold hover:bg-white transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Boxes */}
              <div className="space-y-3">
                {boxes.map((box, bIdx) => (
                  <div
                    key={bIdx}
                    className="p-3.5 rounded-2xl bg-[#F7F8F6] border border-[#E7EAE7] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <span className="text-[10px] uppercase font-bold text-[#737D75] block mb-0.5">
                        Nome do Box #{bIdx + 1}
                      </span>
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
                      <div className="flex-1 sm:w-44">
                        <span className="text-[10px] uppercase font-bold text-[#737D75] block mb-0.5">
                          Categoria / Tipo
                        </span>
                        <select
                          value={box.type}
                          onChange={(e) => {
                            const next = [...boxes];
                            next[bIdx].type = e.target.value;
                            setBoxes(next);
                          }}
                          className="w-full h-9 px-2 text-xs bg-white border border-[#E7EAE7] rounded-lg font-semibold"
                        >
                          {boxCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-16">
                        <span className="text-[10px] uppercase font-bold text-[#737D75] block mb-0.5">
                          Vagas
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={box.capacity}
                          onChange={(e) => {
                            const next = [...boxes];
                            next[bIdx].capacity = parseInt(e.target.value) || 1;
                            setBoxes(next);
                          }}
                          className="w-full h-9 px-2 text-center text-xs bg-white border border-[#E7EAE7] rounded-lg font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBox(bIdx)}
                        className="p-2 mt-4 rounded-lg text-[#DC4C4C] hover:bg-[#FEF2F2] transition cursor-pointer shrink-0"
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
                        title="Remover colaborador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#737D75] bg-[#F7F8F6] rounded-2xl border border-dashed border-[#E7EAE7]">
                  Trabalha sozinho no momento? Sem problemas! Você pode avançar ou pular esta etapa e cadastrar a equipe depois.
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              PASSO 4: CATÁLOGO DE SERVIÇOS & TABELA DE PREÇOS
             ======================================================== */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                    <Wrench className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Passo 4: Catálogo de Serviços</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                    Ajuste seus serviços, categorias e preços
                  </h2>
                  <p className="text-xs text-[#737D75]">
                    Você pode remover itens que não faz, alterar preços ou cadastrar novos serviços e categorias.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddServiceCat(!showAddServiceCat)}
                    className="px-3 py-1.5 rounded-xl border border-[#247653]/30 bg-[#ECFDF5] text-[#247653] hover:bg-[#D1FAE5] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>+ Categoria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(!showAddServiceModal)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#247653] text-white hover:bg-[#1E6346] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Serviço</span>
                  </button>
                </div>
              </div>

              {/* Card Nova Categoria de Serviço */}
              {showAddServiceCat && (
                <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                  <span className="text-xs font-bold text-[#065F46] block">
                    Nome da Nova Categoria de Serviço:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                      placeholder="Ex: PPF_PELICULAS, MARTELINHO, PINTURA_RODAS..."
                      className="flex-1 h-9 px-3 text-xs bg-white border border-[#A7F3D0] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleCreateServiceCategory}
                      className="px-4 h-9 rounded-lg bg-[#247653] text-white text-xs font-bold hover:bg-[#1E6346] transition cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddServiceCat(false)}
                      className="px-3 h-9 rounded-lg border border-[#A7F3D0] text-[#065F46] text-xs font-bold hover:bg-white transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Card Formulário Novo Serviço */}
              {showAddServiceModal && (
                <div className="p-4 rounded-2xl bg-[#F7F8F6] border border-[#247653] space-y-3">
                  <span className="text-xs font-bold text-[#142D26] block">
                    Cadastrar Novo Serviço
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#737D75] mb-1">
                        Nome do Serviço
                      </label>
                      <input
                        type="text"
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="Ex: Espelhamento 3M"
                        className="w-full h-8 px-3 text-xs bg-white border border-[#E7EAE7] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#737D75] mb-1">
                        Categoria
                      </label>
                      <select
                        value={newServiceCat}
                        onChange={(e) => setNewServiceCat(e.target.value)}
                        className="w-full h-8 px-2 text-xs bg-white border border-[#E7EAE7] rounded-lg font-semibold"
                      >
                        {serviceCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#737D75] mb-0.5">Preço Hatch (R$)</label>
                        <input
                          type="number"
                          value={newServiceHatch}
                          onChange={(e) => setNewServiceHatch(parseFloat(e.target.value) || 0)}
                          className="w-full h-8 px-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#737D75] mb-0.5">Preço Sedan (R$)</label>
                        <input
                          type="number"
                          value={newServiceSedan}
                          onChange={(e) => setNewServiceSedan(parseFloat(e.target.value) || 0)}
                          className="w-full h-8 px-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#737D75] mb-0.5">Preço SUV (R$)</label>
                        <input
                          type="number"
                          value={newServiceSuv}
                          onChange={(e) => setNewServiceSuv(parseFloat(e.target.value) || 0)}
                          className="w-full h-8 px-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="px-3 h-8 rounded-lg border border-[#E7EAE7] text-xs font-bold hover:bg-white transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewService}
                      className="px-4 h-8 rounded-lg bg-[#247653] text-white text-xs font-bold hover:bg-[#1E6346] transition cursor-pointer"
                    >
                      Adicionar Serviço
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Serviços */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E7EAE7] text-[#737D75]">
                          {srv.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(sIdx)}
                          className="p-1 rounded-md text-[#DC4C4C] hover:bg-[#FEF2F2] transition cursor-pointer"
                          title="Remover este serviço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9F3EC] text-[#142D26] text-xs font-bold">
                    <Package className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Passo 5: Estoque Inicial Recomendado</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#142D26]">
                    Controle de insumos e produtos da oficina
                  </h2>
                  <p className="text-xs text-[#737D75]">
                    Remova itens pré-definidos se não utilizar, ou adicione os produtos da sua marca favorita.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddProductModal(!showAddProductModal)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#247653] text-white hover:bg-[#1E6346] text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-center transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Adicionar Produto</span>
                </button>
              </div>

              {/* Modal / Card para Adicionar Novo Produto */}
              {showAddProductModal && (
                <div className="p-4 rounded-2xl bg-[#F7F8F6] border border-[#247653] space-y-3">
                  <span className="text-xs font-bold text-[#142D26] block">
                    Cadastrar Insumo / Produto
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#737D75] mb-1">
                        Nome do Produto
                      </label>
                      <input
                        type="text"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="Ex: Cera Carnaúba Express Vonixx"
                        className="w-full h-8 px-3 text-xs bg-white border border-[#E7EAE7] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#737D75] mb-1">
                        Unidade
                      </label>
                      <select
                        value={newProdUnit}
                        onChange={(e) => setNewProdUnit(e.target.value)}
                        className="w-full h-8 px-2 text-xs bg-white border border-[#E7EAE7] rounded-lg font-bold"
                      >
                        <option value="UN">UN (Unidade)</option>
                        <option value="L">L (Litro)</option>
                        <option value="ML">ML (Mililitro)</option>
                        <option value="KG">KG (Quilo)</option>
                        <option value="G">G (Grama)</option>
                        <option value="CX">CX (Caixa)</option>
                        <option value="PCT">PCT (Pacote)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#737D75] mb-1">
                        Categoria
                      </label>
                      <select
                        value={newProdCat}
                        onChange={(e) => setNewProdCat(e.target.value)}
                        className="w-full h-8 px-2 text-xs bg-white border border-[#E7EAE7] rounded-lg font-bold"
                      >
                        <option value="CHEMICAL">Químico / Solução</option>
                        <option value="ACCESSORY">Acessório / Pano</option>
                        <option value="TOOL">Equipamento / Boina</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#737D75] mb-1">
                        Custo Estimado (R$)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newProdCost}
                        onChange={(e) => setNewProdCost(parseFloat(e.target.value) || 0)}
                        className="w-full h-8 px-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#737D75] mb-1">
                        Quantidade Inicial
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(parseFloat(e.target.value) || 0)}
                        className="w-full h-8 px-2 text-xs font-bold bg-white border border-[#E7EAE7] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(false)}
                      className="px-3 h-8 rounded-lg border border-[#E7EAE7] text-xs font-bold hover:bg-white transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewProduct}
                      className="px-4 h-8 rounded-lg bg-[#247653] text-white text-xs font-bold hover:bg-[#1E6346] transition cursor-pointer"
                    >
                      Salvar Produto
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Produtos com Remoção */}
              <div className="space-y-2.5">
                {products.length > 0 ? (
                  products.map((prod, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E7EAE7] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#252B27]">{prod.name}</p>
                        <p className="text-[11px] text-[#737D75]">
                          Unidade: {prod.unit} • Custo: R$ {prod.costPrice} • Categoria: {prod.category}
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
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(pIdx)}
                          className="p-1.5 rounded-lg text-[#DC4C4C] hover:bg-[#FEF2F2] transition cursor-pointer"
                          title="Remover produto do estoque"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#737D75] bg-[#F7F8F6] rounded-2xl border border-dashed border-[#E7EAE7]">
                    Nenhum insumo adicionado. Você pode concluir ou cadastrar produtos quando quiser.
                  </div>
                )}
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

          {/* Botões de Ação do Wizard com Pular Etapa */}
          <div className="pt-4 border-t border-[#E7EAE7] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-[#E7EAE7] bg-[#F7F8F6] hover:bg-[#E9F3EC] text-xs font-bold text-[#343C36] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
              )}

              {/* Botão Pular Esta Etapa */}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(step + 1);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] transition flex items-center gap-1 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Pular esta etapa</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  disabled={saving}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#737D75] hover:text-[#252B27] hover:bg-[#F1F3F1] transition flex items-center gap-1 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Pular estoque e finalizar</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                  onClick={() => handleFinish(false)}
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
      </div>

      {/* Rodapé */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-[#737D75] pt-6">
        DetailPro SaaS • Gestão Profissional para Estética Automotiva & Detailing
      </div>
    </div>
  );
}
