"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SectionHead } from "./SectionHead";

const STEPS = ["s1", "s2", "s3", "s4"] as const;

// Interactive, auto-advancing process timeline (.timeline-rail / .tl-step).
export function Process() {
  const t = useTranslations("process");
  const lt = useTranslations("landing.process");
  const locale = useLocale();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 4200);
    return () => clearInterval(id);
  }, [inView]);

  const fill = inView ? ((active + 1) / STEPS.length) * 100 : 0;

  return (
    <section className="sect" id="projets">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        kicker={t("kicker")}
      />
      <div className="timeline">
        <div
          className="timeline-rail"
          ref={railRef}
          style={{ ["--rail-fill"]: `${fill}%` } as React.CSSProperties}
        >
          {STEPS.map((k, i) => {
            const passed = i < active;
            const isActive = i === active;
            const deliverables = t.raw(`${k}.deliverables`) as string[];
            return (
              <button
                key={k}
                className={`tl-step ${isActive ? "active" : ""} ${passed ? "passed" : ""}`}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-current={isActive}
              >
                <span className="tl-dot" />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    paddingRight: 14,
                  }}
                >
                  <span className="tl-num">{t(`${k}.n`)}</span>
                  <span className="tl-days">{t(`${k}.days`)}</span>
                </div>
                <h3 className="tl-title">{t(`${k}.t`)}</h3>
                <p className="tl-body">{t(`${k}.b`)}</p>
                <p className="tl-verb">— {t(`${k}.verb`)}</p>
                <ul className="tl-deliv">
                  {deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        <div className="tl-progress-overlay">
          <span className="pulse">
            <span className="pdot" />
            {lt("live")} — {String(active + 1).padStart(2, "0")} /{" "}
            {String(STEPS.length).padStart(2, "0")}
          </span>
          <span>{lt("pin")}</span>
          <button onClick={() => router.push(`/${locale}/projets/initier`)}>
            {lt("startNow")}
          </button>
        </div>
      </div>
    </section>
  );
}
