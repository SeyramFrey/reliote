import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export async function Audiences() {
  const locale = await getLocale();
  const t = await getTranslations("audiences");
  const ks = ["client", "architect"] as const;
  return (
    <section id="apropos" className="bg-paper">
      <div className="page-edge py-32 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
        {ks.map((k) => (
          <article key={k} className="border border-[var(--hairline)] p-6 md:p-10 flex flex-col">
            <p className="eyebrow">{t(`${k}.eyebrow`)}</p>
            <h3 className="font-light text-4xl mt-4 leading-tight">{t(`${k}.title`)}</h3>
            <p className="text-concrete-1 mt-4">{t(`${k}.body`)}</p>
            <Link
              href={k === "client" ? `/${locale}/projets/initier` : `/${locale}/architectes/rejoindre`}
              className="mt-auto pt-8 inline-flex items-center gap-2 text-sm"
            >
              {t(`${k}.cta`)}
              <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
