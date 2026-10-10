"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { projectSchemaFor, type ProjectInput, type ProjectMode } from "@/lib/validation/project.schema";
import {
  rankArchitects,
  type ProjectForMatch,
  type ArchitectForMatch,
} from "@/lib/matching/score";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { signUpOutcome } from "@/lib/auth/signUpOutcome";
import { appOrigin } from "@/lib/auth/origin";
import { sendEmail, adminEmail } from "@/lib/email/client";
import { projectReceivedEmail, newProjectAdminEmail } from "@/lib/email/templates";

type InsertedProject = {
  id: string;
  project_type: string;
  required_specialties: string[];
  project_country: string;
  project_location: string;
  budget_range: string | null;
};

// Codes d'erreur traduits par le formulaire (wizardClient.errors.*), plus
// « exists » et « wrongRole » qui ont un affichage dédié.
export type SubmitProjectResult =
  | { error: "exists" | "wrongRole" | "validation" | "insert" | "weak" | "generic" }
  | { needsConfirmation: true; email: string };

// Dépôt d'un projet. Le porteur a toujours un compte : soit il est connecté,
// soit on le crée ici avec le projet. Jamais de projet sans propriétaire.
export async function submitProject(
  input: ProjectInput,
  mode: ProjectMode,
): Promise<SubmitProjectResult | void> {
  const parsed = projectSchemaFor(mode).safeParse(input);
  if (!parsed.success) {
    return { error: "validation" };
  }
  const data = parsed.data as ProjectInput;
  const locale = safeLocale((await cookies()).get("NEXT_LOCALE")?.value);
  const origin = await appOrigin();

  const supabase = await createClient();
  const service = createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId: string;
  let clientName: string;
  let email: string;
  let needsConfirmation = false;

  if (user) {
    const { data: profile } = (await service
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single()) as { data: { role: string; first_name: string | null; last_name: string | null } | null };
    if (profile?.role !== "client") return { error: "wrongRole" };
    userId = user.id;
    email = user.email ?? "";
    clientName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || email;
  } else {
    if (mode !== "guest" || !data.email || !data.password) return { error: "validation" };
    const res = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: "client",
          first_name: data.first_name?.trim(),
          last_name: data.last_name?.trim(),
          locale,
        },
        emailRedirectTo: `${origin}/${locale}/auth/callback?next=${encodeURIComponent(`/${locale}/dashboard/client`)}`,
      },
    });
    const outcome = signUpOutcome(res);
    if (outcome.kind === "already_registered") return { error: "exists" };
    if (outcome.kind === "error") return { error: outcome.code === "weak_password" ? "weak" : "generic" };
    userId = outcome.userId;
    needsConfirmation = outcome.kind === "needs_confirmation";
    email = data.email;
    clientName = `${data.first_name?.trim()} ${data.last_name?.trim()}`.trim();
  }

  const insertRow = {
    user_id: userId,
    client_name: clientName,
    email,
    phone: data.phone || null,
    project_type: data.project_type,
    project_description: data.project_description,
    required_specialties: data.required_specialties,
    notes: data.notes || null,
    project_country: data.project_country,
    project_location: data.project_location,
    budget_range: data.budget_range || null,
    timeline: data.timeline || null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = (await (service.from("client_projects") as any)
    .insert(insertRow)
    .select("id, project_type, required_specialties, project_country, project_location, budget_range")
    .single()) as { data: InsertedProject | null; error: { message: string } | null };

  if (error || !inserted) return { error: "insert" };

  // Matching automatique (top 5 enregistrés, l'admin choisit ensuite).
  const { data: architects } = (await service
    .from("architect_profiles")
    .select("id, country, city, specialties, project_types, years_experience, availability, rating, status")) as {
    data: ArchitectForMatch[] | null;
  };

  const projectForMatch: ProjectForMatch = {
    id: inserted.id,
    project_type: inserted.project_type,
    required_specialties: inserted.required_specialties,
    project_country: inserted.project_country,
    project_location: inserted.project_location,
    budget_range: inserted.budget_range,
  };

  const matches = rankArchitects(projectForMatch, architects ?? [], 5);

  if (matches.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service.from("match_results") as any).insert(
      matches.map((m) => ({
        project_id: inserted.id,
        architect_id: m.architectId,
        score: m.score,
        reasons: m.reasons,
      })),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service.from("client_projects") as any).update({ status: "matched" }).eq("id", inserted.id);
  }

  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/projets`);
    revalidatePath(`/${l}/admin/matches`);
    revalidatePath(`/${l}/dashboard/client`);
  }

  // E-mails best-effort : accusé au porteur, alerte à l'admin.
  const ack = projectReceivedEmail(locale, {
    clientName,
    projectType: inserted.project_type,
    projectCountry: inserted.project_country,
    projectLocation: inserted.project_location,
    matchCount: matches.length,
    ctaUrl: `${origin}/${locale}/dashboard/client`,
  });
  const admin = adminEmail();
  const adminAlert = newProjectAdminEmail({
    clientName,
    projectType: inserted.project_type,
    projectCountry: inserted.project_country,
    projectLocation: inserted.project_location,
    matchCount: matches.length,
    adminUrl: `${origin}/fr/admin/projets/${inserted.id}`,
  });
  await Promise.all([
    sendEmail({ to: email, subject: ack.subject, html: ack.html }),
    admin ? sendEmail({ to: admin, subject: adminAlert.subject, html: adminAlert.html }) : Promise.resolve(),
  ]);

  if (needsConfirmation) return { needsConfirmation: true, email };
  redirect(`/${locale}/projets/${inserted.id}/confirmation`);
}
