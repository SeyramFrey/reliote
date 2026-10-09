import { forgot } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";
import { displayAuthError } from "@/lib/auth/authError";

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { error } = await searchParams;
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("forgotEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4">{t("forgotTitle")}</h1>
      <p className="mt-4 text-concrete-1">{t("forgotHint")}</p>
      {displayAuthError(error) && <p role="alert" className="mt-6 text-sm text-red-700">{t(`errors.${displayAuthError(error)}`)}</p>}
      <form action={forgot} className="mt-8 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="block"><span className="eyebrow">{t("email")}</span><input name="email" type="email" required autoComplete="email" className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("sendLink")}</button>
      </form>
    </main>
  );
}
