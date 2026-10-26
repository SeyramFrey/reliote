import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";
import type { LegalSlug } from "@/lib/legal/page";
import { getPublishedLegalSlugs } from "@/lib/legal/published";

type FooterLink = { key: string; href: string };

// Uniquement des liens qui mènent quelque part : les ancres de la landing et
// les routes publiques. Le Journal est toujours rendu (articles publiés, ou ses
// sujets « à paraître ») : son ancre mène quelque part.
const PLATFORM: FooterLink[] = [
  { key: "selection", href: "#architectes" },
  { key: "approach", href: "#approche" },
  { key: "process", href: "#projets" },
  { key: "territory", href: "#territoire" },
  { key: "about", href: "#apropos" },
  { key: "journal", href: "#journal" },
];
const START: FooterLink[] = [
  { key: "project", href: "/projets/initier" },
  { key: "join", href: "/architectes/rejoindre" },
  { key: "login", href: "/auth/login" },
];

const axisStyle = {
  fontSize: 10.5,
  letterSpacing: "0.18em",
  color: "rgba(243,241,236,0.55)",
  textTransform: "uppercase" as const,
};

export async function Footer() {
  const f = await getTranslations("landing.footer");
  const locale = await getLocale();
  const legal = f.raw("legal") as { h: string; links: Record<LegalSlug, string> };

  // On ne cite que les pages effectivement publiées : la policy « legal public
  // read » de 0012 filtre les brouillons, donc un texte encore en relecture
  // juridique n'apparaît pas — plutôt que d'annoncer un lien qui renvoie 404.
  const publishedSlugs = await getPublishedLegalSlugs();

  const cols = [
    { h: f("platform"), links: PLATFORM },
    { h: f("start"), links: START },
  ];

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand-block">
          <BrandMark inverse size="lg" />
          <p className="footer-tag">{f("tag")}</p>
          <div style={{ marginTop: 28 }}>
            <span className="mono" style={axisStyle}>
              {f("axis")}
            </span>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h} className="footer-col">
            <h5>{c.h}</h5>
            <ul>
              {c.links.map((l) => (
                <li key={l.key}>
                  <Link href={`/${locale}${l.href}`}>{f(`links.${l.key}`)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {publishedSlugs.length > 0 && (
          <div className="footer-col">
            <h5>{legal.h}</h5>
            <ul>
              {publishedSlugs.map((slug) => (
                <li key={slug}>
                  <Link href={`/${locale}/legal/${slug}`}>{legal.links[slug]}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="footer-base">
        <span>© Reliote · 2026 — {f("rights")}</span>
      </div>
    </footer>
  );
}
