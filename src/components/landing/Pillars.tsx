"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/shared/Eyebrow";

const KEYS = ["p1", "p2", "p3", "p4", "p5"] as const;

export function Pillars() {
  const t = useTranslations("pillars");
  const [active, setActive] = useState(0);
  return (
    <section id="approche" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>02 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">
          {t("titlePre")}
          <em className="serif-i">{t("titleItalic")}</em>
        </h2>
        <p className="text-concrete-1 max-w-[60ch] mt-6">{t("kicker")}</p>
        <div
          className="mt-16 grid grid-cols-1 md:grid-cols-5 md:min-h-[420px] border-t border-[var(--hairline)]"
          onMouseLeave={() => setActive(0)}
        >
          {KEYS.map((k, i) => {
            const isActive = i === active;
            return (
              <div
                key={k}
                onMouseEnter={() => setActive(i)}
                className={`relative border-b md:border-b-0 md:border-r border-[var(--hairline)] p-8 transition-[flex] duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? "md:flex-[2] bg-water text-paper" : "md:flex-[1]"}`}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <span
                  className={`mono text-[11px] tracking-[0.18em] uppercase ${isActive ? "text-paper/70" : "text-concrete-2"}`}
                >
                  {t(`${k}.n`)}
                </span>
                <h3 className="font-display text-3xl mt-4">{t(`${k}.t`)}</h3>
                <p
                  className={`mt-3 text-sm leading-relaxed ${isActive ? "text-paper/80" : "text-concrete-1"}`}
                >
                  {t(`${k}.b`)}
                </p>
                {isActive && (
                  <div className="mt-auto pt-8">
                    <span className="font-display text-5xl text-brass">
                      {t(`${k}.statNum`)}
                      <span className="text-2xl text-paper/60">{t(`${k}.statDenom`)}</span>
                    </span>
                    <p className="eyebrow text-paper/60 mt-2">{t(`${k}.statLabel`)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
