import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { currentViewer, getOrCreateAdmissionThread, loadThreadView } from "@/lib/messaging/data";
import { ThreadView } from "@/components/messaging/ThreadView";

// « admission » désigne le fil d'admission de l'architecte connecté, créé au
// premier passage ; sinon un identifiant de fil projet.
export default async function ArchitectThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const locale = await getLocale();
  const viewer = await currentViewer();
  if (!viewer || viewer.role !== "architect") redirect(`/${locale}/dashboard`);
  if (!viewer.architectId) redirect(`/${locale}/architectes/rejoindre`);
  const id = threadId === "admission" ? await getOrCreateAdmissionThread(viewer.architectId, viewer.userId) : threadId;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const view = await loadThreadView(viewer, id, { locale });
  if (!view) notFound();
  return <ThreadView initial={view} backHref={`/${locale}/dashboard/architecte/messages`} />;
}
