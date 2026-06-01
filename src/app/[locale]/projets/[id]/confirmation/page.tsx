import { createServiceClient } from "@/lib/supabase/service";
import { getLocale, getTranslations } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Project = {
  id: string;
  client_name: string;
  project_type: string;
  project_location: string;
  project_description: string;
};

type MatchReason =
  | { kind: "specialty"; items: string[]; weight: number }
  | { kind: "project_type"; item: string; weight: number }
  | { kind: "availability"; weight: number }
  | { kind: "experience"; years: number; weight: number }
  | { kind: "location"; city: string; weight: number }
  | { kind: "rating"; value: number; weight: number };

type MatchRow = {
  score: number;
  reasons: MatchReason[];
  architect_id: string;
  architect_profiles: {
    full_name: string;
    city: string;
    specialties: string[];
    photo_url: string | null;
  };
};

function reasonLabel(r: MatchReason): string {
  switch (r.kind) {
    case "specialty":   return `Spécialité : ${r.items.join(", ")}`;
    case "project_type":return `Type de projet : ${r.item}`;
    case "availability":return `Disponible immédiatement`;
    case "experience":  return `${r.years} ans d'expérience`;
    case "location":    return `Localisation : ${r.city}`;
    case "rating":      return `Note : ${r.value.toFixed(1)}★`;
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("wizardClient");

  const service = createServiceClient();
  const { data: project } = await service
    .from("client_projects")
    .select("id, client_name, project_type, project_location, project_description")
    .eq("id", id)
    .single() as { data: Project | null };
  if (!project) notFound();

  const { data: matches } = await service
    .from("match_results")
    .select("score, reasons, architect_id, architect_profiles!inner(full_name, city, specialties, photo_url)")
    .eq("project_id", id)
    .order("score", { ascending: false }) as { data: MatchRow[] | null };

  const rows = matches ?? [];

  return (
    <>
      <Nav />
      <section className="page-edge py-32 max-w-[1080px] mx-auto">
        <p className="eyebrow">{t("thanks.eyebrow")}</p>
        <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-6">{t("thanks.title")}</h1>
        <p className="text-concrete-1 mt-6 max-w-[60ch]">{t("thanks.body")}</p>

        <p className="eyebrow mt-12">
          {t("thanks.matches")} <span className="mono ml-2 text-concrete-2">({rows.length})</span>
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
          {rows.map((m) => (
            <article key={m.architect_id} className="border border-[var(--hairline)] p-6 flex gap-6">
              <div className="relative w-24 h-32 bg-paper-2 flex-shrink-0">
                {m.architect_profiles.photo_url && (
                  <Image
                    src={m.architect_profiles.photo_url}
                    alt={m.architect_profiles.full_name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-medium">{m.architect_profiles.full_name}</h3>
                  <span className="mono text-[11px] tracking-[0.18em] text-green whitespace-nowrap">
                    {Math.round((m.score / 90) * 100)}% {t("match")}
                  </span>
                </div>
                <p className="eyebrow mt-1">{m.architect_profiles.city}</p>
                <p className="text-[12px] text-concrete-1 mt-2">{m.architect_profiles.specialties.join(" · ")}</p>
                <ul className="mt-3 space-y-1 text-[12px] mono text-concrete-2">
                  {m.reasons.map((r, i) => (
                    <li key={i}>· {reasonLabel(r)} (+{r.weight})</li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/architectes/${m.architect_id}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs underline"
                >
                  Voir le profil →
                </Link>
              </div>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="text-concrete-1 text-sm col-span-2">
              Aucun architecte ne correspond pour le moment. L&apos;équipe Reliote vous contactera sous 48h.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
