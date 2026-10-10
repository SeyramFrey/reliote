import { updatePassword } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayAuthError } from "@/lib/auth/authError";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "reset" });
}

// Atteinte depuis le lien « mot de passe oublié » : le callback a ouvert une
// session de récupération. Sans session, le lien est expiré.
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/forgot?error=expired`);
  const { error } = await searchParams;
  const errorCode = displayAuthError(error);
  const errorText = errorCode ? t(`errors.${errorCode}`) : null;
  const input = "w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green";
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("resetEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{t("resetTitle")}</h1>
      {errorText && <p role="alert" className="mt-6 text-sm text-red-700">{errorText}</p>}
      <form action={updatePassword} className="mt-10 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="block">
          <span className="eyebrow">{t("newPassword")}</span>
          <input name="password" type="password" minLength={8} required autoComplete="new-password" className={input} />
        </label>
        <label className="block">
          <span className="eyebrow">{t("confirmPassword")}</span>
          <input name="confirm" type="password" minLength={8} required autoComplete="new-password" className={input} />
        </label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("savePassword")}</button>
      </form>
    </main>
  );
}
