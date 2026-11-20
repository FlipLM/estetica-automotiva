import { getSession } from "@/lib/auth";
import { VulptoLanding } from "@/components/landing/vulpto-landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession().catch(() => null);
  const sessionUser = session
    ? {
        name: session.name,
        role: session.role,
        tenantName: session.tenantName,
      }
    : null;

  return <VulptoLanding sessionUser={sessionUser} />;
}
