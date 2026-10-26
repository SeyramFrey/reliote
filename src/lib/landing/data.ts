import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import type { FeaturedRow } from "./featured";

// Lectures de la landing, partagées entre sections et dédupliquées par requête
// (React cache) : le bandeau de chiffres, la Sélection et la carte lisent les
// mêmes architectes vérifiés. Client service (server-only, contourne la RLS de
// 0007) : seuls des agrégats sortent d'ici vers le rendu, jamais une ligne
// architecte identifiable.

export type VerifiedArchitect = {
  country: string | null;
  city: string;
  diploma: string | null;
  specialties: string[];
};

export const getVerifiedArchitects = cache(async (): Promise<VerifiedArchitect[]> => {
  const { data } = (await createServiceClient()
    .from("architect_profiles")
    .select("country, city, diploma, specialties")
    .eq("status", "verified")) as { data: VerifiedArchitect[] | null };
  return data ?? [];
});

export const getFeaturedRow = cache(async (): Promise<FeaturedRow | null> => {
  const { data } = (await createServiceClient()
    .from("featured_projects")
    .select(
      "title_fr, title_en, location, coordinates, slides, stats, hotspots, quote_fr, quote_en, cite, rows",
    )
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: FeaturedRow | null };
  return data;
});

export type MediaItem = {
  id: string;
  title_fr: string;
  title_en: string;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  image_url: string | null;
  read_time: string | null;
  date: string | null;
  url: string | null;
};

export const getPublishedMedia = cache(async (): Promise<MediaItem[]> => {
  const { data } = (await createServiceClient()
    .from("media_items")
    .select("id, title_fr, title_en, excerpt_fr, excerpt_en, image_url, read_time, date, url")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: MediaItem[] | null };
  return data ?? [];
});

export type Testimonial = {
  id: string;
  quote_fr: string;
  quote_en: string;
  author: string;
  role_fr: string | null;
  role_en: string | null;
  location: string | null;
};

// Tant que la migration 0019 n'est pas appliquée, la requête échoue : data vaut
// null et la section Avis reste sur son état d'attente.
export const getPublishedTestimonials = cache(async (): Promise<Testimonial[]> => {
  const { data } = (await createServiceClient()
    .from("testimonials")
    .select("id, quote_fr, quote_en, author, role_fr, role_en, location")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: Testimonial[] | null };
  return data ?? [];
});
