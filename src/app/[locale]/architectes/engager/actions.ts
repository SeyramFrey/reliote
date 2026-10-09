"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { CURRENT_CHARTER_VERSION } from "@/types/anon";
import { revalidatePath } from "next/cache";

// Accepter la charte de non-contournement client + révéler l'identité d'un
// architecte précis sur un projet précis.
//
// On vérifie côté serveur :
//   1. l'utilisateur est authentifié
//   2. il owns le projet (project_id ⇄ user_id)
//   3. l'admin a PROPOSÉ cet architecte pour ce projet (client_engagements
//      'proposed'). Être dans le top du matching ne suffit pas : c'est la
//      sélection de l'admin qui ouvre la révélation, jamais le client seul.
//
// On fait passer l'engagement 'proposed' existant à 'engaged' + charter_accepted=true.
// Le trigger DB génère les adresses relais. La RLS sur architect_profiles ouvre
// automatiquement la lecture complète pour ce couple (client, architect).
export async function submitEngagement(
  projectId: string,
  architectId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const service = createServiceClient();

  // (2) Le projet appartient bien à l'utilisateur ?
  const { data: project } = (await service
    .from("client_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle()) as { data: { id: string } | null };
  if (!project) return { error: "Projet introuvable" };

  // (3) Seul un engagement proposé par l'admin peut être accepté. Le filtre sur
  // status='proposed' dans l'UPDATE rend l'opération atomique : pas de ligne
  // proposée → aucune ligne modifiée → refus.
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = (await (service.from("client_engagements") as any)
    .update({
      status: "engaged",
      charter_version: CURRENT_CHARTER_VERSION,
      charter_accepted: true,
      engaged_at: now,
    })
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .eq("status", "proposed")
    .select("id")) as { data: { id: string }[] | null; error: { message: string } | null };
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Cet architecte n'est pas proposé pour ce projet" };
  }

  revalidatePath("/fr/architectes");
  revalidatePath("/en/architectes");
  revalidatePath(`/fr/projets/${projectId}/confirmation`);
  revalidatePath(`/en/projets/${projectId}/confirmation`);
  return { ok: true };
}
