"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { appOrigin } from "@/lib/auth/origin";
import {
  confirmSubscription,
  subscribe,
  unsubscribeByToken,
  unsubscribeEmail,
} from "@/lib/newsletter/subscriptions";

export type FooterSubscribeState = {
  status: "idle" | "pending" | "subscribed" | "invalid" | "error";
  /** Adresse saisie, rendue au champ quand il faut la corriger. */
  email?: string;
};

// Formulaire du pied de page. Le champ « website » est un pot de miel : rempli,
// c'est un robot, on fait comme si tout allait bien sans rien enregistrer.
export async function subscribeFromFooter(
  _prev: FooterSubscribeState,
  formData: FormData,
): Promise<FooterSubscribeState> {
  if (String(formData.get("website") ?? "")) return { status: "pending" };
  const status = await subscribe({
    email: formData.get("email"),
    locale: safeLocale(formData.get("locale")),
    source: "footer",
    origin: await appOrigin(),
  });
  return { status, email: String(formData.get("email") ?? "") };
}

// Confirmation et désinscription passent par un bouton (POST) : un scanner
// d'e-mails qui ouvre le lien ne doit ni confirmer ni désinscrire à la place
// du destinataire.
export async function confirmNewsletter(formData: FormData) {
  const locale = safeLocale(formData.get("locale"));
  const ok = await confirmSubscription(formData.get("token"));
  redirect(`/${locale}/newsletter/confirmer?${ok ? "done=1" : "error=1"}`);
}

export async function unsubscribeNewsletter(formData: FormData) {
  const locale = safeLocale(formData.get("locale"));
  const ok = await unsubscribeByToken(formData.get("token"));
  redirect(`/${locale}/newsletter/desinscription?${ok ? "done=1" : "error=1"}`);
}

// Interrupteur du tableau de bord : le compte est connecté, son adresse est
// prouvée, l'abonnement est donc immédiat.
export async function setDashboardNewsletter(formData: FormData) {
  const locale = safeLocale(formData.get("locale"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/${locale}/auth/login`);

  if (String(formData.get("on")) === "1") {
    await subscribe({
      email: user.email,
      locale,
      source: "dashboard",
      origin: await appOrigin(),
      userId: user.id,
      verified: true,
    });
  } else {
    await unsubscribeEmail(user.email);
  }
  revalidatePath(`/${locale}/dashboard/client`);
  revalidatePath(`/${locale}/dashboard/architecte`);
}
