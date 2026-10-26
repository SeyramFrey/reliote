import { getLocale, getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo/metadata";
import { unsubscribeNewsletter } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "newsletter" });
}

// Lien « Se désinscrire » de chaque lettre : un seul bouton, sans connexion.
export default async function UnsubscribeNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("newsletter");
  const { token, done, error } = await searchParams;

  return (
    <main className="page-edge py-32 max-w-[560px] mx-auto">
      <p className="eyebrow">{t("eyebrow")}</p>
      {done ? (
        <>
          <h1 className="font-light text-5xl mt-4 leading-tight">{t("unsubscribedTitle")}</h1>
          <p className="mt-6 text-concrete-1">{t("unsubscribedBody")}</p>
        </>
      ) : error || !token ? (
        <>
          <h1 className="font-light text-5xl mt-4 leading-tight">{t("linkInvalidTitle")}</h1>
          <p className="mt-6 text-concrete-1">{t("linkInvalidBody")}</p>
        </>
      ) : (
        <>
          <h1 className="font-light text-5xl mt-4 leading-tight">{t("unsubscribeTitle")}</h1>
          <p className="mt-6 text-concrete-1">{t("unsubscribeBody")}</p>
          <form action={unsubscribeNewsletter} className="mt-8">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="token" value={token} />
            <button className="inline-flex items-center gap-2 px-5 py-3 border border-[var(--hairline)] text-sm hover:border-ink">
              {t("unsubscribeButton")}
            </button>
          </form>
        </>
      )}
      <p className="mt-10 text-sm">
        <a href={`/${locale}`} className="underline">{t("backHome")}</a>
      </p>
    </main>
  );
}
