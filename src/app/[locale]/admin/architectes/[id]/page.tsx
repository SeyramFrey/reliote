import { createServiceClient } from "@/lib/supabase/service";
import { architectPhotoSrc } from "@/lib/storage/architectPhoto";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setArchitectStatus } from "../actions";
import { ARCHITECT_STATUS_FR } from "@/lib/workflow/labels";
import { openAdmissionThread } from "@/lib/messaging/actions";
import { AccountMfa } from "@/components/admin/AccountMfa";

type Architect = {
  id: string;
  first_name: string;
  last_name: string;
  structure: string | null;
  legal_status: "individual" | "company";
  company_name: string | null;
  legal_form: string | null;
  registration_number: string | null;
  legal_representative: string | null;
  email: string;
  phone: string | null;
  country: string;
  city: string;
  ordre_number: string;
  diploma: string | null;
  years_experience: number;
  specialties: string[];
  project_types: string[];
  languages: string[];
  fee_currency: string | null;
  fee_amount: number | null;
  portfolio_url: string | null;
  photo_url: string | null;
  description: string;
  availability: string;
  status: "pending" | "verified" | "rejected" | "paused";
  anon_handle: string | null;
  charter_version: string | null;
  charter_signed_at: string | null;
  created_at: string;
  user_id: string | null;
};

const dateFr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "—");

// Fiche de vérification : tout ce que l'admin doit contrôler avant de rendre
// un profil proposable (diplôme, numéro d'ordre, identité, portfolio).
export default async function AdminArchitectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const service = createServiceClient();
  const { data: a } = (await service
    .from("architect_profiles")
    .select(
      "id, user_id, first_name, last_name, structure, legal_status, company_name, legal_form, registration_number, legal_representative, email, phone, country, city, ordre_number, diploma, years_experience, specialties, project_types, languages, fee_currency, fee_amount, portfolio_url, photo_url, description, availability, status, anon_handle, charter_version, charter_signed_at, created_at",
    )
    .eq("id", id)
    .single()) as { data: Architect | null };
  if (!a) notFound();
  const photoSrc = await architectPhotoSrc(service, a.photo_url);

  const fee =
    a.fee_amount && a.fee_currency
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: a.fee_currency, maximumFractionDigits: 0 }).format(a.fee_amount)
      : "—";
  const portfolio = a.portfolio_url && /^https?:\/\//i.test(a.portfolio_url) ? a.portfolio_url : null;

  return (
    <>
      <Link href={`/${locale}/admin/architectes`} className="eyebrow hover:text-ink">
        ← Tous les architectes
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-light text-4xl">
          {a.first_name} {a.last_name}
          <span className="ml-3 mono text-[13px] text-concrete-2">{a.anon_handle}</span>
        </h1>
        <span className="mono uppercase text-[11px] tracking-[0.18em] text-green">{ARCHITECT_STATUS_FR[a.status]}</span>
      </div>
      <form action={openAdmissionThread} className="mt-4">
        <input type="hidden" name="architectId" value={a.id} />
        <button className="px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink">
          Conversation « dossier d&apos;admission »
        </button>
      </form>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
        <div>
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt={`${a.first_name} ${a.last_name}`} className="w-full aspect-[4/5] object-cover" />
          ) : (
            <div className="w-full aspect-[4/5] grid place-items-center border border-[var(--hairline)] text-concrete-2 text-sm">
              Pas de photo
            </div>
          )}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm">
          <Field
            label="Statut juridique"
            value={a.legal_status === "company" ? "Personne morale (agence)" : "Personne physique"}
          />
          <Field
            label={a.legal_status === "company" ? "N° d'ordre de la société" : "N° d'ordre"}
            value={a.ordre_number}
            mono
          />
          {a.legal_status === "company" ? (
            <>
              <Field label="Raison sociale" value={a.company_name ?? "—"} />
              <Field label="Forme juridique" value={a.legal_form ?? "—"} />
              <Field label="Immatriculation" value={a.registration_number ?? "—"} mono />
              <Field label="Représentant légal" value={a.legal_representative ?? "—"} />
            </>
          ) : (
            <Field label="Structure" value={a.structure ?? "—"} />
          )}
          <Field label="Diplôme" value={a.diploma ?? "—"} />
          <Field label="Ville · Pays" value={`${a.city} · ${a.country}`} />
          <Field label="E-mail" value={a.email} />
          <Field label="Téléphone" value={a.phone ?? "—"} />
          <Field label="Expérience" value={`${a.years_experience} ans`} />
          <Field label="Disponibilité" value={a.availability} />
          <Field label="Spécialités" value={a.specialties.join(" · ") || "—"} />
          <Field label="Types de projet" value={a.project_types.join(" · ") || "—"} />
          <Field label="Langues" value={a.languages.join(" · ") || "—"} />
          <Field label="Honoraires à partir de" value={fee} />
          <div>
            <dt className="eyebrow">Portfolio</dt>
            <dd className="mt-1">
              {portfolio ? (
                <a href={portfolio} target="_blank" rel="noopener noreferrer" className="underline break-all">
                  {portfolio}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <Field
            label="Charte"
            value={a.charter_version ? `${a.charter_version} · signée le ${dateFr(a.charter_signed_at)}` : "Non signée"}
          />
          <Field label="Dossier déposé le" value={dateFr(a.created_at)} />
        </dl>
      </section>

      <section className="mt-8 border-t border-[var(--hairline)] pt-6">
        <p className="eyebrow">Présentation</p>
        <p className="mt-2 text-sm text-concrete-1 whitespace-pre-line max-w-[75ch]">{a.description}</p>
      </section>

      <AccountMfa userId={a.user_id} returnTo={`/${locale}/admin/architectes/${a.id}`} />

      <div className="mt-10 flex flex-wrap gap-3">
        {a.status !== "verified" && (
          <form action={setArchitectStatus.bind(null, a.id, "verified")}>
            <button className="px-4 py-2 bg-ink text-paper text-sm">Valider le dossier</button>
          </form>
        )}
        {a.status !== "rejected" && (
          <form action={setArchitectStatus.bind(null, a.id, "rejected")}>
            <button className="px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink">Refuser</button>
          </form>
        )}
        {a.status === "verified" && (
          <form action={setArchitectStatus.bind(null, a.id, "paused")}>
            <button className="px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink">Mettre en pause</button>
          </form>
        )}
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className={`mt-1 ${mono ? "mono" : ""}`}>{value}</dd>
    </div>
  );
}
