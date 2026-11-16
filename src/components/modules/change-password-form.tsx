"use client";

import { useState } from "react";
import { ArrowRight, Lock, LogOut, ShieldAlert } from "lucide-react";
import { Alert, Button, Card, Input } from "@/components/ui";

interface ChangePasswordFormProps {
  mustChangePassword: boolean;
  userName: string;
  userEmail: string;
}

export function ChangePasswordForm({
  mustChangePassword,
  userName,
  userEmail,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação da nova senha não coincide.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível alterar a senha.");
        setLoading(false);
        return;
      }

      window.location.href = data.redirect || "/dashboard";
    } catch {
      setError("Falha de conexão com o servidor.");
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8F6]">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0B0F0D] mb-3 shadow-lg overflow-hidden border border-[#247653]/30 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/vulpto_logo.png"
              alt="Vulpto Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#142D26]">
            Vulpto
          </h1>
        </div>

        <Card padding="lg" className="shadow-card space-y-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[#252B27]">
              {mustChangePassword
                ? "Crie sua senha pessoal"
                : "Alterar senha da conta"}
            </h2>
            <p className="text-[13px] text-[#737D75] mt-0.5">
              Conta: <strong className="text-[#252B27]">{userName}</strong> (
              {userEmail})
            </p>
          </div>

          {mustChangePassword && (
            <Alert variant="warning" title="Primeiro acesso com senha provisória">
              <span className="inline-flex items-start gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Por segurança, defina uma nova senha pessoal (mínimo 8
                  caracteres) antes de continuar usando o sistema.
                </span>
              </span>
            </Alert>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={
                mustChangePassword ? "Senha Provisória / Atual" : "Senha Atual"
              }
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              leftIcon={<Lock className="w-4 h-4 text-[#737D75]" />}
            />

            <Input
              label="Nova Senha"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              leftIcon={<Lock className="w-4 h-4 text-[#737D75]" />}
            />

            <Input
              label="Confirmar Nova Senha"
              type="password"
              required
              minLength={8}
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
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Salvar Nova Senha e Continuar
            </Button>
          </form>

          <div className="pt-2 border-t border-[#E7EAE7] flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sair e entrar com outra conta
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
