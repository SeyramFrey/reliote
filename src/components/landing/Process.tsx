"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/shared/Eyebrow";

const STEPS = ["s1", "s2", "s3", "s4"] as const;

export function Process() {
  const t = useTranslations("process");
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <section id="processus" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>04 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">
          {t("titlePre")}
          <em className="serif-i">{t("titleItalic")}</em>
        </h2>
        <p className="text-concrete-1 max-w-[60ch] mt-6">{t("kicker")}</p>
        <div className="relative mt-16">
          <div className="hidden md:block absolute left-0 right-0 top-[44px] h-px bg-[var(--hairline)]" />
          <div
            className="hidden md:block absolute left-0 top-[44px] h-px bg-green transition-[width] duration-[800ms]"
            style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--gutter)]">
            {STEPS.map((k, i) => {
              const isActive = i === active;
              return (
                <button
                  key={k}
                  onClick={() => setActive(i)}
                  className={`text-left pt-12 relative ${isActive ? "" : "opacity-70"}`}
                >
                  <span
                    className={`absolute -top-1 left-0 inline-block w-3 h-3 rounded-full ${isActive ? "bg-brass animate-pulse" : "bg-concrete-3"}`}
                  />
                  <span className="eyebrow">
                    {t(`${k}.n`)} · {t(`${k}.days`)}
                  </span>
                  <h3 className="font-display text-3xl mt-2">{t(`${k}.t`)}</h3>
                  <p className="serif-i text-concrete-1 mt-3">{t(`${k}.verb`)}</p>
                  <p className="mt-4 text-sm text-concrete-1">{t(`${k}.b`)}</p>
                  <ul className="mt-5 space-y-1.5 text-[12px] mono text-concrete-2">
                    {(t.raw(`${k}.deliverables`) as string[]).map((d) => (
                      <li key={d}>· {d}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
