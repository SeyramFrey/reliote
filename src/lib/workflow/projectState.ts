import "server-only";
import { projectStatusAfter, type ProjectStatus, type WorkflowEvent } from "./status";

export const ACTIVE_MEETING_STATUSES = ["proposed", "rescheduled", "confirmed"] as const;
export const ACTIVE_ENGAGEMENT_STATUSES = ["proposed", "engaged"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = any;

// Lit l'état courant d'un projet puis applique la règle de transition. À
// appeler APRÈS avoir écrit le changement (RDV annulé, proposition retirée…),
// pour que les compteurs reflètent la situation nouvelle.
export async function advanceProject(
  s: ServiceClient,
  projectId: string,
  event: WorkflowEvent,
): Promise<ProjectStatus | null> {
  const [{ data: project }, { count: activeMeetings }, { count: activeProposals }] = await Promise.all([
    s.from("client_projects").select("status").eq("id", projectId).single(),
    s
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("status", [...ACTIVE_MEETING_STATUSES]),
    s
      .from("client_engagements")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("status", [...ACTIVE_ENGAGEMENT_STATUSES]),
  ]);
  if (!project) return null;
  const current = project.status as ProjectStatus;
  const next = projectStatusAfter(event, {
    current,
    activeMeetings: activeMeetings ?? 0,
    activeProposals: activeProposals ?? 0,
  });
  if (next !== current) {
    await s.from("client_projects").update({ status: next }).eq("id", projectId);
  }
  return next;
}
