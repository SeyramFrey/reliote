import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { Testimonial } from "@/lib/landing/data";
import { SectionHead } from "./SectionHead";
import { AvisStage, type AvisSlide } from "./AvisStage";

// Avis clients (table testimonials, saisie depuis l'admin). Uniquement de vrais
// avis : sans avis publié, la section affiche un état d'attente, jamais un
// témoignage de repli. La mention sous la scène répond à l'obligation
// d'informer sur le contrôle des avis (art. L111-7-2 du Code de la consommation).

export async function Avis({ items, num }: { items: Testimonial[]; num: string }) {
  const locale = await getLocale();
  const en = locale === "en";
  const t = await getTranslations("landing.avis");

  const slides: AvisSlide[] = items.map((a) => ({
    id: a.id,
    quote: (en ? a.quote_en : a.quote_fr) || a.quote_fr,
    author: a.author,
    role: (en ? a.role_en : a.role_fr) ?? a.role_fr ?? "",
    location: a.location ?? "",
  }));

  return (
    <section className="sect avis-sect" id="avis">
      <SectionHead
        num={num}
        label={t("label")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        kicker={t("kicker")}
      />

      {slides.length > 0 ? (
        <AvisStage
          slides={slides}
          labels={{ prev: t("prev"), next: t("next"), show: t.raw("show") as string }}
        />
      ) : (
        <div className="avis-stage is-empty">
          <div className="avis-index">
            <span className="avis-count">{t("count", { n: 0 })}</span>
          </div>
          <div className="avis-quote">
            <span className="avis-mark" aria-hidden="true">
              “
            </span>
            <p className="avis-text">
              {t("emptyPre")}
              <em>{t("emptyItalic")}</em>
            </p>
            <p className="avis-empty-body">{t("emptyBody")}</p>
            <Link href={`/${locale}/projets/initier`} className="btn btn-ghost avis-empty-cta">
              {t("emptyCta")} <span className="btn-arrow" />
            </Link>
          </div>
        </div>
      )}

      <p className="avis-note">{t("note")}</p>
    </section>
  );
}
