import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vulpto — Gestão Profissional para Estética Automotiva",
  description:
    "Sistema completo de gestão operacional, vistoria 360º, ordens de serviço, pátio Kanban e financeiro para estética automotiva.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F7F8F6] text-[#252B27] antialiased selection:bg-[#247653] selection:text-white">
        {children}
      </body>
    </html>
  );
}
