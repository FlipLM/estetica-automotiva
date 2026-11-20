"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  DollarSign,
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Mail,
  Phone,
  TrendingUp,
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
 * Drawer Mobile Editorial inspirado no MobileDrawer da Cia do Lacre:
 * alvos de toque >= 48px, bloqueio de scroll no body e fechamento por ESC ou clique externo.
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
    { href: "#showcase", label: "Módulos do Sistema", icon: Layers },
    { href: "#diferenciais", label: "Diferenciais", icon: ClipboardCheck },
    { href: "#metrics-panel", label: "Impacto no Pátio", icon: Gauge },
    { href: "#roi", label: "Simulador de Retorno", icon: TrendingUp },
    { href: "#planos", label: "Planos & Trial 72h", icon: DollarSign },
    { href: "#faq", label: "Dúvidas Frequentes", icon: HelpCircle },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] lg:hidden flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
    >
      <div
        className="fixed inset-0 bg-[#142D26]/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-[#F7F8F6] h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l border-[#E7EAE7]">
        {/* Topo do Drawer */}
        <div className="px-5 py-4 border-b border-[#E7EAE7] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B0F0D] border border-[#247653]/40 flex items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/vulpto_logo.png"
                alt="Vulpto Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-[#142D26]">
              VULPTO
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="w-12 h-12 rounded-full bg-[#F7F8F6] border border-[#E7EAE7] text-[#252B27] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links em Alvo Tátil >= 48px */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              onClick={onClose}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center gap-3 text-left text-[#252B27] hover:bg-white hover:text-[#247653] transition-colors font-semibold text-sm"
            >
              <span className="w-8 h-8 rounded-xl bg-[#E9F3EC] text-[#247653] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span>{label}</span>
            </a>
          ))}

          <div className="mt-4 pt-4 border-t border-[#E7EAE7]">
            <div className="p-4 rounded-3xl bg-white border border-[#E7EAE7]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#247653] mb-1">
                <MiniVulpto className="w-4 h-4 text-[#247653]" />
                <span>Avaliação Imediata de 72 Horas</span>
              </div>
              <p className="text-xs text-[#737D75] leading-relaxed">
                Crie o ambiente da sua estética com vistoria 360º, Kanban e DRE sem cadastrar cartão.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé do Drawer */}
        <div className="p-4 border-t border-[#E7EAE7] bg-white space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="w-full min-h-[48px] px-5 rounded-full bg-[#247653] hover:bg-[#142D26] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Testar 3 Dias Grátis</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href={isAuthenticated ? dashboardHref : "/login"}
            onClick={onClose}
            className="w-full min-h-[48px] px-5 rounded-full bg-[#E9F3EC] text-[#142D26] text-sm font-bold flex items-center justify-center border border-[#247653]/20"
          >
            {isAuthenticated ? "Acessar Meu Painel" : "Entrar na Conta"}
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
 * Modal de Cadastro Rápido integrado diretamente a POST /api/auth/register.
 */
export function LandingRegisterModal({ isOpen, onClose }: LandingRegisterModalProps) {
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
      setError("A senha de acesso deve ter no mínimo 8 caracteres.");
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
        throw new Error(data.error || "Erro ao registrar empresa.");
      }

      window.location.href = data.redirect || "/onboarding";
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Falha na conexão com o servidor.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Cadastro de Estética Automotiva"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E7EAE7] shadow-modal p-6 sm:p-7 text-left">
        <div className="flex items-center justify-between pb-4 border-b border-[#E7EAE7]">
          <div>
            <h3 className="font-heading text-xl font-extrabold text-[#142D26]">
              Cadastre Sua Estética Automotiva
            </h3>
            <p className="text-xs text-[#737D75] mt-0.5">
              Liberação instantânea do ambiente de avaliação por 3 dias
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F7F8F6] hover:bg-[#E7EAE7] text-[#343C36] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Fechar cadastro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC4C4C] text-xs font-medium flex items-center gap-2">
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
              <label className="dp-label flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#247653]" />
                <span>Nome da Empresa *</span>
              </label>
              <input
                type="text"
                name="companyName"
                required
                minLength={3}
                placeholder="Ex: Prime Detailing Ltda"
                value={formData.companyName}
                onChange={handleChange}
                className="dp-input w-full"
              />
            </div>
            <div>
              <label className="dp-label">Nome Fantasia</label>
              <input
                type="text"
                name="tradingName"
                placeholder="Ex: Prime Car Care"
                value={formData.tradingName}
                onChange={handleChange}
                className="dp-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="dp-label">CNPJ ou CPF (Opcional)</label>
              <input
                type="text"
                name="document"
                placeholder="00.000.000/0001-00"
                value={formData.document}
                onChange={handleChange}
                className="dp-input w-full"
              />
            </div>
            <div>
              <label className="dp-label flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#247653]" />
                <span>WhatsApp / Telefone</span>
              </label>
              <input
                type="text"
                name="phone"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={handleChange}
                className="dp-input w-full"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E7EAE7] space-y-3">
            <div>
              <label className="dp-label flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#247653]" />
                <span>Nome do Administrador *</span>
              </label>
              <input
                type="text"
                name="adminName"
                required
                minLength={3}
                placeholder="Seu nome completo"
                value={formData.adminName}
                onChange={handleChange}
                className="dp-input w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="dp-label flex items-center gap-1.5">
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
                  className="dp-input w-full"
                />
              </div>
              <div>
                <label className="dp-label flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#247653]" />
                  <span>Senha (mín. 8 dígitos) *</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="dp-input w-full"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-full bg-[#247653] hover:bg-[#142D26] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Criando ambiente...</span>
              </>
            ) : (
              <>
                <span>Criar Conta e Iniciar Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#737D75] pt-1">
            Já tem cadastro?{" "}
            <Link href="/login" className="text-[#247653] font-semibold underline">
              Fazer login no sistema
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E7EAE7] shadow-modal overflow-hidden text-left">
        <div className="p-5 border-b border-[#E7EAE7] flex items-center justify-between bg-[#F7F8F6]">
          <div className="flex items-center gap-2 font-heading font-bold text-base text-[#142D26]">
            <FileText className="w-4 h-4 text-[#247653]" />
            <span>
              {mode === "TERMS"
                ? "Termos de Uso — Vulpto"
                : "Privacidade & Proteção de Dados (LGPD)"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white border border-[#E7EAE7] flex items-center justify-center cursor-pointer"
            aria-label="Fechar modal legal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 text-xs sm:text-sm text-[#343C36] leading-relaxed space-y-3">
          {mode === "TERMS" ? (
            <>
              <p>
                O Vulpto fornece plataforma web multi-tenant para gestão operacional, vistorias veiculares, ordens de serviço, estoque químico e financeiro de estéticas automotivas.
              </p>
              <p>
                O período inicial de avaliação tem duração de 3 dias (72 horas) sem exigência prévia de cartão de crédito.
              </p>
            </>
          ) : (
            <>
              <p>
                Cada empresa cadastrada opera em ambiente multi-tenant isolado por identificador próprio no banco relacional, com sessões em Cookies HttpOnly e controle de acesso baseado em papéis (RBAC).
              </p>
              <p>
                Credenciais opcionais de armazenamento em nuvem corporativa são protegidas com criptografia AES-256-GCM.
              </p>
            </>
          )}
        </div>
        <div className="p-4 border-t border-[#E7EAE7] bg-[#F7F8F6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 rounded-full bg-[#247653] hover:bg-[#142D26] text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
