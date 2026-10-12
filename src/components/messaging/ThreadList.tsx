import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ThreadSummary } from "@/lib/messaging/types";

// Liste de conversations (porteur, architecte, admin) : non-lus en tête, fils
// fermés signalés.
export async function ThreadList({ threads }: { threads: ThreadSummary[] }) {
  const t = await getTranslations("messaging");
  const locale = await getLocale();
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (threads.length === 0) return <p className="mt-10 text-concrete-1">{t("listEmpty")}</p>;

  return (
    <ul className="mt-10 border-t border-[var(--hairline)]">
      {threads.map((th) => (
        <li key={th.key} className="border-b border-[var(--hairline)]">
          <Link
            href={th.href}
            className="flex items-center justify-between gap-4 py-5 px-1 hover:bg-paper-2 transition-colors"
          >
            <span className="min-w-0">
              <span className={`block text-[17px] [overflow-wrap:anywhere] ${th.unread ? "font-medium" : "font-light"}`}>
                {th.title}
              </span>
              <span className="block mono text-[10.5px] tracking-[0.14em] uppercase text-concrete-2 mt-1">
                {th.subtitle}
                {th.lastMessageAt ? ` · ${fmt.format(new Date(th.lastMessageAt))}` : ""}
              </span>
            </span>
            <span className="flex items-center gap-3 shrink-0">
              {th.closed && (
                <span className="mono text-[10px] tracking-[0.14em] uppercase text-concrete-2 border border-[var(--hairline)] px-2 py-0.5">
                  {t("closedTag")}
                </span>
              )}
              {th.unread > 0 && (
                <span className="bg-green text-paper text-[12px] px-2.5 py-0.5 rounded-full">
                  {t("unread", { count: th.unread })}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
