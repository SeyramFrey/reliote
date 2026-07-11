import { getTranslations } from "next-intl/server";
import { SectionHead } from "./SectionHead";

type Card = {
  tPre: string;
  tItalic: string;
  tRest: string;
  b: string;
  k: string;
  v: string;
};

const TONES = ["ink", "brass", "paper", "paper-2", "green"];
const NUMS = ["01", "02", "03", "04", "05"];

// Approach, in depth — five tinted "grounds" cards (V5-adapted), fifth spans 2 cols.
export async function TerresApproche() {
  const t = await getTranslations("landing.terres");
  const cards = t.raw("cards") as Card[];
  return (
    <section className="sect terres-sect" id="terres">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        titleRest={t("titleRest")}
        kicker={t("kicker")}
      />
      <div className="terres-wrap">
        <div className="terres-grid">
          {cards.map((c, i) => (
            <article
              key={i}
              className={`terre-card terre-${TONES[i]} ${i === 4 ? "is-wide" : ""}`}
            >
              <div className="terre-num">{NUMS[i]}</div>
              <span className="terre-glyph" aria-hidden="true" />
              <h3 className="terre-title">
                {c.tPre}
                <em>{c.tItalic}</em>
                {c.tRest}
              </h3>
              <p className="terre-body">{c.b}</p>
              <div className="terre-stat">
                <span className="k">{c.k}</span>
                <span className="v">{c.v}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
