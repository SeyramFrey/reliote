import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export async function CtaBand() {
  const locale = await getLocale();
  const t = await getTranslations("ctaBand");
  return (
    <section className="bg-water text-paper">
      <div className="page-edge py-32 text-center">
        <p className="eyebrow text-paper/60">{t("eyebrow")}</p>
        <h2 className="font-light text-[clamp(40px,6vw,88px)] leading-[1.05] mt-6 max-w-[18ch] mx-auto">
          {t("titlePre")}<em className="serif-i">{t("titleItalic")}</em>
        </h2>
        <Link
          href={`/${locale}/projets/initier`}
          className="mt-10 inline-flex items-center gap-2.5 px-7 py-4 bg-green text-paper text-sm"
        >
          {t("button")}
          <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
        </Link>
      </div>
    </section>
  );
}
