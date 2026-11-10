"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Car, KeyRound, ArrowRight } from "lucide-react";
import { Button, Input, Alert, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performLogin(targetEmail: string, targetPass: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar login.");
      }

      // Redirecionamento nativo instantâneo para carregar a sessão com cookie confirmado
      const dest = data.user.role === "OPERATOR" ? "/patio" : "/dashboard";
      window.location.href = dest;
    } catch (err: any) {
      setError(err.message || "Falha na conexão com o servidor.");
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  function handleQuickLogin(userEmail: string) {
    setEmail(userEmail);
    setPassword("senha123");
    performLogin(userEmail, "senha123");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8F6]">
      <div className="w-full max-w-[420px]">
        {/* Cabeçalho da Marca */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#142D26] mb-3.5 shadow-sm">
            <Car className="w-6 h-6 text-[#E9F3EC]" />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#142D26]">
            DetailPro SaaS
          </h1>
          <p className="text-[14px] text-[#737D75] mt-1">
            Gestão profissional para estéticas automotivas e estúdios de detailing
          </p>
        </div>

        {/* Card Principal */}
        <Card padding="lg" className="shadow-card">
          <h2 className="text-[18px] font-semibold text-[#252B27]">
            Acesse sua conta
          </h2>
          <p className="text-[13px] text-[#737D75] mt-0.5 mb-5">
            Informe seu e-mail e senha para entrar no painel da oficina.
          </p>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Seu E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com"
            />

            <Input
              label="Sua Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Entrar no Sistema
            </Button>
          </form>

          {/* Atalhos de Demonstração / Teste Local */}
          <div className="mt-6 pt-5 border-t border-[#E7EAE7]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737D75] mb-2.5 text-center">
              Acesso Rápido de Demonstração
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("admin@detailing.com")}
                className="p-2.5 rounded-[8px] bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] hover:border-[#247653]/40 text-left transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1.5 text-[#142D26] font-semibold text-[12px] mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Entrar como Admin</span>
                </div>
                <p className="text-[11px] text-[#737D75] truncate">
                  admin@detailing.com
                </p>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("operador@detailing.com")}
                className="p-2.5 rounded-[8px] bg-[#F7F8F6] hover:bg-[#E9F3EC] border border-[#E7EAE7] hover:border-[#247653]/40 text-left transition-all cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1.5 text-[#142D26] font-semibold text-[12px] mb-0.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Entrar como Operador</span>
                </div>
                <p className="text-[11px] text-[#737D75] truncate">
                  operador@detailing.com
                </p>
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-[13px] text-[#737D75] mt-6">
          Ainda não tem uma conta cadastrada?{" "}
          <Link
            href="/register"
            className="text-[#247653] hover:text-[#142D26] font-semibold underline underline-offset-4"
          >
            Cadastrar minha estética
          </Link>
        </p>
      </div>
    </div>
  );
}
