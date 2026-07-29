import { getLocale } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/service";
import { FeaturedCaseView, type FeaturedContent } from "./FeaturedCaseView";

// Bloc D — Étude de cas mise en lumière, alimentée par featured_projects.
// Serveur : récupère la ligne publiée la mieux classée, la localise, et délègue
// le rendu interactif à FeaturedCaseView. Aucune ligne publiée → content=null →
// la vue retombe sur le contenu i18n d'origine.

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

type FeaturedRow = {
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

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export async function FeaturedCase() {
  const locale = await getLocale();
  const en = locale === "en";

  const service = createServiceClient();
  const { data } = (await service
    .from("featured_projects")
    .select(
      "title_fr, title_en, location, coordinates, slides, stats, hotspots, quote_fr, quote_en, cite, rows",
    )
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: FeaturedRow | null };

  let content: FeaturedContent | null = null;
  if (data) {
    content = {
      title: en ? data.title_en : data.title_fr,
      location: data.location ?? "",
      coordinates: data.coordinates ?? "",
      slides: asArray<SlideJson>(data.slides).map((s) => ({
        image: s.image ?? "",
        caption: (en ? s.caption_en : s.caption_fr) ?? "",
      })),
      stats: asArray<StatJson>(data.stats).map((s) => ({
        n: Number(s.n ?? 0),
        suf: s.suf ?? "",
        l: (en ? s.l_en : s.l_fr) ?? "",
      })),
      hotspots: asArray<HotspotJson>(data.hotspots).map((h) => ({
        x: Number(h.x ?? 50),
        y: Number(h.y ?? 50),
        t: (en ? h.title_en : h.title_fr) ?? "",
        b: (en ? h.body_en : h.body_fr) ?? "",
      })),
      quote: (en ? data.quote_en : data.quote_fr) ?? "",
      cite: data.cite ?? "",
      rows: asArray<RowJson>(data.rows).map((r) => ({
        k: (en ? r.label_en : r.label_fr) ?? "",
        v: (en ? r.value_en : r.value_fr) ?? "",
      })),
    };
  }

  return <FeaturedCaseView content={content} />;
}
