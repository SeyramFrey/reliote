import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";
import { Hairline } from "@/components/shared/Hairline";

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");
  return (
    <footer className="bg-paper-2 text-ink mt-32">
      <div className="page-edge py-20">
        <div className="grid grid-cols-12 gap-[var(--gutter)] items-start">
          <div className="col-span-12 md:col-span-4">
            <BrandMark />
            <p className="text-sm text-concrete-1 mt-6 max-w-[36ch]">
              {t("tagline")}
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="eyebrow mb-4">{t("explore")}</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/architectes`}>
                  {navT("architects")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/projets/initier`}>{navT("cta")}</Link>
              </li>
              <li>
                <Link href={`/${locale}/architectes/rejoindre`}>
                  {t("joinAsArchitect")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="eyebrow mb-4">{t("account")}</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/auth/login`}>{t("login")}</Link>
              </li>
              <li>
                <Link href={`/${locale}/auth/register`}>{t("register")}</Link>
              </li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-2 mono text-[10px] tracking-[0.18em] uppercase text-concrete-2">
            <p>48°51′24″N — PARIS</p>
            <p>5°20′08″N — ABIDJAN</p>
          </div>
        </div>
        <div className="my-10">
          <Hairline />
        </div>
        <div className="flex flex-wrap justify-between text-[11px] mono uppercase tracking-[0.18em] text-concrete-2">
          <span>© {new Date().getFullYear()} Reliote</span>
          <span>{t("colophon")}</span>
        </div>
      </div>
    </footer>
  );
}
