import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichTextInput } from "@/components/admin/RichTextInput";
import { sanitizeLegalHtml } from "@/lib/legal/page";
import { saveIssue, sendIssue, sendTestIssue } from "../actions";

type Issue = {
  id: string;
  subject_fr: string;
  subject_en: string;
  body_fr: string;
  body_en: string;
  status: "draft" | "sent";
  sent_at: string | null;
  recipients_count: number;
};

const input =
  "w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-1.5 text-sm outline-none focus:border-green";

export default async function IssueForm({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; test?: string; sent?: string }>;
}) {
  const { id } = await params;
  const { saved, test, sent } = await searchParams;
  const locale = await getLocale();
  const isNew = id === "new";
  const s = createServiceClient();

  let issue: Issue | null = null;
  if (!isNew) {
    const { data } = (await s
      .from("newsletter_issues")
      .select("id, subject_fr, subject_en, body_fr, body_en, status, sent_at, recipients_count")
      .eq("id", id)
      .single()) as { data: Issue | null };
    if (!data) notFound();
    issue = data;
  }
  const { count: audience } = (await s
    .from("newsletter_subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "subscribed")) as { count: number | null };

  const back = (
    <Link href={`/${locale}/admin/newsletter`} className="eyebrow hover:text-ink">
      ← Newsletter
    </Link>
  );

  // Lettre partie : lecture seule, elle fait foi de ce qui a été envoyé.
  if (issue?.status === "sent") {
    return (
      <>
        {back}
        <h1 className="font-light text-4xl mt-4">{issue.subject_fr}</h1>
        <p className="text-concrete-1 text-sm mt-2">
          Envoyée le {issue.sent_at ? new Date(issue.sent_at).toLocaleString("fr-FR") : "—"} à{" "}
          {issue.recipients_count} abonné(s).
        </p>
        {sent !== undefined && (
          <p role="status" className="text-sm text-green mt-4">
            Envoi terminé : {sent} e-mail(s) accepté(s) par le service d&apos;envoi.
          </p>
        )}
        <div
          className="legal-prose mt-10 max-w-[680px]"
          dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(issue.body_fr) }}
        />
      </>
    );
  }

  return (
    <>
      {back}
      <h1 className="font-light text-4xl mt-4">{isNew ? "Nouvelle lettre" : "Éditer la lettre"}</h1>
      {saved && (
        <p role="status" className="text-sm text-green mt-3">
          Brouillon enregistré.
        </p>
      )}
      {test && (
        <p role="status" className="text-sm text-green mt-3">
          Test envoyé à votre adresse (versions FR et EN).
        </p>
      )}

      <form action={saveIssue} className="mt-8 max-w-[820px] space-y-8">
        {!isNew ? <input type="hidden" name="id" value={issue!.id} /> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block">
            <span className="eyebrow">Sujet (FR) *</span>
            <input name="subject_fr" required defaultValue={issue?.subject_fr} className={input} />
          </label>
          <label className="block">
            <span className="eyebrow">Sujet (EN) *</span>
            <input name="subject_en" required defaultValue={issue?.subject_en} className={input} />
          </label>
        </div>
        <RichTextInput name="body_fr" label="Lettre (FR)" defaultValue={issue?.body_fr ?? ""} />
        <RichTextInput name="body_en" label="Lettre (EN)" defaultValue={issue?.body_en ?? ""} />
        <div className="flex gap-3">
          <button className="px-5 py-2 bg-ink text-paper text-sm">Enregistrer le brouillon</button>
          <Link
            href={`/${locale}/admin/newsletter`}
            className="px-5 py-2 border border-[var(--hairline)] text-sm hover:border-ink"
          >
            Annuler
          </Link>
        </div>
      </form>

      {!isNew && (
        <section className="mt-14 pt-8 border-t border-[var(--hairline)] max-w-[820px] space-y-8">
          <div>
            <p className="eyebrow">1 · Tester</p>
            <p className="text-sm text-concrete-1 mt-2 max-w-[60ch]">
              Enregistrez d&apos;abord vos modifications : le test part avec la dernière version
              enregistrée.
            </p>
            <form action={sendTestIssue} className="mt-3">
              <input type="hidden" name="id" value={issue!.id} />
              <button className="px-5 py-2 border border-[var(--hairline)] text-sm hover:border-ink">
                M&apos;envoyer un test
              </button>
            </form>
          </div>
          <div>
            <p className="eyebrow">2 · Envoyer</p>
            <p className="text-sm text-concrete-1 mt-2 max-w-[60ch]">
              {audience ?? 0} abonné(s) confirmé(s) la recevront, chacun dans sa langue, avec un lien
              de désinscription. Une fois envoyée, la lettre n&apos;est plus modifiable.
            </p>
            <form action={sendIssue} className="mt-3 flex flex-wrap items-center gap-4">
              <input type="hidden" name="id" value={issue!.id} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="confirm" value="1" required />
                <span>Je confirme l&apos;envoi à {audience ?? 0} abonné(s)</span>
              </label>
              <button className="px-5 py-2 bg-green text-paper text-sm hover:bg-green-deep">
                Envoyer la lettre
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
