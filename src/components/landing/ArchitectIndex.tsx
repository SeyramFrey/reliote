import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/shared/Eyebrow";
import { ArchitectGrid } from "./ArchitectGrid";

export type ArchitectRow = {
  id: string;
  full_name: string;
  city: string;
  specialties: string[];
  project_types: string[];
  years_experience: number;
  photo_url: string | null;
  rating: number | null;
  availability: "available" | "busy" | "unavailable";
  fee_from: string | null;
  languages: string[];
  description: string;
};

export async function ArchitectIndex() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("architect_profiles")
    .select(
      "id, full_name, city, specialties, project_types, years_experience, photo_url, rating, availability, fee_from, languages, description"
    )) as { data: ArchitectRow[] | null };
  const verified = (data ?? []).filter(() => true); // RLS already filters to verified for anon. Defensive no-op.
  const t = await getTranslations("architects");
  return (
    <section id="architectes" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>03 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">
          {t("titlePre")}
          <em className="serif-i">{t("titleItalic")}</em>
        </h2>
        <p className="text-concrete-1 max-w-[60ch] mt-6">{t("kicker")}</p>
        <ArchitectGrid architects={verified} />
      </div>
    </section>
  );
}
