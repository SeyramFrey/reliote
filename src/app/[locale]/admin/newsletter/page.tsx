import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { deleteIssue } from "./actions";

type IssueRow = {
  id: string;
  subject_fr: string;
  status: "draft" | "sent";
  sent_at: string | null;
  recipients_count: number;
};
type SubRow = { email: string; status: string; source: string; locale: string; created_at: string };

const STATUS_LABEL: Record<string, string> = {
  subscribed: "Abonné",
  pending: "En attente",
  unsubscribed: "Désinscrit",
};

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

export default async function AdminNewsletter() {
  const locale = await getLocale();
  const s = createServiceClient();
  const count = (status: string) =>
    s
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", status) as unknown as Promise<{ count: number | null }>;

  const [{ data: issuesData }, { data: subsData }, subscribed, pending, unsubscribed] = await Promise.all([
    s
      .from("newsletter_issues")
      .select("id, subject_fr, status, sent_at, recipients_count")
      .order("created_at", { ascending: false }) as unknown as Promise<{ data: IssueRow[] | null }>,
    s
      .from("newsletter_subscribers")
      .select("email, status, source, locale, created_at")
      .order("created_at", { ascending: false })
      .limit(200) as unknown as Promise<{ data: SubRow[] | null }>,
    count("subscribed"),
    count("pending"),
    count("unsubscribed"),
  ]);
  const issues = issuesData ?? [];
  const subs = subsData ?? [];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Admin · Newsletter</p>
          <h1 className="font-light text-4xl mt-4">{subscribed.count ?? 0} abonnés</h1>
          <p className="text-concrete-1 text-sm mt-2">
            {pending.count ?? 0} en attente de confirmation · {unsubscribed.count ?? 0} désinscrits
          </p>
        </div>
        <Link href={`/${locale}/admin/newsletter/new`} className="px-4 py-2 bg-ink text-paper text-sm">
          Nouvelle lettre
        </Link>
      </div>

      <h2 className="eyebrow mt-12">Lettres</h2>
      {issues.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-4 max-w-[60ch]">
          Aucune lettre. Rédigez-en une, envoyez-vous un test, puis envoyez-la aux abonnés confirmés.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-[var(--hairline)]">
                <th className="eyebrow py-3">Sujet</th>
                <th className="eyebrow">Statut</th>
                <th className="eyebrow">Envoyée</th>
                <th className="eyebrow">Destinataires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.id} className="border-b border-[var(--hairline-soft)]">
                  <td className="py-4 pr-4">{i.subject_fr}</td>
                  <td>
                    <span
                      className={`mono uppercase text-[11px] tracking-[0.18em] ${
                        i.status === "sent" ? "text-green" : "text-concrete-2"
                      }`}
                    >
                      {i.status === "sent" ? "Envoyée" : "Brouillon"}
                    </span>
                  </td>
                  <td className="text-concrete-1">{date(i.sent_at)}</td>
                  <td className="mono">{i.status === "sent" ? i.recipients_count : "—"}</td>
                  <td className="text-right">
                    <div className="flex justify-end items-center gap-3">
                      <Link className="underline text-[13px]" href={`/${locale}/admin/newsletter/${i.id}`}>
                        {i.status === "sent" ? "Voir" : "Éditer"}
                      </Link>
                      {i.status === "draft" && (
                        <form action={deleteIssue}>
                          <input type="hidden" name="id" value={i.id} />
                          <button className="underline text-[13px] text-red-700">Suppr.</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="eyebrow mt-14">Derniers inscrits</h2>
      {subs.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-4">Aucun inscrit pour l&apos;instant.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-[var(--hairline)]">
                <th className="eyebrow py-3">E-mail</th>
                <th className="eyebrow">Statut</th>
                <th className="eyebrow">Origine</th>
                <th className="eyebrow">Langue</th>
                <th className="eyebrow">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((r) => (
                <tr key={r.email} className="border-b border-[var(--hairline-soft)]">
                  <td className="py-3 pr-4">{r.email}</td>
                  <td>{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="text-concrete-1">{r.source}</td>
                  <td className="mono uppercase text-[11px]">{r.locale}</td>
                  <td className="text-concrete-1">{date(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
