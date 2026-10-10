import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/lib/i18n/config";
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

// Balises canonical + hreflang d'une page publique, en chemins relatifs
// (résolus contre metadataBase). Le français sert de version par défaut.
export function localizedAlternates(locale: string, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${defaultLocale}${path}`,
    },
  };
}

// Seule l'API est bloquée. Les pages privées (auth, espaces connectés, admin,
// accusés de dépôt) portent un noindex : les bloquer ici empêcherait Google de
// le lire, et une URL bloquée mais liée peut quand même être indexée.
export function buildRobots(base: string, indexable: boolean): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}

// Image de partage générée par app/[locale]/opengraph-image.tsx. À répéter
// dans tout `openGraph` de page : Next fusionne superficiellement, un
// openGraph de page remplace celui du layout, image comprise.
export function ogImage(locale: string) {
  return { url: `/${locale}/opengraph-image`, width: 1200, height: 630, alt: "Reliote" };
}
