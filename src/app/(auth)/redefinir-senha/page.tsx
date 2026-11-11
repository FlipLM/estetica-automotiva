"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, Input, Alert, Card } from "@/components/ui";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token de recuperação ausente. Use o link recebido por e-mail.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao redefinir a senha.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro na conexão com o servidor.");
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
          <h2 className="text-[18px] font-semibold text-[#252B27]">Nova Senha</h2>
          <p className="text-[13px] text-[#737D75] mt-0.5 mb-5">
            Crie uma nova senha de acesso para sua conta.
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
                  <p className="font-semibold mb-1">Senha atualizada com sucesso!</p>
                  <p className="text-[#3F4842] leading-relaxed">
                    Você já pode acessar sua conta utilizando a sua nova credencial.
                  </p>
                </div>
              </div>

              <Link href="/login" className="block w-full">
                <Button variant="primary" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Acessar Minha Conta
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                label="E-mail da Conta"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                disabled={!!emailParam}
              />

              <Input
                label="Nova Senha"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                leftIcon={<Lock className="w-4 h-4 text-[#737D75]" />}
              />

              <Input
                label="Confirmar Nova Senha"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                leftIcon={<Lock className="w-4 h-4 text-[#737D75]" />}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                Salvar Nova Senha
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F7F8F6]">Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

