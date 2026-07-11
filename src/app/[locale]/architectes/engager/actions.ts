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
//   3. l'architecte est bien matché à ce projet (sinon on ne révèle pas)
//
// On insère ou met à jour client_engagements à status='engaged' + charter_accepted=true.
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

  // (3) L'architecte est-il bien matché à ce projet ? On refuse les engagements
  // sur des architectes non proposés — pas de scraping de handles.
  const { data: match } = (await service
    .from("match_results")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .maybeSingle()) as { data: { project_id: string } | null };
  if (!match) return { error: "Cet architecte n'est pas proposé pour ce projet" };

  // Upsert : si une ligne existait déjà à status='proposed', on la passe à 'engaged'.
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service.from("client_engagements") as any).upsert(
    {
      project_id: projectId,
      architect_id: architectId,
      status: "engaged",
      charter_version: CURRENT_CHARTER_VERSION,
      charter_accepted: true,
      engaged_at: now,
    },
    { onConflict: "project_id,architect_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/fr/architectes");
  revalidatePath("/en/architectes");
  revalidatePath(`/fr/projets/${projectId}/confirmation`);
  revalidatePath(`/en/projets/${projectId}/confirmation`);
  return { ok: true };
}
