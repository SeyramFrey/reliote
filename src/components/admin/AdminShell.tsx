"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();
  const tabs = [
    { href: `/${locale}/admin`, label: "Vue d'ensemble" },
    { href: `/${locale}/admin/architectes`, label: "Architectes" },
    { href: `/${locale}/admin/projets`, label: "Projets" },
    { href: `/${locale}/admin/rdv`, label: "RDV" },
    { href: `/${locale}/admin/matches`, label: "Matches" },
    { href: `/${locale}/admin/medias`, label: "Médias" },
    { href: `/${locale}/admin/featured`, label: "Mis en lumière" },
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
                pathname === t.href ? "border-green text-ink" : "border-transparent text-concrete-1 hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="col-span-12 md:col-span-9">{children}</section>
    </div>
  );
}
