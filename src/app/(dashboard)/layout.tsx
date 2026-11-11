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

  // Se o período de teste de 3 dias expirou, bloqueia o acesso e direciona para a tela de conversão
  if (session.isTrialExpired) {
    redirect("/bloqueado");
  }

  // Se o cliente ainda não completou a pré-configuração guiada da oficina, direciona para o onboarding
  if (session.onboardingCompleted === false) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex bg-[#F7F8F6] text-[#252B27] antialiased overflow-x-hidden w-full max-w-full print:bg-white print:overflow-visible print:min-h-0 print:block">
      {/* Barra Lateral Desktop & Navegação Mobile */}
      <Sidebar role={session.role} tenantName={session.tenantName} />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden print:overflow-visible print:block print:w-full print:max-w-none">
        <Header
          userName={session.name}
          userRole={session.role}
          tenantName={session.tenantName || "Vulpto"}
          plan={session.plan}
          trialExpiresAt={session.trialExpiresAt}
        />
        <main className="flex-1 p-3.5 sm:p-6 pb-24 lg:pb-8 overflow-y-auto overflow-x-hidden max-w-[1600px] w-full mx-auto print:p-0 print:pb-0 print:m-0 print:overflow-visible print:max-w-none print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
