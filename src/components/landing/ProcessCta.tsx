import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

// Relance juste après le parcours : le visiteur vient de comprendre comment
// ça marche, c'est le moment de lui proposer de commencer.
export async function ProcessCta() {
  const locale = await getLocale();
  const t = await getTranslations("landing.processCta");
  return (
    <div className="page-edge py-14 md:py-16 border-b border-[var(--hairline)] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <p className="max-w-[52ch] text-[15px] leading-relaxed text-concrete-1">{t("lead")}</p>
      <Link href={`/${locale}/projets/initier`} className="btn btn-primary self-start md:self-auto">
        {t("cta")} <span className="btn-arrow" />
      </Link>
    </div>
  );
}
