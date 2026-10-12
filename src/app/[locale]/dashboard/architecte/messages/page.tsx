import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { currentViewer, listThreads } from "@/lib/messaging/data";
import { ThreadList } from "@/components/messaging/ThreadList";

export default async function ArchitectMessagesPage() {
  const locale = await getLocale();
  const viewer = await currentViewer();
  if (!viewer || viewer.role !== "architect") redirect(`/${locale}/dashboard`);
  // Pas encore de dossier : la candidature se fait d'abord.
  if (!viewer.architectId) redirect(`/${locale}/architectes/rejoindre`);
  const t = await getTranslations("messaging");
  const threads = await listThreads(viewer, locale);
  return (
    <section className="page-edge py-16 max-w-[880px] mx-auto">
      <p className="eyebrow">{t("navLabel")}</p>
      <h1 className="font-light text-[clamp(40px,5vw,64px)] leading-[1.05] mt-4">{t("listTitle")}</h1>
      <p className="mt-4 text-concrete-1 max-w-[56ch]">{t("listKickerArchitect")}</p>
      <ThreadList threads={threads} />
    </section>
  );
}
