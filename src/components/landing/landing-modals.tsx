"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CarFront,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Mail,
  Phone,
  PlaySquare,
  User,
  X,
} from "lucide-react";
import { MiniVulpto } from "./mini-vulpto";

interface LandingMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  dashboardHref: string;
  isAuthenticated: boolean;
}

/**
 * Menu lateral responsivo para celulares com botões amplos (>= 48px),
 * trava de rolagem e fechamento por teclado (ESC).
 */
export function LandingMobileDrawer({
  isOpen,
  onClose,
  onOpenRegister,
  dashboardHref,
  isAuthenticated,
}: LandingMobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems = [
    { href: "#patio-video", label: "Pátio ao Vivo", icon: PlaySquare },
    { href: "#visao-geral", label: "Como Funciona", icon: ClipboardCheck },
    { href: "#modulos", label: "Telas do Sistema", icon: Layers },
    { href: "#diferenciais", label: "Para Quem É Dono", icon: CarFront },
    { href: "#planos", label: "Teste Grátis", icon: CheckCircle2 },
    { href: "#duvidas", label: "Dúvidas Comuns", icon: HelpCircle },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] lg:hidden flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Menu principal"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-[#0B0F17] h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-white/15">
        {/* Cabeçalho do menu */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#111622] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#07090E] border border-white/15 flex items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vulpto_logo.png"
                alt="Marca Vulpto"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-white">
              VULPTO
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/15 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links principais */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              onClick={onClose}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center gap-3 text-left text-[#CBD5E1] hover:bg-white/[0.06] hover:text-white transition-colors font-semibold text-sm"
            >
              <span className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 text-[#E2E8F0] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span>{label}</span>
            </a>
          ))}

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="p-4 rounded-3xl bg-[#111622] border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                <MiniVulpto className="w-4 h-4" />
                <span>3 Dias de Teste Grátis</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Comece hoje com vistoria em 3D, quadro de vagas, caixa do dia e lembretes no WhatsApp sem precisar cadastrar cartão.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="p-4 border-t border-white/10 bg-[#111622] space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="w-full min-h-[48px] px-5 rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-105"
          >
            <span>Testar 3 Dias Grátis</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href={isAuthenticated ? dashboardHref : "/login"}
            onClick={onClose}
            className="w-full min-h-[48px] px-5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm font-bold flex items-center justify-center border border-white/15 transition-colors"
          >
            {isAuthenticated ? "Abrir Meu Painel" : "Entrar na Minha Conta"}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface LandingRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Janela de criação rápida de conta conectada ao cadastro oficial da plataforma.
 */
export function LandingRegisterModal({
  isOpen,
  onClose,
}: LandingRegisterModalProps) {
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

  if (!isOpen) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password.length < 8) {
      setError("A senha de acesso deve ter no mínimo 8 dígitos.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível concluir o cadastro.");
      }

      window.location.href = data.redirect || "/onboarding";
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Falha na conexão com o servidor.";
      setError(msg);
      setLoading(false);
    }
  }

  const inputClass =
    "w-full min-h-[44px] rounded-xl bg-[#161D2B] border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8]";
  const labelClass =
    "text-xs font-semibold text-[#CBD5E1] mb-1.5 flex items-center gap-1.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Criar conta gratuita da estética automotiva"
    >
      <div className="bg-[#0E131E] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/15 shadow-[0_32px_100px_rgba(0,0,0,0.8)] p-6 sm:p-7 text-left text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="font-heading text-xl font-extrabold text-white">
              Cadastre Sua Estética Automotiva
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Liberação imediata por 3 dias sem pedir cartão de crédito
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#CBD5E1] hover:text-white flex items-center justify-center cursor-pointer shrink-0 border border-white/10"
            aria-label="Fechar cadastro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-red-500/15 border border-red-400/30 text-red-200 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <Building2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Nome da Empresa *</span>
              </label>
              <input
                type="text"
                name="companyName"
                required
                minLength={3}
                placeholder="Ex: Brilho Real Estética"
                value={formData.companyName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nome da Loja / Fachada</label>
              <input
                type="text"
                name="tradingName"
                placeholder="Ex: Studio Brilho Carro"
                value={formData.tradingName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>CNPJ ou CPF (Opcional)</label>
              <input
                type="text"
                name="document"
                placeholder="00.000.000/0001-00"
                value={formData.document}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Phone className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>WhatsApp da Loja</span>
              </label>
              <input
                type="text"
                name="phone"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 space-y-3">
            <div>
              <label className={labelClass}>
                <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Seu Nome Completo *</span>
              </label>
              <input
                type="text"
                name="adminName"
                required
                minLength={3}
                placeholder="Ex: Carlos Eduardo"
                value={formData.adminName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  <Mail className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>E-mail de Acesso *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="contato@sualoja.com.br"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Lock className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Crie uma Senha *</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 hover:brightness-105 mt-2 shadow-[0_8px_24px_rgba(255,255,255,0.14)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparando seu espaço...</span>
              </>
            ) : (
              <>
                <span>Começar Meus 3 Dias Grátis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#94A3B8] pt-1">
            Já possui cadastro?{" "}
            <Link
              href="/login"
              className="text-white font-semibold underline hover:text-[#CBD5E1]"
            >
              Entrar na conta existente
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

interface LandingLegalModalProps {
  mode: "TERMS" | "PRIVACY" | null;
  onClose: () => void;
}

export function LandingLegalModal({ mode, onClose }: LandingLegalModalProps) {
  if (!mode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0E131E] rounded-3xl max-w-xl w-full border border-white/15 shadow-2xl overflow-hidden text-left text-white">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111622]">
          <div className="flex items-center gap-2 font-heading font-bold text-base text-white">
            <FileText className="w-4 h-4 text-[#38BDF8]" />
            <span>
              {mode === "TERMS"
                ? "Termos de Uso — Vulpto"
                : "Privacidade e Dados da Sua Loja"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/15 text-[#CBD5E1] flex items-center justify-center cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 text-xs sm:text-sm text-[#CBD5E1] leading-relaxed space-y-3">
          {mode === "TERMS" ? (
            <>
              <p>
                O Vulpto oferece acesso pela internet para organizar a rotina da sua estética automotiva: entrada de veículos, controle do pátio, caixa, estoque de produtos e retorno de clientes.
              </p>
              <p>
                Novos cadastros contam com 3 dias de teste gratuito sem necessidade de cadastrar cartão antecipadamente.
              </p>
            </>
          ) : (
            <>
              <p>
                Todas as informações de clientes, placas, fotos de vistoria e movimentações financeiras pertencem exclusivamente à sua loja e ficam separadas das demais empresas cadastradas.
              </p>
              <p>
                Cada dono escolhe quem da equipe pode acessar a conta e o que cada pessoa enxerga no dia a dia.
              </p>
            </>
          )}
        </div>
        <div className="p-4 border-t border-white/10 bg-[#111622] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 rounded-full bg-gradient-to-b from-[#F8FAFC] to-[#CBD5E1] text-[#07090E] text-xs font-bold cursor-pointer transition-all hover:brightness-105"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
