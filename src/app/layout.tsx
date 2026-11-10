import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Detailing SaaS — Gestão para Estética Automotiva & Lava-Jatos",
  description: "Sistema completo de gestão de pátio, vistoria 360, ordens de serviço e DRE para estética automotiva.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

