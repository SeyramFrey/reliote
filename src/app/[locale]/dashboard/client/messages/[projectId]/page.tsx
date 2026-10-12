import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/service";
import { currentViewer, getOrCreateClientThread, loadThreadView } from "@/lib/messaging/data";
import { ThreadView } from "@/components/messaging/ThreadView";

export default async function ClientThreadPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const locale = await getLocale();
  const viewer = await currentViewer();
  if (!viewer || viewer.role !== "client") redirect(`/${locale}/dashboard`);
  // Seul le porteur du projet ouvre (et crée au besoin) le fil de son projet.
  const { data: project } = await createServiceClient()
    .from("client_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.user_id !== viewer.userId) notFound();
  const threadId = await getOrCreateClientThread(projectId, viewer.userId);
  const view = await loadThreadView(viewer, threadId, { locale });
  if (!view) notFound();
  return <ThreadView initial={view} backHref={`/${locale}/dashboard/client/messages`} />;
}
