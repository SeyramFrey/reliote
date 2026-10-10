import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { buildSitemap, siteUrl } from "@/lib/seo/site";

// Régénéré toutes les heures : une page légale publiée depuis l'admin y entre
// sans redéploiement.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let legal: { slug: string; updated_at: string }[] = [];
  try {
    const { data } = await createServiceClient()
      .from("legal_pages")
      .select("slug, updated_at")
      .eq("published", true);
    legal = (data ?? []) as typeof legal;
  } catch {
    // Base injoignable au build : on publie au moins les pages publiques.
  }
  return buildSitemap(siteUrl(), legal, new Date());
}
