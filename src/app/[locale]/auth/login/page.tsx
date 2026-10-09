import { signIn } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";
import { isAuthErrorCode } from "@/lib/auth/authError";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { next, error, sent } = await searchParams;
  const errorText = error ? (isAuthErrorCode(error) ? t(`errors.${error}`) : error) : null;
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("loginEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{t("loginTitle")}</h1>
      {sent && <p role="status" className="mt-6 text-sm text-green">{t("sent")}</p>}
      {errorText && <p role="alert" className="mt-6 text-sm text-red-700">{errorText}</p>}
      <form action={signIn} className="mt-10 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next || ""} />
        <label className="block">
          <span className="eyebrow">{t("email")}</span>
          <input name="email" type="email" required autoComplete="email" className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
        </label>
        <label className="block">
          <span className="eyebrow">{t("password")}</span>
          <input name="password" type="password" required autoComplete="current-password" className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
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
