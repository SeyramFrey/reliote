"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function AdminShell({ children, unread = 0 }: { children: React.ReactNode; unread?: number }) {
  const pathname = usePathname();
  const locale = useLocale();
  const tabs: { href: string; label: string; badge?: number }[] = [
    { href: `/${locale}/admin`, label: "Vue d'ensemble" },
    { href: `/${locale}/admin/messages`, label: "Messages", badge: unread },
    { href: `/${locale}/admin/architectes`, label: "Architectes" },
    { href: `/${locale}/admin/projets`, label: "Projets" },
    { href: `/${locale}/admin/rdv`, label: "RDV" },
    { href: `/${locale}/admin/matches`, label: "Matches" },
    { href: `/${locale}/admin/medias`, label: "Journal" },
    { href: `/${locale}/admin/featured`, label: "Mis en lumière" },
    { href: `/${locale}/admin/avis`, label: "Avis" },
    { href: `/${locale}/admin/partenaires`, label: "Partenaires" },
    { href: `/${locale}/admin/legal`, label: "Pages légales" },
  ];
  return (
    <div className="page-edge py-12 grid grid-cols-12 gap-[var(--gutter)]">
      <aside className="col-span-12 md:col-span-3">
        <nav className="space-y-2 md:sticky md:top-32">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`block py-2 text-sm border-l-2 pl-3 transition-colors ${
                pathname === t.href || (t.href.endsWith("/messages") && pathname.startsWith(t.href))
                  ? "border-green text-ink"
                  : "border-transparent text-concrete-1 hover:text-ink"
              }`}
            >
              {t.label}
              {t.badge ? (
                <span className="ml-2 bg-green text-paper text-[11px] px-2 py-0.5 rounded-full" aria-label={`${t.badge} non lus`}>
                  {t.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="col-span-12 md:col-span-9">{children}</section>
    </div>
  );
}
