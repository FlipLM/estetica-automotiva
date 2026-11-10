"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Car, KeyRound, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar login.");
      }

      if (data.user.role === "OPERATOR") {
        router.push("/patio");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  function setQuickCredentials(userEmail: string) {
    setEmail(userEmail);
    setPassword("senha123");
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Detailing OS</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão & Operação para Estética Automotiva e Lava-Jatos
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-2">Acesse sua conta</h2>
          <p className="text-xs text-slate-400 mb-6">
            Insira suas credenciais para gerenciar seu pátio e finanças.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                E-mail Corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Senha
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalhos de Demonstração / Teste Local */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
              Ambiente Local — Acesso Rápido de Teste
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuickCredentials("admin@detailing.com")}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-blue-400 font-medium text-xs mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dono / Admin</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">admin@detailing.com</p>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials("operador@detailing.com")}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs mb-0.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Operador Pátio</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">operador@detailing.com</p>
              </button>
            </div>
          </div>
        </div>

        {/* Link para Cadastro de Nova Empresa */}
        <p className="text-center text-xs text-slate-400 mt-6">
          É proprietário de uma estética automotiva?{" "}
          <Link
            href="/register"
            className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4"
          >
            Cadastrar minha empresa
          </Link>
        </p>
      </div>
    </div>
  );
}

