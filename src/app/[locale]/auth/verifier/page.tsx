import { resendConfirmation } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "verify" });
}

// Après une inscription quand Supabase exige la confirmation de l'e-mail.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; resent?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { email, resent } = await searchParams;
  return (
    <main className="page-edge py-32 max-w-[520px] mx-auto">
      <p className="eyebrow">{t("verifyEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{t("verifyTitle")}</h1>
      <p className="mt-6 text-concrete-1">
        {email ? t("verifyBody", { email }) : t("verifyBodyNoEmail")}
      </p>
      {resent && <p role="status" className="mt-4 text-sm text-green">{t("resent")}</p>}
      {email && (
        <form action={resendConfirmation} className="mt-8">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="email" value={email} />
          <button className="inline-flex items-center gap-2 px-5 py-3 border border-[var(--hairline)] text-sm hover:border-ink">
            {t("resend")}
          </button>
        </form>
      )}
      <p className="mt-10 text-sm">
        <a href={`/${locale}/auth/login`} className="underline">{t("signIn")}</a>
      </p>
    </main>
  );
}
