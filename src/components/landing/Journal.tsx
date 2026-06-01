import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/shared/Eyebrow";

export async function Journal() {
  const t = await getTranslations("journal");
  const items = ["j1", "j2", "j3"] as const;
  return (
    <section id="journal" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>07 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] mt-6">{t("title")}</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-[var(--gutter)] border-t border-[var(--hairline)] pt-8">
          {items.map((k) => (
            <article key={k} className="flex flex-col gap-3">
              <span className="eyebrow">{t(`${k}.date`)} · {t(`${k}.read`)}</span>
              <h3 className="font-display text-3xl leading-snug">{t(`${k}.title`)}</h3>
              <p className="text-concrete-1 text-sm">{t(`${k}.excerpt`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
