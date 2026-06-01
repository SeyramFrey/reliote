import { signUp } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { role: roleParam } = await searchParams;
  const role = roleParam === "architect" ? "architect" : "client";
  return (
    <main className="page-edge py-32 max-w-[520px] mx-auto">
      <p className="eyebrow">{t("registerEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{role === "architect" ? t("registerArchitectTitle") : t("registerClientTitle")}</h1>
      <form action={signUp} className="mt-10 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="role"   value={role} />
        <label className="block"><span className="eyebrow">{t("fullName")}</span><input name="full_name" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <label className="block"><span className="eyebrow">{t("email")}</span><input name="email" type="email" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <label className="block"><span className="eyebrow">{t("password")}</span><input name="password" type="password" minLength={8} required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("createAccount")}</button>
      </form>
    </main>
  );
}
