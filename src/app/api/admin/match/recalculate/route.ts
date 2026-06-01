import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rankArchitects, type ProjectForMatch, type ArchitectForMatch } from "@/lib/matching/score";

type Profile = { role: string };

export async function POST(req: NextRequest) {
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
  const { data: project } = await s
    .from("client_projects")
    .select("id, project_type, required_specialties, project_location, budget_range")
    .eq("id", projectId)
    .single() as { data: ProjectForMatch | null };
  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const { data: architects } = await s
    .from("architect_profiles")
    .select("id, city, specialties, project_types, years_experience, availability, rating, status") as { data: ArchitectForMatch[] | null };

  const matches = rankArchitects(project, (architects ?? []), 5);

  // Reset then insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("match_results") as any).delete().eq("project_id", projectId);
  if (matches.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s.from("match_results") as any).insert(matches.map((m) => ({
      project_id: projectId,
      architect_id: m.architectId,
      score: m.score,
      reasons: m.reasons,
    })));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s.from("client_projects") as any).update({ status: "matched" }).eq("id", projectId);
  }

  return NextResponse.json({ ok: true, count: matches.length });
}
