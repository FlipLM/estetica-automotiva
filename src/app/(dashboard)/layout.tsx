import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex cockpit-grid-bg text-slate-100 antialiased selection:bg-lime-400 selection:text-black">
      {/* Sidebar de Navegação Cockpit */}
      <Sidebar role={session.role} tenantName={session.tenantName} />

      {/* Conteúdo Principal do Cockpit */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userName={session.name}
          userRole={session.role}
          tenantName={session.tenantName}
        />
        <main className="flex-1 p-5 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
