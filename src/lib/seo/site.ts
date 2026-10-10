import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { isLegalSlug } from "@/lib/legal/page";

// URL canonique du site, pour metadataBase, le sitemap et robots.txt.
// SITE_URL fait foi ; à défaut, le domaine de production Vercel — y compris
// sur une préproduction, pour que les URL canoniques désignent toujours la
// production et pas un déploiement éphémère.
export function resolveSiteUrl(o: { siteUrl?: string; vercelProdUrl?: string }): string {
  if (o.siteUrl) return o.siteUrl.replace(/\/+$/, "");
  if (o.vercelProdUrl) return `https://${o.vercelProdUrl}`;
  return "http://localhost:3000";
}

export function siteUrl(): string {
  return resolveSiteUrl({
    siteUrl: process.env.SITE_URL,
    vercelProdUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });
}

// Pages publiques indexables, hors pages légales (ajoutées si publiées).
// Les espaces connectés, l'authentification et l'admin n'y figurent pas.
export const PUBLIC_PATHS = ["", "/projets/initier"] as const;

export function buildSitemap(
  base: string,
  legal: { slug: string; updated_at: string }[],
  now: Date,
): MetadataRoute.Sitemap {
  const entry = (path: string, lastModified: Date) =>
    locales.map((l) => ({
      url: `${base}/${l}${path}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(locales.map((x) => [x, `${base}/${x}${path}`])),
      },
    }));

  return [
    ...PUBLIC_PATHS.flatMap((p) => entry(p, now)),
    ...legal
      .filter((r) => isLegalSlug(r.slug))
      .flatMap((r) => entry(`/legal/${r.slug}`, new Date(r.updated_at))),
  ];
}
