"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { SectionHead } from "./SectionHead";

const SLIDES = [
  "/assets/img-stairs-water.jpg",
  "/assets/img-courtyard-pool.jpg",
  "/assets/img-redrock-pool.jpg",
];
const HOTSPOTS = [
  { x: 28, y: 38 },
  { x: 68, y: 30 },
  { x: 42, y: 72 },
];

function useInView(ref: React.RefObject<HTMLElement | null>, threshold: number) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setSeen(true);
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen, threshold]);
  return seen;
}

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, 0.4);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1500);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);
  return (
    <span ref={ref}>
      {val}
      <small>{suffix}</small>
    </span>
  );
}

type Stat = { n: number; suf: string; l: string };
type Hotspot = { t: string; b: string };

export function FeaturedCase() {
  const locale = useLocale();
  const t = useTranslations("featured");
  const lt = useTranslations("landing.featured");
  const slides = lt.raw("slides") as string[];
  const stats = lt.raw("stats") as Stat[];
  const hotspots = lt.raw("hotspots") as Hotspot[];
  const rows = lt.raw("rows") as Record<string, string>;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setIdx((i) => (i + 1) % SLIDES.length);

  return (
    <section className="sect feat">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        kicker={t("kicker")}
      />
      <div className="feat-frame">
        <div className="feat-stage">
          {SLIDES.map((src, i) => (
            <div
              key={src}
              className={`feat-slide ${i === idx ? "active" : ""}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}

          <div className="stage-corner tl">Rives de la Lagune · Bingerville</div>
          <div className="stage-corner tr">{slides[idx]}</div>
          <div className="stage-corner bl">5.34°N / 3.98°W</div>
          <div className="stage-corner br">
            <span>{String(idx + 1).padStart(2, "0")}</span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ opacity: 0.6 }}>{String(SLIDES.length).padStart(2, "0")}</span>
          </div>

          {idx === 0 &&
            hotspots.map((h, i) => (
              <div
                key={h.t}
                className="hotspot"
                style={{ left: `${HOTSPOTS[i].x}%`, top: `${HOTSPOTS[i].y}%` }}
                aria-label={h.t}
              >
                <div className="hotspot-tip">
                  <span className="ht">{h.t}</span>
                  {h.b}
                </div>
              </div>
            ))}

          <button className="arrow prev" onClick={prev} aria-label="Previous">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 2 L4 8 L10 14" />
            </svg>
          </button>
          <button className="arrow next" onClick={next} aria-label="Next">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2 L12 8 L6 14" />
            </svg>
          </button>

          <div className="pager">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={i === idx ? "on" : ""}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="feat-counters">
          {stats.map((s, i) => (
            <div key={i} className="feat-counter">
              <div className="n">
                <Counter target={s.n} suffix={s.suf} />
              </div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="feat-grid-2">
          <div>
            <blockquote className="feat-quote">{t("quote")}</blockquote>
            <div className="feat-quote-cite">{t("cite")}</div>
            <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href={`/${locale}/projets/initier`}
                className="btn btn-ghost on-dark"
                style={{ color: "var(--paper)", borderColor: "rgba(243,241,236,0.3)" }}
              >
                {lt("read")} <span className="btn-arrow" />
              </Link>
              <Link
                href={`/${locale}/projets/initier`}
                className="btn btn-primary"
                style={{ background: "var(--paper)", color: "var(--ink)" }}
              >
                {lt("startSimilar")} <span className="btn-arrow" />
              </Link>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "stretch" }}>
            <div className="feat-row">
              <span className="k">{rows.client}</span>
              <span className="v">{rows.clientV}</span>
            </div>
            <div className="feat-row">
              <span className="k">{rows.arch}</span>
              <span className="v">{rows.archV}</span>
            </div>
            <div className="feat-row">
              <span className="k">{rows.program}</span>
              <span className="v">{rows.programV}</span>
            </div>
            <div className="feat-row">
              <span className="k">{rows.site}</span>
              <span className="v">{rows.siteV}</span>
            </div>
            <div className="feat-row">
              <span className="k">{rows.duration}</span>
              <span className="v">{rows.durationV}</span>
            </div>
            <div className="feat-row">
              <span className="k">{rows.budget}</span>
              <span className="v">{rows.budgetV}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
