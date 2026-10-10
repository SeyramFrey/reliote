import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import type { LegalSlug } from "@/lib/legal/page";
import { getPublishedLegalSlugs } from "@/lib/legal/published";
import { getPublishedMedia } from "@/lib/landing/data";

type FooterLink = { key: string; href: string };

// Uniquement des liens qui mènent quelque part : les ancres de la landing et
// les routes publiques. Le Journal n'est cité que s'il a du contenu publié
// (sinon la section n'est pas rendue et l'ancre ne mène nulle part).
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
  const [publishedSlugs, media] = await Promise.all([getPublishedLegalSlugs(), getPublishedMedia()]);

  const cols = [
    { h: f("platform"), links: PLATFORM.filter((l) => l.key !== "journal" || media.length > 0) },
    { h: f("start"), links: START },
  ];

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand-block">
          <div className="brand">
            <span
              className="brand-mark"
              style={{ borderColor: "rgba(243,241,236,0.6)" }}
            >
              R
            </span>
            <span className="brand-name">RELIOTE</span>
          </div>
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
