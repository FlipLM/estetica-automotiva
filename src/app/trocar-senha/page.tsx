import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/modules/change-password-form";

export const dynamic = "force-dynamic";

export default async function TrocarSenhaPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <ChangePasswordForm
      mustChangePassword={Boolean(session.mustChangePassword)}
      userName={session.name}
      userEmail={session.email}
    />
  );
}
