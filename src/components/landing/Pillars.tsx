"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHead } from "./SectionHead";

const KEYS = ["p1", "p2", "p3", "p4", "p5"] as const;
const BGS = [
  "/assets/img-courtyard-pool.jpg",
  "/assets/img-museum-mist.jpg",
  "/assets/img-stairs-water.jpg",
  "/assets/img-redrock-pool.jpg",
  "/assets/img-courtyard-pool.jpg",
];

// Immersive expanding pillars (.pillars-x / .pillar-x) — hover/focus to expand.
export function Pillars() {
  const t = useTranslations("pillars");
  const [active, setActive] = useState(0);
  return (
    <section className="sect" id="approche">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        kicker={t("kicker")}
      />
      <div className="pillars">
        <div className="pillars-x" role="tablist">
          {KEYS.map((k, i) => {
            const isActive = active === i;
            return (
              <article
                key={k}
                className={`pillar-x ${isActive ? "is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                tabIndex={0}
                role="tab"
                aria-selected={isActive}
              >
                <div className="px-tick" />
                <div
                  className="px-bg"
                  style={{ backgroundImage: `url(${BGS[i]})` }}
                />
                <div className="px-grain" />
                <div className="px-num">
                  <span>{t(`${k}.n`)}</span>
                  <span className="glyph" />
                </div>
                <h3 className="px-title">{t(`${k}.t`)}</h3>
                <p className="px-body">{t(`${k}.b`)}</p>
                <div className="px-stat">
                  <div className="px-stat-big">
                    {t(`${k}.statNum`)}
                    <small>{t(`${k}.statDenom`)}</small>
                  </div>
                  <div className="px-stat-lbl">{t(`${k}.statLabel`)}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
