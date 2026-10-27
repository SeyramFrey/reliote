"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { mfaStepFor } from "@/lib/auth/mfaSession";
import { architectSchema, type ArchitectInput } from "@/lib/validation/architect.schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { appOrigin } from "@/lib/auth/origin";
import { verifyArchitectPhoto } from "@/lib/storage/architectPhoto";
import { sendEmail, adminEmail } from "@/lib/email/client";
import { architectApplicationReceivedEmail, newArchitectAdminEmail } from "@/lib/email/templates";

// Compte porteur ou admin arrivé sur « Rejoindre l'index » : on ferme sa
// session pour qu'il crée un compte architecte (un e-mail = un rôle).
export async function signOutToRegister(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${safeLocale(locale)}/auth/register?role=architect`);
}

export async function submitArchitect(input: ArchitectInput) {
  const parsed = architectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // L'insert passe en clé service (RLS contournée) : on refait ici le contrôle
  // de rôle de la policy « architects owner insert ».
  const service = createServiceClient();
  const { data: profile } = (await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()) as { data: { role: string } | null };
  if (profile?.role !== "architect") {
    return { error: "Ce compte n'est pas un compte architecte. Créez un compte architecte pour déposer un dossier." };
  }
  // Facultative pour un architecte, mais exigée dès qu'il l'a activée.
  if ((await mfaStepFor(supabase, user, profile.role)) !== "ok") {
    return { error: "Validez d'abord votre code de double authentification (reconnectez-vous)." };
  }

  // Disallow duplicate profile rows for the same user (one architect profile per user account)
  const { data: existing } = await service
    .from("architect_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle() as { data: { id: string } | null };
  if (existing) {
    return { error: "Vous avez déjà un dossier architecte en cours. Reliote vous a contacté(e) sous 48h." };
  }

  // Strip non-column fields (`terms`, `phone_country`) and coerce empty strings to null
  // for optional URL/text columns. The phone_country code is informational only — the
  // E.164 `phone` value already carries the country prefix.
  const {
    terms: _terms,
    phone_country: _phone_country,
    photo_url,
    portfolio_url,
    phone,
    structure,
    legal_status,
    company_name,
    legal_form,
    registration_number,
    legal_representative,
    ordre_number,
    diploma,
    fee_currency,
    fee_amount,
    ...rest
  } = parsed.data;

  // La photo a été envoyée directement au Storage par le navigateur : on
  // vérifie qu'elle est dans SON dossier et que ce sont de vrais octets d'image.
  if (photo_url && !(await verifyArchitectPhoto(service, photo_url, user.id))) {
    return { error: "Photo invalide : choisissez un fichier JPEG, PNG ou WebP." };
  }

  const row = {
    ...rest,
    user_id: user.id,
    photo_url: photo_url || null,
    portfolio_url: portfolio_url || null,
    phone: phone || null,
    // Agence : la raison sociale tient aussi lieu de « structure » affichée.
    structure: (legal_status === "company" ? company_name?.trim() : structure) || null,
    legal_status,
    company_name: legal_status === "company" ? company_name?.trim() || null : null,
    legal_form: legal_status === "company" ? legal_form?.trim() || null : null,
    registration_number: legal_status === "company" ? registration_number?.trim() || null : null,
    legal_representative: legal_status === "company" ? legal_representative?.trim() || null : null,
    ordre_number: ordre_number || null,
    diploma: diploma || null,
    fee_currency: fee_currency ?? null,
    fee_amount: fee_amount ?? null,
    // Charte de non-contournement v1 — l'architecte l'a acceptée en cochant
    // la case `terms` au step 6 (la case cumule confirmation des infos +
    // acceptation de la charte). On horodate côté serveur, pas côté client.
    charter_version: "v1",
    charter_signed_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = (await (service.from("architect_profiles") as any)
    .insert(row)
    .select("id")
    .single()) as { data: { id: string } | null; error: { message: string } | null };
  if (error || !inserted) return { error: error?.message ?? "Insert failed" };

  revalidatePath("/fr/architectes");
  revalidatePath("/en/architectes");
  revalidatePath("/fr/admin/architectes");
  revalidatePath("/en/admin/architectes");

  const locale = safeLocale((await cookies()).get("NEXT_LOCALE")?.value);

  // E-mails best-effort : accusé à l'architecte, alerte à l'admin.
  const ack = architectApplicationReceivedEmail(locale, { firstName: parsed.data.first_name });
  const admin = adminEmail();
  const alert = newArchitectAdminEmail({
    name: `${parsed.data.first_name} ${parsed.data.last_name}`,
    country: parsed.data.country,
    adminUrl: `${await appOrigin()}/fr/admin/architectes/${inserted.id}`,
  });
  await Promise.all([
    // Accusé à l'adresse du compte (vérifiée), pas à celle saisie dans le
    // formulaire : sinon le formulaire servirait à écrire à un tiers.
    user.email ? sendEmail({ to: user.email, subject: ack.subject, html: ack.html }) : Promise.resolve(),
    admin ? sendEmail({ to: admin, subject: alert.subject, html: alert.html }) : Promise.resolve(),
  ]);

  redirect(`/${locale}/architectes/rejoindre/merci`);
}
