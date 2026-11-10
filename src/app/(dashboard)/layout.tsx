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
    <div className="min-h-screen flex bg-[#F7F8F6] text-[#252B27] antialiased overflow-x-hidden w-full max-w-full">
      {/* Barra Lateral Desktop & Navegação Mobile */}
      <Sidebar role={session.role} tenantName={session.tenantName} />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <Header
          userName={session.name}
          userRole={session.role}
          tenantName={session.tenantName || "DetailPro"}
        />
        <main className="flex-1 p-3.5 sm:p-6 pb-24 lg:pb-8 overflow-y-auto overflow-x-hidden max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
