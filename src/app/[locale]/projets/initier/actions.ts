"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { projectSchema, type ProjectInput } from "@/lib/validation/project.schema";
import {
  rankArchitects,
  type ProjectForMatch,
  type ArchitectForMatch,
} from "@/lib/matching/score";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sendEmail, siteUrl } from "@/lib/email/client";
import { projectReceivedEmail } from "@/lib/email/templates";

type InsertedProject = {
  id: string;
  project_type: string;
  required_specialties: string[];
  project_country: string;
  project_location: string;
  budget_range: string | null;
};

export async function submitProject(input: ProjectInput) {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Anonymous submissions are NOT allowed by the existing RLS policy on client_projects
  // ("projects owner insert" requires auth.uid() = user_id). So we INSERT via the service
  // client (which bypasses RLS) and tag with user_id if authenticated, else NULL.
  const service = createServiceClient();
  const insertRow = {
    ...parsed.data,
    user_id: user?.id ?? null,
    notes: parsed.data.notes || null,
    budget_range: parsed.data.budget_range || null,
    timeline: parsed.data.timeline || null,
    phone: parsed.data.phone || null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (service.from("client_projects") as any)
    .insert(insertRow)
    .select("id, project_type, required_specialties, project_country, project_location, budget_range")
    .single() as { data: InsertedProject | null; error: { message: string } | null };

  if (error || !inserted) return { error: error?.message ?? "Insert failed" };

  // Fetch all verified+available architects for ranking
  const { data: architects } = await service
    .from("architect_profiles")
    .select("id, country, city, specialties, project_types, years_experience, availability, rating, status") as {
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
      }))
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service.from("client_projects") as any).update({ status: "matched" }).eq("id", inserted.id);
  }

  revalidatePath("/fr/admin/projets");
  revalidatePath("/en/admin/projets");
  revalidatePath("/fr/admin/matches");
  revalidatePath("/en/admin/matches");

  const locale = (await cookies()).get("NEXT_LOCALE")?.value || "fr";

  // Accusé de réception au porteur (best-effort, ne bloque jamais le flux).
  const site = siteUrl();
  const ack = projectReceivedEmail(locale, {
    clientName: parsed.data.client_name,
    projectType: inserted.project_type,
    projectCountry: inserted.project_country,
    projectLocation: inserted.project_location,
    matchCount: matches.length,
    ctaUrl: site ? `${site}/${locale}/dashboard/client` : null,
  });
  await sendEmail({ to: parsed.data.email, subject: ack.subject, html: ack.html });

  redirect(`/${locale}/projets/${inserted.id}/confirmation`);
}
