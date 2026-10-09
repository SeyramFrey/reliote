import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEGAL_SLUGS, type LegalSlug } from "@/lib/legal/page";

export async function Footer() {
  const f = await getTranslations("landing.footer");
  const locale = await getLocale();
  const cols = f.raw("cols") as { h: string; links: string[] }[];
  const legal = f.raw("legal") as { h: string; links: Record<LegalSlug, string> };

  // On ne cite que les pages effectivement publiées : la policy « legal public
  // read » de 0012 filtre les brouillons, donc un texte encore en relecture
  // juridique n'apparaît pas — plutôt que d'annoncer un lien qui renvoie 404.
  const supabase = await createClient();
  const { data } = (await supabase
    .from("legal_pages")
    .select("slug")
    .order("sort_order", { ascending: true })) as { data: { slug: string }[] | null };
  const available = new Set((data ?? []).map((r) => r.slug));
  const publishedSlugs = LEGAL_SLUGS.filter((s) => available.has(s));

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
          <div style={{ marginTop: 28, display: "flex", gap: 18 }}>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                color: "rgba(243,241,236,0.55)",
              }}
            >
              PARIS
            </span>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                color: "rgba(243,241,236,0.55)",
              }}
            >
              ·
            </span>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                color: "rgba(243,241,236,0.55)",
              }}
            >
              ABIDJAN
            </span>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h} className="footer-col">
            <h5>{c.h}</h5>
            <ul>
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
      </div>
      <div className="footer-base">
        <span>© Reliote · 2026 — {f("rights")}</span>
        <span>{f("version")}</span>
      </div>
    </footer>
  );
}
