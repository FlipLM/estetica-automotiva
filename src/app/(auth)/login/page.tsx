"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, ArrowRight } from "lucide-react";
import { Button, Input, Alert, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GOOGLE_ERRORS: Record<string, string> = {
    google_not_configured: "Login com Google ainda não está configurado.",
    google_denied: "Login com Google cancelado.",
    google_email_unverified: "O e-mail da conta Google não está verificado.",
    google_inactive: "Conta inativa. Entre em contato com o suporte.",
    google_rate_limited: "Muitas tentativas. Aguarde alguns minutos.",
  };

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code && code.startsWith("google_")) {
      setError(GOOGLE_ERRORS[code] || "Não foi possível entrar com o Google. Tente novamente.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGoogle() {
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = "/api/auth/google" + (next ? `?next=${encodeURIComponent(next)}` : "");
  }

  async function performLogin(targetEmail: string, targetPass: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass, website }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar login.");
      }

      // Redirecionamento nativo instantâneo para carregar a sessão com cookie confirmado
      let dest = data.redirect || (data.user.role === "OPERATOR" ? "/patio" : "/dashboard");
      // Respeita ?next= somente para caminhos internos e quando não há onboarding pendente
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/") && !next.startsWith("//") && dest !== "/onboarding") {
        dest = next;
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8F6]">
      <div className="w-full max-w-[420px]">
        {/* Cabeçalho da Marca */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0F1E1A] mb-3.5 shadow-md overflow-hidden p-1.5 border border-[#247653]/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vulpto_logo.png" alt="Vulpto Logo" className="w-full h-full object-contain drop-shadow" />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#142D26]">
            Vulpto
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
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
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

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-[#E3E7E2]" />
            <span className="text-[12px] text-[#737D75]">ou</span>
            <div className="h-px flex-1 bg-[#E3E7E2]" />
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={handleGoogle}>
            Entrar com Google
          </Button>
        </Card>

        <p className="text-center text-[13px] text-[#737D75] mt-6">
          Ainda não tem uma conta cadastrada?{" "}
          <Link
            href="/register"
            className="text-[#247653] hover:text-[#142D26] font-semibold underline underline-offset-4"
          >
            Cadastrar minha empresa
          </Link>
        </p>
      </div>
    </div>
  );
}
