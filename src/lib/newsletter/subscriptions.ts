import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/client";
import { newsletterConfirmEmail } from "@/lib/email/templates";
import { nextSubscription, normalizeEmail, type SubscriberStatus } from "./email";

// Inscriptions à la newsletter (table newsletter_subscribers, 0021). Toujours
// par le client service : la table n'a aucune policy publique.

export type NewsletterSource = "footer" | "register" | "project" | "dashboard";

type Row = {
  id: string;
  status: SubscriberStatus;
  confirm_token: string;
  unsubscribe_token: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => createServiceClient().from("newsletter_subscribers") as any;

/**
 * Inscrit une adresse. `verified` : l'adresse est celle d'un compte connecté,
 * déjà prouvée — pas de double opt-in. Sinon un e-mail de confirmation part.
 * Ne lève pas pour une adresse invalide : renvoie "invalid".
 */
export async function subscribe(args: {
  email: unknown;
  locale: string;
  source: NewsletterSource;
  origin: string;
  userId?: string | null;
  verified?: boolean;
}): Promise<"invalid" | "error" | "pending" | "subscribed"> {
  const email = normalizeEmail(args.email);
  if (!email) return "invalid";
  const locale = args.locale === "en" ? "en" : "fr";

  const { data: existing } = (await table()
    .select("id, status, confirm_token, unsubscribe_token")
    .eq("email", email)
    .maybeSingle()) as { data: Row | null };

  const next = nextSubscription(existing?.status ?? null, Boolean(args.verified));
  const now = new Date().toISOString();
  const patch = {
    locale,
    status: next.status,
    ...(args.userId ? { user_id: args.userId } : {}),
    ...(next.status === "subscribed" && existing?.status !== "subscribed"
      ? { confirmed_at: now, unsubscribed_at: null }
      : {}),
    // Un nouveau lien invalide l'ancien.
    ...(next.sendConfirmation ? { confirm_token: crypto.randomUUID() } : {}),
  };

  const { data: row, error } = (await (existing
    ? table().update(patch).eq("id", existing.id)
    : table().insert({ email, source: args.source, ...patch })
  )
    .select("confirm_token")
    .single()) as { data: { confirm_token: string } | null; error: { message: string } | null };
  if (error || !row) {
    console.error("[newsletter] inscription non enregistrée :", error?.message);
    return "error";
  }

  if (next.sendConfirmation) {
    const confirmUrl = `${args.origin}/${locale}/newsletter/confirmer?token=${row.confirm_token}`;
    const mail = newsletterConfirmEmail(locale, { confirmUrl });
    await sendEmail({ to: email, ...mail });
  }
  return next.status === "subscribed" ? "subscribed" : "pending";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Clic sur le lien de confirmation. */
export async function confirmSubscription(token: unknown): Promise<boolean> {
  const t = String(token ?? "");
  if (!UUID.test(t)) return false;
  const { data } = (await table()
    .update({ status: "subscribed", confirmed_at: new Date().toISOString(), unsubscribed_at: null })
    .eq("confirm_token", t)
    .neq("status", "unsubscribed")
    .select("id")) as { data: { id: string }[] | null };
  return (data?.length ?? 0) > 0;
}

/** Désinscription en un clic (lien de chaque lettre, ou en-tête List-Unsubscribe). */
export async function unsubscribeByToken(token: unknown): Promise<boolean> {
  const t = String(token ?? "");
  if (!UUID.test(t)) return false;
  const { data } = (await table()
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", t)
    .select("id")) as { data: { id: string }[] | null };
  return (data?.length ?? 0) > 0;
}

/** État de l'abonnement d'un compte, pour le tableau de bord. */
export async function subscriptionFor(email: string | null | undefined): Promise<SubscriberStatus | null> {
  const e = normalizeEmail(email);
  if (!e) return null;
  const { data } = (await table().select("status").eq("email", e).maybeSingle()) as {
    data: { status: SubscriberStatus } | null;
  };
  return data?.status ?? null;
}

/** Désabonnement depuis le tableau de bord (compte connecté). */
export async function unsubscribeEmail(email: string | null | undefined): Promise<void> {
  const e = normalizeEmail(email);
  if (!e) return;
  await table()
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("email", e);
}
