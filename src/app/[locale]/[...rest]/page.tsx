import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

// Toute URL localisée sans route (/fr/nimporte-quoi) rend la 404 localisée
// de [locale]/not-found.tsx, dans le layout et la langue du site.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors.notFound");
  return { title: t("eyebrow"), robots: { index: false } };
}

export default function CatchAll() {
  notFound();
}
