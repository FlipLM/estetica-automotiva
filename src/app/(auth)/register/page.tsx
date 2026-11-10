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

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Falha na conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-3 border border-blue-400/30">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Cadastre sua Estética Automotiva</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Crie sua conta multi-tenant e comece a operar hoje mesmo
          </p>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Razão Social / Nome</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="Ex: Prime Detailing Ltda"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  name="tradingName"
                  placeholder="Ex: Prime Car Care"
                  value={formData.tradingName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CNPJ ou CPF (Opcional)
                </label>
                <input
                  type="text"
                  name="document"
                  placeholder="00.000.000/0001-00"
                  value={formData.document}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp / Telefone</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="(11) 98765-4321"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Dados do Administrador / Dono
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Seu Nome Completo</span>
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    required
                    placeholder="Nome do Proprietário"
                    value={formData.adminName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>E-mail</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="admin@empresa.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Senha</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
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

        <p className="text-center text-xs text-slate-400 mt-4">
          Já possui conta cadastrada?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

