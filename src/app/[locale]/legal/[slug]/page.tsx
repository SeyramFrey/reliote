import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n/config";
import {
  LEGAL_SLUGS,
  isLegalSlug,
  pickLocalized,
  sanitizeLegalHtml,
  type LegalRow,
} from "@/lib/legal/page";

const COLUMNS =
  "slug, title_fr, title_en, body_fr, body_en, seo_description_fr, seo_description_en, updated_at";

type Params = { params: Promise<{ locale: string; slug: string }> };

// Lecture via le client anon : la policy « legal public read » de 0012 filtre
// déjà les brouillons. Un slug non publié se comporte donc comme un slug
// inconnu — pas de fuite d'un texte en cours de relecture juridique.
async function loadPage(slug: string): Promise<LegalRow | null> {
  if (!isLegalSlug(slug)) return null;
  const supabase = await createClient();
  const { data } = (await supabase
    .from("legal_pages")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle()) as { data: LegalRow | null };
  return data;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => LEGAL_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const row = await loadPage(slug);
  if (!row) return { title: "Reliote" };

  const { title, description } = pickLocalized(row, locale as Locale);
  const base = process.env.SITE_URL?.replace(/\/+$/, "");
  const path = `/legal/${slug}`;

  return {
    ...(base ? { metadataBase: new URL(base) } : {}),
    title: `${title} — Reliote`,
    ...(description ? { description } : {}),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: {
      type: "article",
      title: `${title} — Reliote`,
      ...(description ? { description } : {}),
      url: `/${locale}${path}`,
      locale,
    },
  };
}

export default async function LegalPage({ params }: Params) {
  const { locale, slug } = await params;
  const row = await loadPage(slug);
  if (!row) notFound();

  const { title, body } = pickLocalized(row, locale as Locale);
  const html = sanitizeLegalHtml(body);

  const updated = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(row.updated_at));

  return (
    <>
      <Nav />
      <main className="pt-24 page-edge py-16 grid grid-cols-12 gap-[var(--gutter)]">
        <header className="col-span-12 lg:col-span-8 lg:col-start-3">
          <p className="eyebrow">
            {locale === "en" ? "Legal" : "Légal"}
          </p>
          <h1 className="font-light text-5xl md:text-6xl mt-3 leading-[1.05] text-balance">
            {title}
          </h1>
          <p className="mono text-[11px] text-concrete-2 mt-6">
            {locale === "en" ? "Last updated" : "Dernière mise à jour"} · {updated}
          </p>
          <div className="hairline mt-8" />
        </header>

        <article
          className="col-span-12 lg:col-span-8 lg:col-start-3 legal-prose mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
      <Footer />
    </>
  );
}
