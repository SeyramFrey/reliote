"use server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { safeLocale, safeRedirectPath } from "@/lib/auth/safeRedirect";
import { signUpOutcome } from "@/lib/auth/signUpOutcome";
import { dashboardPathFor } from "@/lib/auth/roles";
import { appOrigin } from "@/lib/auth/origin";
import { authErrorCodeFrom } from "@/lib/auth/authError";
import { recoveryTokenFrom } from "@/lib/auth/recoveryToken";
import { subscribe } from "@/lib/newsletter/subscriptions";
import { clientIp, rateLimitAll } from "@/lib/security/rateLimit";
import { hasVerifiedFactor, mfaPath, mfaStep } from "@/lib/auth/mfa";
import { authCaptcha, captchaToken } from "@/lib/security/captcha.server";

const lower = (email: string) => email.trim().toLowerCase();

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const locale = safeLocale(formData.get("locale"));
  const nextRaw = formData.get("next") as string | null;
  // Anti force brute : par IP et par compte visé.
  const ip = await clientIp();
  const keepNext = nextRaw ? `&next=${encodeURIComponent(nextRaw)}` : "";
  if (!(await rateLimitAll([[`login:ip:${ip}`, 30, 900], [`login:email:${lower(email)}`, 10, 900]]))) {
    redirect(`/${locale}/auth/login?error=rateLimited${keepNext}`);
  }
  const captcha = await authCaptcha(captchaToken(formData));
  if (!captcha.ok) redirect(`/${locale}/auth/login?error=captcha${keepNext}`);
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken: captcha.captchaToken },
  });
  if (error) {
    const code =
      error.code === "email_not_confirmed" ? "unconfirmed" : error.code === "captcha_failed" ? "captcha" : "invalid";
    redirect(`/${locale}/auth/login?error=${code}${keepNext}`);
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single<{ role: string }>();
  const dest =
    prof?.role === "admin" ? `/${locale}/admin` : safeRedirectPath(nextRaw, dashboardPathFor(prof?.role, locale));
  // Session neuve, mot de passe seul (aal1) : code à six chiffres, ou activation
  // de la double authentification si le rôle l'exige et qu'aucun facteur n'existe.
  const step = mfaStep({ role: prof?.role, aal: "aal1", factors: data.user.factors });
  redirect(step === "ok" ? dest : mfaPath(step, locale, dest));
}

// Deuxième étape de la connexion : le code de l'application d'authentification.
export async function verifyMfa(formData: FormData) {
  const locale = safeLocale(formData.get("locale"));
  const nextRaw = String(formData.get("next") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");
  const retry = (error: string) =>
    redirect(`/${locale}/auth/2fa?error=${error}${nextRaw ? `&next=${encodeURIComponent(nextRaw)}` : ""}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);
  // Six chiffres, un million de combinaisons : on borne les essais par compte.
  if (!(await rateLimitAll([[`mfa:user:${user.id}`, 10, 900]]))) retry("rateLimited");
  if (!/^\d{6}$/.test(code)) retry("mfaCode");

  const factor = (user.factors ?? []).find((f) => f.status === "verified" && f.factor_type === "totp");
  if (!factor) redirect(mfaPath("enroll", locale, nextRaw || `/${locale}/dashboard`));
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) retry("mfaCode");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
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
  // Compte porteur sans projet : on l'accueille sur son tableau de bord.
  const accountOnly = role === "client" && String(formData.get("intent")) === "account";
  // Après confirmation de l'e-mail, on reprend là où l'inscription menait.
  const resume =
    role === "architect"
      ? `/${locale}/architectes/rejoindre`
      : accountOnly
        ? `/${locale}/dashboard/client`
        : `/${locale}/projets/initier`;
  const back = (error: string) =>
    redirect(`/${locale}/auth/register?role=${role}${accountOnly ? "&intent=account" : ""}&error=${error}`);
  if (!(await rateLimitAll([[`signup:ip:${await clientIp()}`, 10, 3600]]))) back("rateLimited");
  const captcha = await authCaptcha(captchaToken(formData));
  if (!captcha.ok) back("captcha");
  const origin = await appOrigin();
  const res = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken: captcha.captchaToken,
      data: { role, first_name, last_name, locale },
      emailRedirectTo: `${origin}/${locale}/auth/callback?next=${encodeURIComponent(resume)}`,
    },
  });
  const outcome = signUpOutcome(res);
  // Newsletter cochée : inscription en attente de confirmation (double opt-in),
  // seulement si le compte a bien été créé.
  if (formData.get("newsletter") && (outcome.kind === "signed_in" || outcome.kind === "needs_confirmation")) {
    await subscribe({ email, locale, source: "register", origin, userId: outcome.userId });
  }
  switch (outcome.kind) {
    case "signed_in":
      redirect(resume);
    case "needs_confirmation":
      redirect(`/${locale}/auth/verifier?email=${encodeURIComponent(email)}`);
    case "already_registered":
      redirect(`/${locale}/auth/login?error=exists`);
    case "error":
      redirect(
        `/${locale}/auth/register?role=${role}${accountOnly ? "&intent=account" : ""}&error=${encodeURIComponent(outcome.message)}`,
      );
  }
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${safeLocale(locale)}`);
}

// Flux implicite, pas PKCE : le lien PKCE ne marche que dans le navigateur qui a
// fait la demande. Ici la session revient dans le fragment de l'URL, lue par
// RecoveryHashHandler, quel que soit l'appareil qui ouvre l'e-mail. (Avec un
// SMTP personnalisé, le modèle supabase/templates/recovery.html mène plutôt à
// /auth/confirm.)
export async function forgot(formData: FormData) {
  const email = String(formData.get("email"));
  const locale = safeLocale(formData.get("locale"));
  // Au-delà, on répond comme si l'e-mail était parti : ni bombardement d'une
  // boîte tierce, ni indice sur l'existence du compte.
  if (!(await rateLimitAll([[`forgot:ip:${await clientIp()}`, 10, 3600], [`forgot:email:${lower(email)}`, 3, 3600]]))) {
    redirect(`/${locale}/auth/login?sent=1`);
  }
  const captcha = await authCaptcha(captchaToken(formData));
  if (!captcha.ok) redirect(`/${locale}/auth/forgot?error=captcha`);
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false } },
  );
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await appOrigin()}/${locale}/auth/login`,
    captchaToken: captcha.captchaToken,
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

  // Compte protégé par la double authentification : le lien e-mail seul ne
  // suffit pas à changer le mot de passe (GoTrue l'exige aussi).
  if (hasVerifiedFactor(user.factors)) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect(mfaPath("challenge", locale, `/${locale}/auth/reset`));
  }
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
  const allowed =
    !!email &&
    (await rateLimitAll([[`resend:ip:${await clientIp()}`, 10, 3600], [`resend:email:${lower(email)}`, 3, 3600]]));
  if (allowed) {
    const captcha = await authCaptcha(captchaToken(formData));
    if (!captcha.ok) redirect(`/${locale}/auth/verifier?email=${encodeURIComponent(email)}&error=captcha`);
    const supabase = await createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${await appOrigin()}/${locale}/auth/callback`, captchaToken: captcha.captchaToken },
    });
  }
  redirect(`/${locale}/auth/verifier?email=${encodeURIComponent(email)}&resent=1`);
}
