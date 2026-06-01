import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { ArchitectRow } from "@/components/landing/ArchitectIndex";

type Profile = ArchitectRow & {
  status: string;
  portfolio_url: string | null;
  country: string;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = (await supabase
    .from("architect_profiles")
    .select("full_name, city")
    .eq("id", id)
    .single()) as { data: { full_name: string; city: string } | null };
  return { title: data ? `${data.full_name} — Reliote` : "Reliote" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: a } = (await supabase
    .from("architect_profiles")
    .select("*")
    .eq("id", id)
    .single()) as { data: Profile | null };
  if (!a || a.status !== "verified") notFound();
  return (
    <>
      <Nav />
      <main className="pt-24 page-edge py-16 grid grid-cols-12 gap-[var(--gutter)]">
        <aside className="col-span-12 md:col-span-5">
          {a.photo_url && (
            <div className="relative aspect-[4/5]">
              <Image
                src={a.photo_url}
                alt={a.full_name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 40vw, 100vw"
              />
            </div>
          )}
        </aside>
        <section className="col-span-12 md:col-span-7">
          <p className="eyebrow">{a.city}</p>
          <h1 className="font-light text-6xl mt-2 leading-tight">{a.full_name}</h1>
          <p className="text-concrete-1 mt-4">{a.specialties.join(" · ")}</p>
          <p className="mt-8">{a.description}</p>
          <dl className="mt-10 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="eyebrow">Expérience</dt>
              <dd>{a.years_experience} ans</dd>
            </div>
            <div>
              <dt className="eyebrow">Note</dt>
              <dd>{a.rating?.toFixed(1)}★</dd>
            </div>
            <div>
              <dt className="eyebrow">Langues</dt>
              <dd>{a.languages.join(", ")}</dd>
            </div>
            <div>
              <dt className="eyebrow">Honoraires</dt>
              <dd>{a.fee_from ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="eyebrow">Portfolio</dt>
              <dd>
                {a.portfolio_url ? (
                  <a className="underline" href={a.portfolio_url} target="_blank" rel="noopener noreferrer">
                    {a.portfolio_url}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <Footer />
    </>
  );
}
