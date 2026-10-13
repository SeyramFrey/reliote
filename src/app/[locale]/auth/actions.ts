"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { safeLocale, safeRedirectPath } from "@/lib/auth/safeRedirect";
import { signUpOutcome } from "@/lib/auth/signUpOutcome";
import { dashboardPathFor } from "@/lib/auth/roles";
import { appOrigin } from "@/lib/auth/origin";
import { authErrorCodeFrom } from "@/lib/auth/authError";
import { recoveryTokenFrom } from "@/lib/auth/recoveryToken";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const locale = safeLocale(formData.get("locale"));
  const nextRaw = formData.get("next") as string | null;
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const code = error.code === "email_not_confirmed" ? "unconfirmed" : "invalid";
    const keepNext = nextRaw ? `&next=${encodeURIComponent(nextRaw)}` : "";
    redirect(`/${locale}/auth/login?error=${code}${keepNext}`);
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single<{ role: string }>();
  if (prof?.role === "admin") redirect(`/${locale}/admin`);
  redirect(safeRedirectPath(nextRaw, dashboardPathFor(prof?.role, locale)));
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const role = String(formData.get("role")) === "architect" ? "architect" : "client";
  const first_name = String(formData.get("first_name") || "").trim();
  const last_name = String(formData.get("last_name") || "").trim();
  const locale = safeLocale(formData.get("locale"));
  // Après confirmation de l'e-mail, on reprend là où l'inscription menait.
  const resume = role === "architect" ? `/${locale}/architectes/rejoindre` : `/${locale}/projets/initier`;
  const res = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, first_name, last_name, locale },
      emailRedirectTo: `${await appOrigin()}/${locale}/auth/callback?next=${encodeURIComponent(resume)}`,
    },
  });
  const outcome = signUpOutcome(res);
  switch (outcome.kind) {
    case "signed_in":
      redirect(resume);
    case "needs_confirmation":
      redirect(`/${locale}/auth/verifier?email=${encodeURIComponent(email)}`);
    case "already_registered":
      redirect(`/${locale}/auth/login?error=exists`);
    case "error":
      redirect(`/${locale}/auth/register?role=${role}&error=${encodeURIComponent(outcome.message)}`);
  }
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${safeLocale(locale)}`);
}

export async function forgot(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const locale = safeLocale(formData.get("locale"));
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await appOrigin()}/${locale}/auth/callback?type=recovery`,
  });
  redirect(`/${locale}/auth/login?sent=1`);
}

// Lien « mot de passe oublié » (page /auth/confirm) : on n'échange le jeton
// qu'au clic, pour qu'un scanner d'e-mails qui ouvre le lien ne le consomme pas.
export async function confirmRecovery(formData: FormData) {
  const locale = safeLocale(formData.get("locale"));
  const tokenHash = recoveryTokenFrom(formData.get("token_hash") as string | null, "recovery");
  if (!tokenHash) redirect(`/${locale}/auth/forgot?error=expired`);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (error) redirect(`/${locale}/auth/forgot?error=expired`);
  redirect(`/${locale}/auth/reset`);
}

// Fin du parcours « mot de passe oublié » : la session de récupération a été
// ouverte par le callback ou par confirmRecovery ; on fixe le nouveau mot de passe.
export async function updatePassword(formData: FormData) {
  const locale = safeLocale(formData.get("locale"));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) redirect(`/${locale}/auth/reset?error=short`);
  if (password !== confirm) redirect(`/${locale}/auth/reset?error=mismatch`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/forgot?error=expired`);

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/${locale}/auth/reset?error=${encodeURIComponent(authErrorCodeFrom(error))}`);

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  redirect(dashboardPathFor(prof?.role, locale));
}

// Renvoi du lien de confirmation d'inscription.
export async function resendConfirmation(formData: FormData) {
  const locale = safeLocale(formData.get("locale"));
  const email = String(formData.get("email") ?? "");
  if (email) {
    const supabase = await createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${await appOrigin()}/${locale}/auth/callback` },
    });
  }
  redirect(`/${locale}/auth/verifier?email=${encodeURIComponent(email)}&resent=1`);
}
