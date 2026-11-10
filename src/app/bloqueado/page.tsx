"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Building2,
  Phone,
  Zap,
} from "lucide-react";

export default function BlockedPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setSession(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5511988887777";
  const cleanPhone = supportWhatsapp.replace(/\D/g, "");

  const companyName = session?.tenant?.name || "Minha Estética Automotiva";
  const userName = session?.name || "Gestor";

  const customSystemWhatsappText = encodeURIComponent(
    `Olá! Meu período de testes de 3 dias no DetailPro expirou para a empresa *${companyName}*. Gostaria de liberar o acesso definitivo ou solicitar um sistema próprio/personalizado com novas funcionalidades para a minha empresa! Podem me ajudar?`
  );

  return (
    <div className="min-h-screen bg-[#F7F8F6] flex flex-col justify-between p-4 sm:p-8 antialiased text-[#252B27]">
      {/* Topo / Logo */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#142D26] flex items-center justify-center text-white shadow-xs font-bold text-sm">
            DP
          </div>
          <div>
            <h1 className="font-bold text-base text-[#142D26] tracking-tight">DetailPro SaaS</h1>
            <p className="text-[11px] text-[#737D75]">Gestão & Tecnologia para Estética Automotiva</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-3 py-1.5 rounded-lg border border-[#E7EAE7] bg-white hover:bg-[#F1F3F1] text-xs font-semibold text-[#737D75] hover:text-[#252B27] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{loggingOut ? "Saindo..." : "Trocar Conta"}</span>
        </button>
      </div>

      {/* Conteúdo Central / Paywall */}
      <div className="max-w-3xl mx-auto w-full my-6 bg-white border border-[#E7EAE7] rounded-3xl p-6 sm:p-10 shadow-lg space-y-8">
        {session && (!session.isTrialExpired || session.plan === "ACTIVE") ? (
          <div className="text-center space-y-4 py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#16A36A] mb-1 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acesso Ativo e Liberado</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142D26] tracking-tight">
              Olá, {userName}! Sua conta está liberada.
            </h2>
            <p className="text-sm text-[#737D75] max-w-xl mx-auto">
              A empresa <strong className="text-[#252B27]">{companyName}</strong> está com plano ativo ({session.plan === "ACTIVE" ? "Vitalício / Administrador" : "Período de Demonstração em andamento"}). Você pode acessar o painel operacional normalmente.
            </p>

            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  window.location.href = session.role === "OPERATOR" ? "/patio" : "/dashboard";
                }}
                className="px-6 py-3 rounded-xl bg-[#247653] hover:bg-[#1E6346] text-white text-sm font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Acessar Painel da Oficina</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Badge & Título */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] mb-1 shadow-xs">
                <Lock className="w-7 h-7" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-bold tracking-wide uppercase">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Período de Testes Expirado (3 Dias)</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142D26] tracking-tight">
                Seu tempo de demonstração encerrou, {userName}!
              </h2>
              <p className="text-sm text-[#737D75] max-w-xl mx-auto">
                A empresa <strong className="text-[#252B27]">{companyName}</strong> atingiu o limite do período de testes gratuito.
                Para continuar utilizando e não perder seus dados, desbloqueie seu plano ou encomende um sistema próprio e exclusivo.
              </p>
            </div>

        {/* 2 Opções de Conversão: Plano Mensal ou Sistema Sob Medida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opção 1: Liberação do DetailPro */}
          <div className="p-5 rounded-2xl border-2 border-[#16A36A] bg-[#ECFDF5]/50 flex flex-col justify-between relative overflow-hidden space-y-4">
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#16A36A] text-white text-[10px] font-bold uppercase tracking-wider">
              Liberação Imediata
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#16A36A] text-white flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#065F46]">Assinatura DetailPro PRO</h3>
                  <p className="text-xs text-[#737D75]">Manter todos os dados e continuar operando</p>
                </div>
              </div>

              <ul className="text-xs space-y-2 text-[#343C36] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                  <span>Acesso ilimitado a todas as ordens de serviço</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                  <span>Vistoria 360º com fotos e mapa de avarias</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                  <span>Geração e emissão de orçamentos e PDFs oficiais</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
                  <span>Estoque integrado ao financeiro e DRE</span>
                </li>
              </ul>
            </div>

            <a
              href={`https://wa.me/${cleanPhone}?text=${customSystemWhatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#16A36A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Liberar Acesso pelo WhatsApp</span>
            </a>
          </div>

          {/* Opção 2: Sistema Próprio / Customizado para o Cliente */}
          <div className="p-5 rounded-2xl border border-[#E7EAE7] bg-[#F7F8F6] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#142D26] text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#142D26]">Sistema Próprio & Exclusivo</h3>
                  <p className="text-xs text-[#737D75]">Sob medida com a marca da sua empresa</p>
                </div>
              </div>

              <ul className="text-xs space-y-2 text-[#343C36] pt-2">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#247653] shrink-0" />
                  <span>Domínio próprio (ex: app.suaestetica.com.br)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#247653] shrink-0" />
                  <span>Sua logomarca, cores e identidade visual</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#247653] shrink-0" />
                  <span>Funcionalidades adicionais sob encomenda</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#247653] shrink-0" />
                  <span>Banco de dados e servidor dedicados</span>
                </li>
              </ul>
            </div>

            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `Olá! Gostei muito da base do DetailPro e tenho interesse em encomendar um SISTEMA PRÓPRIO E PERSONALIZADO para a minha empresa (${companyName}). Gostaria de entender valores e como funciona o desenvolvimento sob medida!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#F1F3F1] border border-[#247653] text-[#247653] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Solicitar Orçamento Personalizado</span>
            </a>
          </div>
        </div>

        {/* Informações de Suporte */}
        <div className="pt-4 border-t border-[#E7EAE7] text-center space-y-2">
          <p className="text-xs text-[#737D75]">
            Dúvidas ou precisa de suporte comercial imediato?
          </p>
          <a
            href={`https://wa.me/${cleanPhone}?text=${customSystemWhatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A36A] hover:underline"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Falar com o Consultor no WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </>
      )}
    </div>

      {/* Rodapé */}
      <div className="text-center text-xs text-[#737D75] py-2">
        DetailPro SaaS • Gestão Profissional de Estética Automotiva & Detailing
      </div>
    </div>
  );
}

