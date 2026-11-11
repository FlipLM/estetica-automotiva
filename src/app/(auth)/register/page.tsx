"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Building2, User, Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    tradingName: "",
    document: "",
    phone: "",
    adminName: "",
    email: "",
    password: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao registrar empresa.");
      }

      window.location.href = "/onboarding";
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Falha na conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8F6] text-[#252B27]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0F1E1A] mb-3 shadow-md overflow-hidden p-1.5 border border-[#247653]/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vulpto_logo.png" alt="Vulpto Logo" className="w-full h-full object-contain drop-shadow" />
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-[#252B27]">
            Cadastre sua Empresa
          </h1>
          <p className="text-xs text-[#737D75] mt-1">
            Crie a conta da sua empresa e comece a operar hoje mesmo
          </p>
        </div>

        <div className="bg-white border border-[#E7EAE7] rounded-xl p-6 sm:p-7 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Razão Social / Nome da Empresa *</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="Ex: Prime Detailing Ltda"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="dp-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1.5">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  name="tradingName"
                  placeholder="Ex: Prime Car Care"
                  value={formData.tradingName}
                  onChange={handleChange}
                  className="dp-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1.5">
                  CNPJ ou CPF (Opcional)
                </label>
                <input
                  type="text"
                  name="document"
                  placeholder="00.000.000/0001-00"
                  value={formData.document}
                  onChange={handleChange}
                  className="dp-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#343C36] mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#247653]" />
                  <span>WhatsApp / Telefone</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="(11) 98765-4321"
                  value={formData.phone}
                  onChange={handleChange}
                  className="dp-input"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E7EAE7]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#737D75] mb-3">
                Dados do Administrador / Proprietário
              </p>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#343C36] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#247653]" />
                    <span>Seu Nome Completo *</span>
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    required
                    placeholder="Nome do Proprietário"
                    value={formData.adminName}
                    onChange={handleChange}
                    className="dp-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#343C36] mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#247653]" />
                      <span>E-mail de Acesso *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="admin@empresa.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="dp-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#343C36] mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#247653]" />
                      <span>Senha *</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      className="dp-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="dp-btn-primary w-full py-2.5 mt-4 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando empresa...</span>
                </>
              ) : (
                <>
                  <span>Criar Minha Empresa</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#737D75] mt-5">
          Já possui conta cadastrada?{" "}
          <Link
            href="/login"
            className="text-[#247653] hover:text-[#142D26] font-semibold underline underline-offset-4"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
