import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { currentViewer, unreadTotal } from "@/lib/messaging/data";

// Accès à la messagerie depuis un tableau de bord, avec le nombre de non-lus.
export async function MessagesLink({ href }: { href: string }) {
  const [t, locale, viewer] = await Promise.all([getTranslations("messaging"), getLocale(), currentViewer()]);
  const unread = viewer ? await unreadTotal(viewer) : 0;
  return (
    <Link
      href={`/${locale}${href}`}
      className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink"
    >
      {t("navLabel")}
      {unread > 0 && (
        <span className="bg-green text-paper text-[11px] px-2 py-0.5 rounded-full">{t("unread", { count: unread })}</span>
      )}
    </Link>
  );
}
