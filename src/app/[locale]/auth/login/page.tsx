import { signIn } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { next } = await searchParams;
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("loginEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{t("loginTitle")}</h1>
      <form action={signIn} className="mt-10 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next || ""} />
        <label className="block">
          <span className="eyebrow">{t("email")}</span>
          <input name="email" type="email" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
        </label>
        <label className="block">
          <span className="eyebrow">{t("password")}</span>
          <input name="password" type="password" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
        </label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("signIn")}</button>
      </form>
      <p className="mt-8 text-sm text-concrete-1">
        <a href={`/${locale}/auth/register`}>{t("noAccount")}</a>
        {" · "}
        <a href={`/${locale}/auth/forgot`}>{t("forgot")}</a>
      </p>
    </main>
  );
}
