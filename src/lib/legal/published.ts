import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { LEGAL_SLUGS, type LegalSlug } from "./page";

// Pages légales publiées, dans l'ordre du pied de page. Client anon : la
// policy « legal public read » de 0012 ne laisse passer que les pages
// publiées. Dédupliqué par requête (pied de page + formulaire).
export const getPublishedLegalSlugs = cache(async (): Promise<LegalSlug[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("legal_pages").select("slug");
  const available = new Set(((data ?? []) as { slug: string }[]).map((r) => r.slug));
  return LEGAL_SLUGS.filter((s) => available.has(s));
});
