import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { currentViewer, loadThreadView } from "@/lib/messaging/data";
import { ThreadView } from "@/components/messaging/ThreadView";

export default async function AdminThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const locale = await getLocale();
  const viewer = await currentViewer();
  if (!viewer || viewer.role !== "admin") redirect(`/${locale}/dashboard`);
  if (!/^[0-9a-f-]{36}$/i.test(threadId)) notFound();
  const view = await loadThreadView(viewer, threadId, { locale });
  if (!view) notFound();
  return <ThreadView initial={view} backHref={`/${locale}/admin/messages`} embedded />;
}
