"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export function Hero() {
  const locale = useLocale();
  const t = useTranslations("hero");
  const bgRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Vidéo de fond en boucle. React ne rend pas l'attribut `muted` côté serveur :
  // on le pose ici avant de lancer la lecture, sinon les navigateurs mobiles
  // refusent l'autoplay. Avec moins d'animations demandées, l'image fixe reste.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  }, []);

  // Subtle parallax on the background.
  useEffect(() => {
    const on = () => {
      if (!bgRef.current) return;
      const y = Math.min(window.scrollY, 800);
      bgRef.current.style.transform = `scale(1.04) translateY(${y * 0.18}px)`;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <section className="hero" id="top">
      <div className="hero-bg" ref={bgRef}>
        <video
          ref={videoRef}
          className="hero-video"
          src="/assets/hero-flux.mp4"
          poster="/assets/hero-flux.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      </div>
      <div className="hero-grain" />

      <div
        className="hero-frame page-edge grid-12"
        style={{ alignContent: "center", flex: 1 }}
      >
        <div style={{ gridColumn: "1 / span 8" }}>
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
      </div>
    </section>
  );
}
