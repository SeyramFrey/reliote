import { getTranslations } from "next-intl/server";
import { SectionHead } from "./SectionHead";

const KEYS = ["j1", "j2", "j3"] as const;
const IMGS = [
  "/assets/img-museum-mist.jpg",
  "/assets/img-redrock-pool.jpg",
  "/assets/img-stairs-water.jpg",
];

export async function Journal() {
  const j = await getTranslations("journal");
  const lj = await getTranslations("landing.journal");
  const cards = lj.raw("cards") as { pre: string; italic: string }[];

  return (
    <section className="sect" id="journal" style={{ background: "var(--paper-2)" }}>
      <SectionHead
        num={j("eyebrow")}
        titlePre={lj("titlePre")}
        titleItalic={lj("titleItalic")}
        kicker={lj("kicker")}
      />
      <div className="journal-grid">
        {KEYS.map((k, i) => (
          <article key={k} className="j-card">
            <div className="j-meta">
              <span>{j(`${k}.read`)}</span>
              <span>{j(`${k}.date`)}</span>
            </div>
            <div
              className="j-img"
              style={{ backgroundImage: `url(${IMGS[i]})` }}
            />
            <h3 className="j-title">
              {cards[i].pre}
              <em>{cards[i].italic}</em>
            </h3>
            <p className="j-excerpt">{j(`${k}.excerpt`)}</p>
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {lj("more")}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
