import "server-only";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { localizedAlternates, ogImage } from "./site";

type PageKey =
  | "project"
  | "join"
  | "joinThanks"
  | "login"
  | "register"
  | "forgot"
  | "reset"
  | "verify"
  | "confirmation"
  | "dashboard"
  | "admin";

// Métadonnées d'une page : titre (gabarit « … — Reliote » du layout),
// description, Open Graph. Une page publique reçoit canonical + hreflang ;
// une page privée (espaces connectés, auth, accusés) est exclue de l'index.
export async function pageMetadata(o: {
  locale: string;
  page: PageKey;
  /** Chemin public sans la locale, p. ex. "/projets/initier". Absent = noindex. */
  path?: string;
}): Promise<Metadata> {
  const locale = safeLocale(o.locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t(`pages.${o.page}.title`);
  const description = t.has(`pages.${o.page}.description`)
    ? t(`pages.${o.page}.description`)
    : t("description");
  const openGraph = {
    type: "website" as const,
    siteName: "Reliote",
    locale: locale === "en" ? "en_GB" : "fr_FR",
    title: `${title} — Reliote`,
    description,
    images: [ogImage(locale)],
  };

  if (o.path === undefined) {
    return { title, description, openGraph, robots: { index: false, follow: false } };
  }
  return {
    title,
    description,
    alternates: localizedAlternates(locale, o.path),
    openGraph: { ...openGraph, url: `/${locale}${o.path}` },
  };
}
