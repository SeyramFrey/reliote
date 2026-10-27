import { getTranslations } from "next-intl/server";
import { SectionHead } from "./SectionHead";

type Item = { q: string; a: string };

// Questions avant de s'engager : prix, paiement, anonymat, pays, statut de
// la plateforme. <details> natif : lisible sans JavaScript, au clavier comme
// au lecteur d'écran.
export async function Faq({ num }: { num: string }) {
  const t = await getTranslations("landing.faq");
  const items = t.raw("items") as Item[];

  return (
    <section className="sect" id="faq">
      <SectionHead
        num={num}
        label={t("label")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        kicker={t("kicker")}
      />
      <div className="page-edge">
        <div className="max-w-[880px] md:ml-[16.666%] border-t border-[var(--hairline)]">
          {items.map((item) => (
            <details key={item.q} className="group border-b border-[var(--hairline)]">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-[clamp(18px,1.6vw,22px)] font-light leading-snug [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-xl leading-none text-concrete-1 transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[68ch] pb-7 text-[15px] leading-relaxed text-concrete-1">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
