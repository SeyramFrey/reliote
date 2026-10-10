import type { Locale } from "@/lib/i18n/config";

// Étude de cas mise en lumière (table featured_projects, gérée depuis l'admin).
// Pur : localise une ligne publiée pour la vue. Pas de contenu de repli — sans
// étude publiée, la section n'est pas affichée.

type SlideJson = { image?: string; caption_fr?: string; caption_en?: string };
type StatJson = { n?: number; suf?: string; l_fr?: string; l_en?: string };
type HotspotJson = {
  x?: number;
  y?: number;
  title_fr?: string;
  title_en?: string;
  body_fr?: string;
  body_en?: string;
};
type RowJson = { label_fr?: string; label_en?: string; value_fr?: string; value_en?: string };

export type FeaturedRow = {
  title_fr: string;
  title_en: string;
  location: string | null;
  coordinates: string | null;
  slides: unknown;
  stats: unknown;
  hotspots: unknown;
  quote_fr: string | null;
  quote_en: string | null;
  cite: string | null;
  rows: unknown;
};

export type FeaturedContent = {
  title: string;
  location: string;
  coordinates: string;
  slides: { image: string; caption: string }[];
  stats: { n: number; suf: string; l: string }[];
  hotspots: { x: number; y: number; t: string; b: string }[];
  quote: string;
  cite: string;
  rows: { k: string; v: string }[];
};

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function toFeaturedContent(row: FeaturedRow | null, locale: Locale): FeaturedContent | null {
  if (!row) return null;
  const en = locale === "en";

  const slides = asArray<SlideJson>(row.slides)
    .filter((s) => !!s.image)
    .map((s) => ({ image: s.image!, caption: (en ? s.caption_en : s.caption_fr) ?? "" }));
  if (slides.length === 0) return null;

  return {
    title: (en ? row.title_en : row.title_fr) || row.title_fr,
    location: row.location ?? "",
    coordinates: row.coordinates ?? "",
    slides,
    stats: asArray<StatJson>(row.stats).map((s) => ({
      n: Number(s.n ?? 0),
      suf: s.suf ?? "",
      l: (en ? s.l_en : s.l_fr) ?? "",
    })),
    hotspots: asArray<HotspotJson>(row.hotspots).map((h) => ({
      x: Number(h.x ?? 50),
      y: Number(h.y ?? 50),
      t: (en ? h.title_en : h.title_fr) ?? "",
      b: (en ? h.body_en : h.body_fr) ?? "",
    })),
    quote: (en ? row.quote_en : row.quote_fr) ?? "",
    cite: row.cite ?? "",
    rows: asArray<RowJson>(row.rows).map((r) => ({
      k: (en ? r.label_en : r.label_fr) ?? "",
      v: (en ? r.value_en : r.value_fr) ?? "",
    })),
  };
}
