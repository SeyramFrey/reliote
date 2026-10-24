"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { markSeenThisTab } from "@/lib/intro/gate";
import { INTRO_DURATION } from "@/lib/intro/timeline";
import { readyVerdict } from "@/lib/intro/readiness";
import { introFrame } from "@/lib/intro/frame";
import { introLayout } from "@/lib/intro/layout";
import { IntroWordmark, letterProgress } from "./IntroWordmark";

// `ssr: false` n'est autorisé que dans un Client Component — en Server
// Component, Next lève une erreur. C'est la raison pour laquelle le chargement
// différé de la scène vit ici et pas dans la page.
const MonogramScene = dynamic(
  () => import("./MonogramScene").then((m) => m.MonogramScene),
  { ssr: false },
);

/** Durée d'un tour de boucle de l'acte 1, tant que les assets ne sont pas prêts. */
const LOOP_SPAN = 2.0;
/** Bornes de l'acte 4, pour pouvoir le sauter quand la vidéo manque. */
const VIDEO_START = 4.4;
const VIDEO_SPAN = 2.2;

export function IntroOverlay({ onFinish }: { onFinish: () => void }) {
  const t = useTranslations("intro");
  const rootRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef(0);
  const coreReadyRef = useRef(false);
  const videoReadyRef = useRef(false);
  const finishRef = useRef(onFinish);

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const doc = document.documentElement;
    doc.dataset.intro = "playing";

    // Le focus ne doit pas partir se perdre dans la page masquée.
    const page = document.getElementById("page-zoom");
    page?.setAttribute("inert", "");

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      markSeenThisTab(window.sessionStorage);
      finishRef.current();
    }

    // Échappement dès la première seconde, avant même que le bouton n'apparaisse.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);

    const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-letter]"));

    let released = false;
    let releaseT = 0;
    let releaseAt = 0;
    const startedAt = performance.now();
    let raf = 0;

    function frame(now: number) {
      const elapsed = (now - startedAt) / 1000;
      const verdict = readyVerdict({
        coreReady: coreReadyRef.current,
        videoReady: videoReadyRef.current,
        elapsed,
      });

      // L'acte 1 boucle tant que le cœur n'est pas prêt, puis le temps repart
      // d'où il en était : la spirale ne saute pas.
      let time: number;
      if (!released) {
        const cycle = elapsed % LOOP_SPAN;
        if (verdict.leaveLoop) {
          released = true;
          releaseT = cycle;
          releaseAt = now;
        }
        time = cycle;
      } else {
        time = releaseT + (now - releaseAt) / 1000;
      }

      // Vidéo absente : on saute l'acte 4 plutôt que de montrer un écran noir.
      if (!verdict.includeVideoAct && time > VIDEO_START) time += VIDEO_SPAN;

      progressRef.current = time;

      for (const el of letters) {
        const p = letterProgress(time, Number(el.dataset.letter));
        el.style.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
        el.style.transform = `translateY(${(1 - p) * 0.12}em)`;
      }

      const f = introFrame({ time, includeVideoAct: verdict.includeVideoAct });

      if (wordRef.current) wordRef.current.style.opacity = String(f.wordOpacity);
      if (gridRef.current) gridRef.current.style.opacity = String(f.gridOpacity);

      const video = videoRef.current;
      if (video) {
        if (f.playVideo && video.paused && video.readyState >= 2) {
          void video.play().catch(() => {});
        }
        video.style.opacity = String(f.videoOpacity);
      }

      skipRef.current?.classList.toggle("is-shown", f.skipShown);

      // La page réelle grandit depuis le fond pendant que le calque s'efface.
      doc.style.setProperty("--intro-zoom", String(f.zoom));
      root!.style.opacity = String(f.overlayOpacity);

      if (time >= INTRO_DURATION) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      page?.removeAttribute("inert");
      delete doc.dataset.intro;
      doc.style.removeProperty("--intro-zoom");
    };
  }, []);

  // La mise en page du lockup suit le format : le calque porte la classe, la
  // scène mesure de son côté — les deux lisent la même loi.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const apply = () => {
      const stacked = introLayout(root.clientWidth / root.clientHeight).lockup === "empile";
      root.classList.toggle("is-stacked", stacked);
      const video = videoRef.current;
      const src =
        stacked || root.clientWidth < 768
          ? "/assets/intro-construction-mobile.mp4"
          : "/assets/intro-construction.mp4";
      if (video && !video.currentSrc.endsWith(src)) video.src = src;
    };
    const ro = new ResizeObserver(apply);
    ro.observe(root);
    apply();
    return () => ro.disconnect();
  }, []);

  return (
    <div className="intro-overlay" ref={rootRef} role="presentation" aria-label={t("label")}>
      <div className="intro-grid" ref={gridRef} />
      <MonogramScene
        progressRef={progressRef}
        onReady={() => {
          coreReadyRef.current = true;
        }}
      />
      <IntroWordmark rootRef={wordRef} />
      <video
        ref={videoRef}
        className="intro-video"
        poster="/assets/intro-construction.jpg"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onCanPlayThrough={() => {
          videoReadyRef.current = true;
        }}
        onError={() => {
          videoReadyRef.current = false;
        }}
      />
      <button
        ref={skipRef}
        type="button"
        className="intro-skip"
        onClick={() => {
          markSeenThisTab(window.sessionStorage);
          onFinish();
        }}
      >
        {t("skip")}
      </button>
    </div>
  );
}
