"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { appOrigin } from "@/lib/auth/origin";
import { sendBatch, sendEmail, type BatchEmail } from "@/lib/email/client";
import { newsletterIssueEmail } from "@/lib/email/templates";
import { sanitizeLegalHtml } from "@/lib/legal/page";

async function locale(): Promise<string> {
  return (await cookies()).get("NEXT_LOCALE")?.value || "fr";
}

function revalidateNewsletter(id?: string): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/newsletter`);
    if (id) revalidatePath(`/${l}/admin/newsletter/${id}`);
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const issues = () => createServiceClient().from("newsletter_issues") as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subscribers = () => createServiceClient().from("newsletter_subscribers") as any;

type Issue = {
  id: string;
  subject_fr: string;
  subject_en: string;
  body_fr: string;
  body_en: string;
  status: "draft" | "sent";
};

function parse(fd: FormData) {
  return {
    subject_fr: str(fd, "subject_fr"),
    subject_en: str(fd, "subject_en"),
    body_fr: String(fd.get("body_fr") ?? ""),
    body_en: String(fd.get("body_en") ?? ""),
    updated_at: new Date().toISOString(),
  };
}

export async function saveIssue(fd: FormData): Promise<void> {
  await requireAdmin();
  const row = parse(fd);
  if (!row.subject_fr || !row.subject_en) throw new Error("Sujet FR et EN requis");
  const id = str(fd, "id");
  let savedId = id;
  if (id) {
    // Une lettre envoyée n'est plus modifiable : elle fait foi de ce qui est parti.
    await issues().update(row).eq("id", id).eq("status", "draft");
  } else {
    const { data } = (await issues().insert(row).select("id").single()) as { data: { id: string } | null };
    savedId = data?.id ?? "";
  }
  revalidateNewsletter(savedId);
  redirect(`/${await locale()}/admin/newsletter/${savedId}?saved=1`);
}

export async function deleteIssue(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  await issues().delete().eq("id", id).eq("status", "draft");
  revalidateNewsletter();
}

function render(issue: Issue, loc: "fr" | "en", unsubscribeUrl: string) {
  const subject = (loc === "en" ? issue.subject_en : issue.subject_fr) || issue.subject_fr;
  const body = (loc === "en" ? issue.body_en : issue.body_fr) || issue.body_fr;
  return newsletterIssueEmail(loc, { subject, bodyHtml: sanitizeLegalHtml(body), unsubscribeUrl });
}

async function load(id: string): Promise<Issue> {
  const { data } = (await issues()
    .select("id, subject_fr, subject_en, body_fr, body_en, status")
    .eq("id", id)
    .single()) as { data: Issue | null };
  if (!data) throw new Error("Lettre introuvable");
  return data;
}

// Test : les deux versions (FR puis EN) à l'adresse de l'admin connecté.
export async function sendTestIssue(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  const issue = await load(id);
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user?.email) throw new Error("Adresse admin introuvable");
  const origin = await appOrigin();
  for (const loc of ["fr", "en"] as const) {
    const mail = render(issue, loc, `${origin}/${loc}/newsletter/desinscription`);
    await sendEmail({ to: user.email, subject: `[TEST ${loc.toUpperCase()}] ${mail.subject}`, html: mail.html });
  }
  redirect(`/${await locale()}/admin/newsletter/${id}?test=1`);
}

// Envoi à tous les abonnés confirmés, chacun dans sa langue et avec son lien
// de désinscription. La lettre passe d'abord en « envoyée » (une seule fois,
// même si le bouton est cliqué deux fois), puis les e-mails partent par lots.
export async function sendIssue(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (str(fd, "confirm") !== "1") throw new Error("Cochez la confirmation avant d'envoyer");

  const { data: claimed } = (await issues()
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft")
    .select("id, subject_fr, subject_en, body_fr, body_en, status")) as { data: Issue[] | null };
  const issue = claimed?.[0];
  if (!issue) redirect(`/${await locale()}/admin/newsletter/${id}`);

  // Lecture paginée : PostgREST plafonne à 1 000 lignes par requête.
  const recipients: { email: string; locale: string; unsubscribe_token: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = (await subscribers()
      .select("email, locale, unsubscribe_token")
      .eq("status", "subscribed")
      .order("created_at", { ascending: true })
      .range(from, from + 999)) as { data: typeof recipients | null };
    recipients.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const origin = await appOrigin();
  const emails: BatchEmail[] = recipients.map((r) => {
    const loc = r.locale === "en" ? "en" : "fr";
    const unsubscribeUrl = `${origin}/${loc}/newsletter/desinscription?token=${r.unsubscribe_token}`;
    return {
      to: r.email,
      ...render(issue, loc, unsubscribeUrl),
      headers: {
        "List-Unsubscribe": `<${origin}/api/newsletter/unsubscribe?token=${r.unsubscribe_token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });
  const sent = await sendBatch(emails);
  await issues().update({ recipients_count: sent }).eq("id", id);

  revalidateNewsletter(id);
  redirect(`/${await locale()}/admin/newsletter/${id}?sent=${sent}`);
}
