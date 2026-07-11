"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export function Hero() {
  const locale = useLocale();
  const t = useTranslations("hero");
  const lt = useTranslations("landing.hero");
  const bgRef = useRef<HTMLDivElement>(null);

  // Subtle parallax on the background image.
  useEffect(() => {
    const on = () => {
      if (!bgRef.current) return;
      const y = Math.min(window.scrollY, 800);
      bgRef.current.style.transform = `scale(1.04) translateY(${y * 0.18}px)`;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const trust = lt.raw("trust") as { k: string; v: string }[];

  return (
    <section className="hero" id="top">
      <div
        className="hero-bg"
        ref={bgRef}
        style={{ backgroundImage: "url(/assets/img-courtyard-pool.jpg)" }}
      />
      <div className="hero-grain" />

      <div className="hero-corner tl">
        <span className="val">{lt("ref")}</span>
      </div>
      <div className="hero-corner br">
        <span className="label">{lt("updatedLabel")}</span>
        <span className="val">{lt("updatedVal")}</span>
      </div>

      <Link
        href={`/${locale}#architectes`}
        className="hero-spotlight"
        aria-label={lt("spotlightTitle")}
      >
        <div
          className="thumb"
          style={{ backgroundImage: "url(/assets/img-courtyard-pool.jpg)" }}
        />
        <div className="meta">
          <span className="lbl">
            <span className="live-dot" />
            {lt("spotlightLabel")}
          </span>
          <span className="title">{lt("spotlightTitle")}</span>
          <span className="sub">{lt("spotlightSub")}</span>
        </div>
        <span className="open-arrow" />
      </Link>

      <div
        className="hero-frame page-edge grid-12"
        style={{ alignContent: "center", flex: 1 }}
      >
        <div style={{ gridColumn: "1 / span 8" }}>
          <div
            className="eyebrow"
            style={{ color: "rgba(243,241,236,0.62)", marginBottom: 28 }}
          >
            {t("eyebrow")}
          </div>
          <h1 className="hero-headline">
            {t("titlePre")}
            <em>{t("titleItalic")}</em>
            <br />
            {t("titleRest")}
          </h1>
          <p className="hero-sub">{t("sub")}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href={`/${locale}/projets/initier`}
              className="btn btn-primary"
              style={{ background: "var(--paper)", color: "var(--ink)" }}
            >
              {t("primary")} <span className="btn-arrow" />
            </Link>
            <a href="#architectes" className="btn btn-ghost on-dark">
              {t("secondary")} <span className="btn-arrow" />
            </a>
          </div>
        </div>

        <aside
          style={{ gridColumn: "10 / span 3", alignSelf: "end", marginBottom: 8 }}
        >
          <div
            className="eyebrow"
            style={{ color: "rgba(243,241,236,0.62)", marginBottom: 14 }}
          >
            {lt("trustEyebrow")}
          </div>
          <div style={{ borderTop: "1px solid rgba(243,241,236,0.16)" }}>
            {trust.map((r) => (
              <div
                key={r.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(243,241,236,0.12)",
                  fontSize: 13,
                  color: "rgba(243,241,236,0.85)",
                }}
              >
                <span
                  style={{
                    color: "rgba(243,241,236,0.55)",
                    fontFamily: "var(--f-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {r.k}
                </span>
                <span>{r.v}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
