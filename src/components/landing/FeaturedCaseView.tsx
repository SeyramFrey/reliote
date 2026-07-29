"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { SectionHead } from "./SectionHead";

// Vue interactive de l'étude de cas. Alimentée soit par le contenu géré en base
// (prop `content`, bloc D), soit — si aucune ligne publiée — par le contenu i18n
// d'origine (fallback). Toute l'interactivité (slideshow, compteurs) est ici.

const FALLBACK_SLIDES = [
  "/assets/img-stairs-water.jpg",
  "/assets/img-courtyard-pool.jpg",
  "/assets/img-redrock-pool.jpg",
];
const FALLBACK_HOTSPOTS = [
  { x: 28, y: 38 },
  { x: 68, y: 30 },
  { x: 42, y: 72 },
];

export type FeaturedContent = {
  title: string;
  location: string;
  coordinates: string;
  slides: { image: string; caption: string }[];
  stats: { n: number; suf: string; l: string }[];
  hotspots: { x: number; y: number; t: string; b: string }[];
  quote: string;
  cite: string;
  rows: { k: string; v: string }[];
};

type Stat = { n: number; suf: string; l: string };
type HotspotI18n = { t: string; b: string };

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

export function FeaturedCaseView({ content }: { content?: FeaturedContent | null }) {
  const locale = useLocale();
  const t = useTranslations("featured");
  const lt = useTranslations("landing.featured");

  // ── Données effectives : base (content) ou fallback i18n ─────────────────
  const dbSlides = content && content.slides.length > 0 ? content.slides : null;
  const slideImages = dbSlides ? dbSlides.map((s) => s.image) : FALLBACK_SLIDES;
  const slideCaptions = dbSlides
    ? dbSlides.map((s) => s.caption)
    : (lt.raw("slides") as string[]);

  const stats = content ? content.stats : (lt.raw("stats") as Stat[]);

  const hotspots = content
    ? content.hotspots
    : (lt.raw("hotspots") as HotspotI18n[]).map((h, i) => ({
        ...h,
        x: FALLBACK_HOTSPOTS[i]?.x ?? 50,
        y: FALLBACK_HOTSPOTS[i]?.y ?? 50,
      }));

  const rows: { k: string; v: string }[] = content
    ? content.rows
    : (() => {
        const r = lt.raw("rows") as Record<string, string>;
        return [
          { k: r.client, v: r.clientV },
          { k: r.arch, v: r.archV },
          { k: r.program, v: r.programV },
          { k: r.site, v: r.siteV },
          { k: r.duration, v: r.durationV },
          { k: r.budget, v: r.budgetV },
        ];
      })();

  const quote = content ? content.quote : t("quote");
  const cite = content ? content.cite : t("cite");
  const titleItalic = content ? content.title : t("titleItalic");
  const cornerTl = content ? content.location : "Rives de la Lagune · Bingerville";
  const cornerBl = content ? content.coordinates : "5.34°N / 3.98°W";

  const count = slideImages.length;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count]);

  const prev = () => setIdx((i) => (i - 1 + count) % count);
  const next = () => setIdx((i) => (i + 1) % count);

  return (
    <section className="sect feat">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={titleItalic}
        kicker={t("kicker")}
      />
      <div className="feat-frame">
        <div className="feat-stage">
          {slideImages.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`feat-slide ${i === idx ? "active" : ""}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}

          <div className="stage-corner tl">{cornerTl}</div>
          <div className="stage-corner tr">{slideCaptions[idx] ?? ""}</div>
          <div className="stage-corner bl">{cornerBl}</div>
          <div className="stage-corner br">
            <span>{String(idx + 1).padStart(2, "0")}</span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ opacity: 0.6 }}>{String(count).padStart(2, "0")}</span>
          </div>

          {idx === 0 &&
            hotspots.map((h, i) => (
              <div
                key={`${h.t}-${i}`}
                className="hotspot"
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
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
            {slideImages.map((_, i) => (
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
            <blockquote className="feat-quote">{quote}</blockquote>
            <div className="feat-quote-cite">{cite}</div>
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
            {rows.map((row, i) => (
              <div key={i} className="feat-row">
                <span className="k">{row.k}</span>
                <span className="v">{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
