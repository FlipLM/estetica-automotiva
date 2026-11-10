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
    <div className="min-h-screen flex bg-[#F7F8F6] text-[#252B27] antialiased">
      {/* Barra Lateral Desktop & Navegação Mobile */}
      <Sidebar role={session.role} tenantName={session.tenantName} />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userName={session.name}
          userRole={session.role}
          tenantName={session.tenantName || "DetailPro"}
        />
        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
