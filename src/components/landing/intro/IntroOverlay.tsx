"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { markSeenThisTab } from "@/lib/intro/gate";
import { INTRO_DURATION } from "@/lib/intro/timeline";
import { readyVerdict } from "@/lib/intro/readiness";
import { introFrame, holdTime, HOLD_AT } from "@/lib/intro/frame";
import { introLayout } from "@/lib/intro/layout";
import { IntroWordmark, letterProgress } from "./IntroWordmark";
import { Logo } from "@/components/shared/Logo";

// `ssr: false` n'est autorisé que dans un Client Component — en Server
// Component, Next lève une erreur. C'est la raison pour laquelle le chargement
// différé de la scène vit ici et pas dans la page.
const MonogramScene = dynamic(
  () => import("./MonogramScene").then((m) => m.MonogramScene),
  { ssr: false },
);

/** Vitesse de rotation des crochets pendant l'attente, en radians par seconde. */
const HOLD_SPIN = 1.1;
/** Bornes de l'acte 4, pour pouvoir le sauter quand la vidéo manque. */
const VIDEO_START = 4.4;
const VIDEO_SPAN = 2.2;

export function IntroOverlay({ onFinish }: { onFinish: () => void }) {
  const t = useTranslations("intro");
  const rootRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const waitRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef(0);
  const coreReadyRef = useRef(false);
  const holdAngleRef = useRef(0);
  /** null tant que l'acte 4 n'est pas atteint, puis verrouillé. */
  const videoActRef = useRef<boolean | null>(null);
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

    // Le CSS cache le calque sur « mouvement réduit », mais sans ça la page
    // resterait inerte et bloquée en défilement jusqu'à la fin de la séquence.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReduced = () => {
      if (reduced.matches) finish();
    };
    reduced.addEventListener("change", onReduced);

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

      // Le temps monte jusqu'à HOLD_AT puis se fige tant que le cœur n'est pas
      // prêt ; les crochets continuent de tourner grâce à `holdAngleRef`. Il ne
      // revient jamais en arrière — une boucle sur [0, 2 s) faisait repartir la
      // spirale d'un coup au rayon de départ, et clignoter le bouton « passer ».
      let time: number;
      if (!released) {
        time = holdTime(elapsed);
        holdAngleRef.current = Math.max(0, elapsed - HOLD_AT) * HOLD_SPIN;
        if (verdict.leaveLoop) {
          released = true;
          releaseT = time;
          releaseAt = now;
        }
      } else {
        time = releaseT + (now - releaseAt) / 1000;
      }

      // Décision prise une fois pour toutes au seuil de l'acte 4 : si le
      // `canplaythrough` arrivait après, l'horloge reculait de 2,2 s en pleine
      // séquence — zoom à l'envers, mot qui réapparaît, vidéo sans fondu.
      if (videoActRef.current === null && time >= VIDEO_START) {
        videoActRef.current = verdict.includeVideoAct;
      }
      const includeVideoAct = videoActRef.current ?? verdict.includeVideoAct;

      // Vidéo absente : on saute l'acte 4 plutôt que de montrer un écran noir.
      if (!includeVideoAct && time > VIDEO_START) time += VIDEO_SPAN;

      progressRef.current = time;

      for (const el of letters) {
        const p = letterProgress(time, Number(el.dataset.letter));
        el.style.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
        el.style.transform = `translateY(${(1 - p) * 0.12}em)`;
      }

      const f = introFrame({ time, includeVideoAct });

      // Sur connexion lente, le chunk 3D met plusieurs secondes : sans ça le
      // visiteur regarde un écran vert vide avec un bouton « passer ».
      // Après 0,4 s seulement : sur connexion rapide la 3D arrive avant, et le
      // logo plat n'a aucune raison de se montrer.
      if (waitRef.current) {
        const attendre = !coreReadyRef.current && elapsed > 0.4;
        waitRef.current.style.opacity = attendre ? "1" : "0";
      }

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
      raf = requestAnimationFrame(safeFrame);
    }

    // Une erreur dans un rAF n'atteint aucune barrière React : plutôt que de la
    // laisser jeter à chaque image, on rend la main à la page.
    function safeFrame(now: number) {
      try {
        frame(now);
      } catch (error) {
        console.warn("Séquence d'ouverture interrompue après une erreur :", error);
        finish();
      }
    }
    raf = requestAnimationFrame(safeFrame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      reduced.removeEventListener("change", onReduced);
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
      // La source est choisie une seule fois : une rotation de téléphone
      // pendant l'acte 4 rechargeait la vidéo, remettait currentTime à zéro et
      // redessinait le plan depuis le premier trait, sur un nouveau
      // téléchargement. Après le seuil, seule la classe `is-stacked` suit.
      const video = videoRef.current;
      if (video && !video.getAttribute("src")) {
        video.src =
          stacked || root.clientWidth < 768
            ? "/assets/intro-construction-mobile.mp4"
            : "/assets/intro-construction.mp4";
      }
    };
    const ro = new ResizeObserver(apply);
    ro.observe(root);
    apply();
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="intro-overlay"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("label")}
    >
      <div className="intro-grid" ref={gridRef} />
      <div className="intro-wait" ref={waitRef} aria-hidden="true">
        <Logo className="intro-wait-logo" inverse />
      </div>
      <MonogramScene
        progressRef={progressRef}
        holdAngleRef={holdAngleRef}
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
