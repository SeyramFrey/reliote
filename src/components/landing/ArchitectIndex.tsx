import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { SectionHead } from "./SectionHead";
import { ArchitectGrid } from "./ArchitectGrid";

export type ArchitectRow = {
  id: string;
  first_name: string;
  last_name: string;
  structure: string | null;
  city: string;
  specialties: string[];
  project_types: string[];
  years_experience: number;
  photo_url: string | null;
  rating: number | null;
  availability: "available" | "busy" | "unavailable";
  fee_currency: "EUR" | "XOF" | null;
  fee_amount: number | null;
  ordre_number: string | null;
  diploma: string | null;
  languages: string[];
  description: string;
};

const TRUST_ICONS = ["✓", "★", "⊕", "≡"];

export async function ArchitectIndex() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("architect_profiles")
    .select(
      "id, first_name, last_name, structure, city, specialties, project_types, years_experience, photo_url, rating, availability, fee_currency, fee_amount, ordre_number, diploma, languages, description"
    )) as { data: ArchitectRow[] | null };
  const architects = data ?? [];
  const t = await getTranslations("architects");
  const lt = await getTranslations("landing.architects");
  const trust = lt.raw("trust") as { strong: string; sub: string }[];

  return (
    <section className="sect archi-block" id="architectes">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        kicker={t("kicker")}
      />
      <div className="trust-band">
        {trust.map((it, i) => (
          <div key={i} className="ti">
            <span className="ic">{TRUST_ICONS[i]}</span>
            <span>
              <strong>{it.strong}</strong>
              <br />
              <span>{it.sub}</span>
            </span>
          </div>
        ))}
      </div>
      <ArchitectGrid architects={architects} />
    </section>
  );
}
