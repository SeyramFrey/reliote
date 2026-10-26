import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rankArchitects, type ProjectForMatch, type ArchitectForMatch } from "@/lib/matching/score";
import { advanceProject, ACTIVE_ENGAGEMENT_STATUSES } from "@/lib/workflow/projectState";

type Profile = { role: string };

function crossOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  return !!origin && origin !== req.nextUrl.origin && origin !== process.env.SITE_URL?.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  // Route appelée en fetch par le bouton admin : on refuse une requête venue
  // d'un autre site (CSRF), que SameSite=Lax ne couvre pas pour tous les cas.
  if (req.headers.get("sec-fetch-site") === "cross-site" || crossOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: Profile | null };
  if (prof?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "missing projectId" }, { status: 400 });

  const s = createServiceClient();
  // NOTE: keep these select columns in sync with projets/initier/actions.ts — both feed ProjectForMatch/ArchitectForMatch.
  const { data: project } = await s
    .from("client_projects")
    .select("id, project_type, required_specialties, project_country, project_location, budget_range")
    .eq("id", projectId)
    .single() as { data: ProjectForMatch | null };
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const { data: architects } = await s
    .from("architect_profiles")
    .select("id, country, city, specialties, project_types, years_experience, availability, rating, status") as { data: ArchitectForMatch[] | null };

  const matches = rankArchitects(project, (architects ?? []), 5);

  // Les correspondances des architectes déjà proposés ou engagés sont gardées :
  // l'admin ne doit pas perdre la carte (et le formulaire de RDV) d'un
  // architecte en cours de sélection parce qu'il est sorti du top 5.
  const { data: engaged } = (await s
    .from("client_engagements")
    .select("architect_id")
    .eq("project_id", projectId)
    .in("status", [...ACTIVE_ENGAGEMENT_STATUSES])) as { data: { architect_id: string }[] | null };
  const keep = (engaged ?? []).map((e) => e.architect_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let del = (s.from("match_results") as any).delete().eq("project_id", projectId);
  if (keep.length) del = del.not("architect_id", "in", `(${keep.join(",")})`);
  await del;
  if (matches.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s.from("match_results") as any).upsert(
      matches.map((m) => ({
        project_id: projectId,
        architect_id: m.architectId,
        score: m.score,
        reasons: m.reasons,
      })),
      { onConflict: "project_id,architect_id" },
    );
    await advanceProject(s, projectId, "rematched");
  }

  return NextResponse.json({ ok: true, count: matches.length });
}
