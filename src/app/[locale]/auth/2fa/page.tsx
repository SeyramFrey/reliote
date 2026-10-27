import { verifyMfa, signOut } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayAuthError } from "@/lib/auth/authError";
import { hasVerifiedFactor, mfaPath } from "@/lib/auth/mfa";
import { sessionAal } from "@/lib/auth/mfaSession";
import { safeLocale, safeRedirectPath } from "@/lib/auth/safeRedirect";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "mfa" });
}

// Deuxième étape de la connexion : le mot de passe est accepté (session aal1),
// le code de l'application d'authentification fait passer la session en aal2.
export default async function MfaChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const locale = safeLocale(await getLocale());
  const t = await getTranslations("mfa");
  const ta = await getTranslations("auth");
  const { next, error } = await searchParams;
  const dest = safeRedirectPath(next ?? null, `/${locale}/dashboard`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login?next=${encodeURIComponent(dest)}`);
  if (!hasVerifiedFactor(user.factors)) redirect(mfaPath("enroll", locale, dest));
  if ((await sessionAal(supabase)) === "aal2") redirect(dest);

  const errorCode = displayAuthError(error);
  const errorText = errorCode ? ta(`errors.${errorCode}`) : null;
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{t("challengeTitle")}</h1>
      <p className="mt-6 text-concrete-1">{t("challengeBody")}</p>
      {errorText && <p role="alert" className="mt-6 text-sm text-red-700">{errorText}</p>}
      <form action={verifyMfa} className="mt-10 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={dest} />
        <label className="block">
          <span className="eyebrow">{t("code")}</span>
          <input
            name="code"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-2xl tracking-[0.4em]"
          />
        </label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("verify")}</button>
      </form>
      <p className="mt-8 text-sm text-concrete-1">{t("lost")}</p>
      <form action={signOut.bind(null, locale)} className="mt-6">
        <button className="text-sm underline underline-offset-4 text-concrete-1 hover:text-ink">{t("signOut")}</button>
      </form>
    </main>
  );
}
