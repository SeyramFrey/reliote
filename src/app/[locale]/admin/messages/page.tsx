import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { currentViewer, listThreads } from "@/lib/messaging/data";
import { ThreadList } from "@/components/messaging/ThreadList";
import type { ThreadKind } from "@/lib/messaging/rules";

const FILTERS: { key: string; label: string; kind: ThreadKind | null }[] = [
  { key: "all", label: "Tous", kind: null },
  { key: "porteurs", label: "Porteurs", kind: "project_client" },
  { key: "architectes", label: "Architectes", kind: "project_architect" },
  { key: "admissions", label: "Admissions", kind: "architect_admission" },
];

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const locale = await getLocale();
  const viewer = await currentViewer();
  if (!viewer || viewer.role !== "admin") redirect(`/${locale}/dashboard`);
  const { f } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const all = await listThreads(viewer, locale);
  const threads = filter.kind ? all.filter((t) => t.kind === filter.kind) : all;
  const unread = all.reduce((n, t) => n + t.unread, 0);
  return (
    <>
      <p className="eyebrow">Messagerie</p>
      <h1 className="font-light text-5xl mt-2">Messages</h1>
      <p className="mt-3 text-concrete-1 text-sm">
        {unread > 0 ? `${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}` : "Tout est lu."}
      </p>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filtrer les conversations">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={`/${locale}/admin/messages${x.key === "all" ? "" : `?f=${x.key}`}`}
            className={`px-3 py-1.5 text-sm border ${x.key === filter.key ? "border-ink" : "border-[var(--hairline)] text-concrete-1 hover:text-ink"}`}
          >
            {x.label}
          </Link>
        ))}
      </nav>
      <ThreadList threads={threads} />
    </>
  );
}
