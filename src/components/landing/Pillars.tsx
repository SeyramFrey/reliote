"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SectionHead } from "./SectionHead";

const KEYS = ["p1", "p2", "p3", "p4", "p5"] as const;
const SHOTS = [
  "/assets/img-courtyard-pool.jpg",
  "/assets/img-museum-mist.jpg",
  "/assets/img-stairs-water.jpg",
  "/assets/img-redrock-pool.jpg",
  "/assets/img-courtyard-pool.jpg",
];

// Section épinglée : le cadre reste en place pendant que le défilement fait
// passer les cinq principes. Un seul est à l'écran à la fois — ses voisins sont
// hors cadre au repos et ne se montrent, flous, que pendant la transition.
//
// Deux choses bougent ensemble :
//  — la pile de panneaux, pilotée en CSS par `--p` (position continue, 0 → 4) ;
//  — les numéros, qui glissent le long d'un arc de cercle de sorte que le
//    numéro courant se trouve toujours à mi-hauteur.
//
// `--p` est lissé vers sa cible : le défilement d'une molette arrive par
// à-coups, et sans amortissement le flou « clignote » au lieu de fondre.

/** Pas angulaire entre deux numéros sur l'arc, en radians. */
const PAS = 0.52;
/** Rayon de l'arc, en fraction de la hauteur du cadre. */
const RAYON = 0.52;
/** Position horizontale du numéro courant, en fraction de la largeur. */
const X_COURANT = 0.2;

export function Pillars({ num }: { num: string }) {
  const t = useTranslations("pillars");
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const arc = arcRef.current;
    if (!track || !stage || !arc) return;

    const nums = [...arc.querySelectorAll<HTMLElement>(".pin-arc-num")];
    // Même requête que la liste statique de landing.css (mobile compris).
    const doux = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 760px)").matches;

    const place = (p: number) => {
      stage.style.setProperty("--p", p.toFixed(4));
      const h = arc.clientHeight;
      const w = arc.clientWidth;
      if (!h || !w) return;
      const R = RAYON * h;
      const cx = X_COURANT * w - R;
      nums.forEach((el, i) => {
        const a = (i - p) * PAS;
        const x = cx + R * Math.cos(a);
        const y = h / 2 + R * Math.sin(a);
        // Le numéro courant est net et grand ; les autres s'effacent vite.
        const d = Math.min(1, Math.abs(i - p));
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        el.style.setProperty("--d", d.toFixed(3));
      });
    };

    if (doux) {
      place(0);
      return;
    }

    let p = 0;
    let raf = 0;
    const frame = () => {
      const r = track.getBoundingClientRect();
      const course = r.height - window.innerHeight;
      const avance = course > 0 ? Math.min(1, Math.max(0, -r.top / course)) : 0;
      const cible = avance * (KEYS.length - 1);
      // amortissement : le reste du site défile déjà sous Lenis, on garde la
      // même douceur ici plutôt que de coller au pixel de la molette.
      p += (cible - p) * 0.12;
      if (Math.abs(cible - p) < 0.0004) p = cible;
      place(p);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="sect" id="approche">
      <SectionHead
        num={num}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        kicker={t("kicker")}
      />

      <div className="pin-track" ref={trackRef}>
        <div className="pin-stage" ref={stageRef}>
          <div className="pin-arc" ref={arcRef} aria-hidden="true">
            <div className="pin-arc-line" />
            {KEYS.map((k, i) => (
              <span key={k} className="pin-arc-num" style={{ ["--i" as string]: i }}>
                <i className="pin-dot" />
                {t(`${k}.n`)}
              </span>
            ))}
          </div>

          <ol className="pin-panels">
            {KEYS.map((k, i) => (
              <li key={k} className="pin-panel" style={{ ["--i" as string]: i }}>
                <div className="pin-copy">
                  <h3 className="pin-title">{t(`${k}.t`)}</h3>
                  <p className="pin-body">{t(`${k}.b`)}</p>
                  <div className="pin-stat">
                    <span className="pin-stat-big">
                      {t(`${k}.statNum`)}
                      <small>{t(`${k}.statDenom`)}</small>
                    </span>
                    <span className="pin-stat-lbl">{t(`${k}.statLabel`)}</span>
                  </div>
                </div>
                <div
                  className="pin-shot"
                  style={{ backgroundImage: `url(${SHOTS[i]})` }}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
