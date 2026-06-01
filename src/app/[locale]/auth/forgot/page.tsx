import { forgot } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";

export default async function ForgotPage() {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("forgotEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4">{t("forgotTitle")}</h1>
      <p className="mt-4 text-concrete-1">{t("forgotHint")}</p>
      <form action={forgot} className="mt-8 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="block"><span className="eyebrow">{t("email")}</span><input name="email" type="email" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("sendLink")}</button>
      </form>
    </main>
  );
}
