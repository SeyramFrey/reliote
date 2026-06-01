import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";

export default async function Page() {
  const locale = await getLocale();
  const t = await getTranslations("wizardArchitect");
  return (
    <>
      <Nav />
      <section className="page-edge py-32 max-w-[640px] mx-auto">
        <p className="eyebrow">{t("thanks.eyebrow")}</p>
        <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-6">{t("thanks.title")}</h1>
        <p className="text-concrete-1 mt-6">{t("thanks.body")}</p>
        <Link
          href={`/${locale}/dashboard/architecte`}
          className="mt-10 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm"
        >
          {t("thanks.cta")}
          <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
        </Link>
      </section>
      <Footer />
    </>
  );
}
