"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button, Input, Alert, Card } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [demoLink, setDemoLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDemoLink(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível enviar a recuperação.");
      }

      setSuccess(true);
      if (data.demoResetUrl) {
        setDemoLink(data.demoResetUrl);
      }
    } catch (err: any) {
      setError(err.message || "Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8F6]">
      <div className="w-full max-w-[420px]">
        {/* Cabeçalho */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0B0F0D] mb-3 shadow-lg overflow-hidden border border-[#247653]/30 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vulpto_logo.png" alt="Vulpto Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#142D26]">Vulpto</h1>
        </div>

        <Card padding="lg" className="shadow-card">
          <h2 className="text-[18px] font-semibold text-[#252B27]">Recuperar Senha</h2>
          <p className="text-[13px] text-[#737D75] mt-0.5 mb-5">
            Informe o e-mail da sua conta para enviarmos o link de redefinição.
          </p>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#EDF7F1] border border-[#247653]/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#247653] flex-shrink-0 mt-0.5" />
                <div className="text-[13px] text-[#142D26]">
                  <p className="font-semibold mb-1">Instruções enviadas!</p>
                  <p className="text-[#3F4842] leading-relaxed">
                    Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link válido por 1 hora para criar uma nova senha.
                  </p>
                </div>
              </div>

              {demoLink && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-900">
                  <div className="font-semibold mb-1 flex items-center gap-1.5 text-amber-800">
                    <span>⚡ Link de Demonstração (Sem SMTP ativo):</span>
                  </div>
                  <a
                    href={demoLink}
                    className="text-[#247653] font-medium underline break-all hover:text-[#142D26]"
                  >
                    Clique aqui para redefinir a senha agora
                  </a>
                </div>
              )}

              <Link href="/login" className="block w-full">
                <Button variant="secondary" fullWidth leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Seu E-mail Cadastrado"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                leftIcon={<Mail className="w-4 h-4 text-[#737D75]" />}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                Enviar Link de Redefinição
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#737D75] hover:text-[#252B27]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

