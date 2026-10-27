"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { safeAdminReturn } from "@/lib/auth/safeRedirect";

// Appareil perdu : l'admin retire tous les facteurs du compte, après avoir
// vérifié l'identité de la personne hors de la plateforme. À sa prochaine
// connexion, le compte réactive la double authentification (si son rôle l'exige).
export async function resetUserMfa(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const back = safeAdminReturn(String(formData.get("returnTo") ?? ""), "/fr/admin");
  if (!userId) redirect(back);

  const s = createServiceClient();
  const { data } = await s.auth.admin.mfa.listFactors({ userId });
  for (const f of data?.factors ?? []) {
    await s.auth.admin.mfa.deleteFactor({ userId, id: f.id });
  }
  revalidatePath(back);
  redirect(back);
}
