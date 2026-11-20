import React from "react";

/**
 * MiniVulpto — Emblema metálico em "V" fiel ao logotipo oficial do Vulpto.
 */
export function MiniVulpto({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="miniVulptoChrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <path d="M3 5L12 20.5L12 14L6.8 5H3Z" fill="url(#miniVulptoChrome)" />
      <path d="M21 5L12 20.5L12 14L17.2 5H21Z" fill="#94A3B8" />
    </svg>
  );
}

/**
 * Animação estilo SVGator para o topo/fundo do estúdio automotivo:
 * feixes de iluminação de cabine e traços contínuos desenhados em tempo real.
 */
export function AnimatedStudioBeams() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full opacity-55"
      viewBox="0 0 1440 720"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vulptoBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
          <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vulptoLightCone" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#07090E" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Luz de cabine superior */}
      <polygon points="420,0 1020,0 1320,660 120,660" fill="url(#vulptoLightCone)" />

      {/* Linhas aerodinâmicas com traçado contínuo animado (SVGator style) */}
      <path
        d="M-60 510 C 260 440, 560 415, 920 445 C 1180 468, 1340 420, 1520 350"
        stroke="url(#vulptoBeamGrad)"
        strokeWidth="2"
        strokeDasharray="240 1200"
        className="vulpto-svg-flow"
      />
      <path
        d="M-80 560 C 290 500, 620 480, 960 512 C 1220 535, 1360 490, 1540 430"
        stroke="url(#vulptoBeamGrad)"
        strokeWidth="1.5"
        strokeDasharray="180 1200"
        className="vulpto-svg-flow-slow"
      />
      <path
        d="M120 120 H 460 L 520 155 H 920 L 980 120 H 1320"
        stroke="#E2E8F0"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Ícones vetoriais animados (estilo SVGator) para reforçar visualmente cada seção sem jargões.
 */
export function AnimatedSectionIcon({
  kind,
  className = "w-10 h-10",
}: {
  kind: "3d" | "patio" | "caixa" | "whatsapp";
  className?: string;
}) {
  if (kind === "3d") {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <ellipse
          cx="24"
          cy="28"
          rx="18"
          ry="8"
          stroke="#94A3B8"
          strokeWidth="1.6"
          strokeDasharray="6 4"
          className="vulpto-svg-orbit"
        />
        <path
          d="M12 24L16 15H32L36 24H12Z"
          stroke="#F8FAFC"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <rect x="9" y="23" width="30" height="8" rx="3" stroke="#E2E8F0" strokeWidth="1.8" fill="#161D2B" />
        <circle cx="15" cy="31" r="3" fill="#07090E" stroke="#E2E8F0" strokeWidth="1.6" />
        <circle cx="33" cy="31" r="3" fill="#07090E" stroke="#E2E8F0" strokeWidth="1.6" />
        <circle cx="28" cy="20" r="2.5" fill="#38BDF8" className="animate-ping" />
        <circle cx="28" cy="20" r="2.2" fill="#38BDF8" />
      </svg>
    );
  }

  if (kind === "patio") {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="6" y="10" width="14" height="28" rx="3" stroke="#64748B" strokeWidth="1.5" />
        <rect x="28" y="10" width="14" height="28" rx="3" stroke="#94A3B8" strokeWidth="1.5" />
        <rect
          x="9"
          y="15"
          width="12"
          height="10"
          rx="2.5"
          fill="#E2E8F0"
          className="vulpto-svg-slide"
        />
        <path
          d="M21 20H27"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "caixa") {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="8" y="28" width="6" height="12" rx="2" fill="#64748B" />
        <rect x="17" y="22" width="6" height="18" rx="2" fill="#94A3B8" />
        <rect x="26" y="16" width="6" height="24" rx="2" fill="#CBD5E1" />
        <rect x="35" y="10" width="6" height="30" rx="2" fill="#F8FAFC" />
        <path
          d="M8 22L18 16L27 18L39 8"
          stroke="#38BDF8"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="60"
          className="vulpto-svg-flow"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 8C15.2 8 8 14.8 8 23.2C8 26.7 9.3 29.9 11.4 32.5L9.5 39L16.3 37C18.6 38 21.2 38.5 24 38.5C32.8 38.5 40 31.7 40 23.2C40 14.8 32.8 8 24 8Z"
        stroke="#E2E8F0"
        strokeWidth="1.8"
        fill="#161D2B"
      />
      <circle cx="18" cy="23.5" r="2" fill="#10B981" className="animate-pulse" />
      <circle cx="24" cy="23.5" r="2" fill="#10B981" className="animate-pulse" />
      <circle cx="30" cy="23.5" r="2" fill="#10B981" className="animate-pulse" />
    </svg>
  );
}

export const FAQ_ITEMS = [
  {
    q: "Preciso cadastrar cartão de crédito para usar os 3 dias grátis?",
    a: "Não. Você cria a conta da sua estética em menos de 1 minuto e já entra para testar no pátio real durante 3 dias completos, sem pedir cartão.",
  },
  {
    q: "Minha equipe consegue ver o quanto eu faturo ou o lucro da loja?",
    a: "Não. Cada funcionário entra com um acesso próprio focado no trabalho do dia: receber veículos, fazer a vistoria, acompanhar o box e ver apenas as próprias comissões. Valores de caixa, contas e lucro ficam visíveis só para o dono.",
  },
  {
    q: "Como funciona a vistoria do carro na entrada em 3D?",
    a: "Na recepção, você gira o carro em 3D na tela do celular, tablet ou computador, abre portas ou capô se precisar e toca exatamente no lugar onde já existe um risco ou amassado. Dá para anexar fotos e enviar o comprovante direto no WhatsApp do cliente.",
  },
  {
    q: "Posso cobrar preços diferentes para carro pequeno, sedan e caminhonete?",
    a: "Sim. Ao cadastrar seus serviços você define os valores para carro pequeno, médio, grande, moto e utilitário. Na hora de montar o orçamento ou abrir a ordem de serviço, o valor certo já entra pronto automaticamente.",
  },
  {
    q: "Onde ficam guardadas as fotos das vistorias?",
    a: "Você pode conectar o sistema à sua própria conta na nuvem, como Google Drive ou OneDrive, evitando lotar a memória dos celulares dos funcionários.",
  },
  {
    q: "O sistema avisa quando um cliente está sumido ou quando vai acabar algum produto?",
    a: "Sim. O Vulpto mostra automaticamente quem não volta há mais de 45 dias, quem tem manutenção de vitrificação vencendo e lista os produtos próximos do estoque mínimo para você repor antes de faltar no box.",
  },
];
