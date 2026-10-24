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
// passer les cinq principes l'un après l'autre. Le principe au centre est net,
// les autres restent flous en retrait — c'est le flou qui dit « celui-là arrive,
// celui-là est déjà passé », bien mieux qu'un simple fondu.
//
// Un seul nombre pilote tout : `--p`, la position continue dans la liste (0 à 4).
// Chaque panneau en déduit son écart `--i - --p` et donc son décalage, son flou
// et son opacité, en CSS. Le JS n'écrit qu'une variable par image.

/** Points de l'arc des numéros, en pourcentage de la hauteur du cadre. */
const ARC = KEYS.map((_, i) => {
  const span = 1.05; // radians couverts par l'arc
  const a = -span / 2 + (span * i) / (KEYS.length - 1);
  return { x: 50 - 46 * Math.cos(a), y: 50 + 56 * Math.sin(a) };
});

export function Pillars({ num }: { num: string }) {
  const t = useTranslations("pillars");
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stage.style.setProperty("--p", "0");
      return;
    }

    let raf = 0;
    let last = -1;
    const frame = () => {
      const r = track.getBoundingClientRect();
      // Course utile : du moment où le cadre se colle en haut jusqu'à ce que le
      // bas du rail atteigne le bas de l'écran.
      const course = r.height - window.innerHeight;
      const avance = course > 0 ? Math.min(1, Math.max(0, -r.top / course)) : 0;
      const p = avance * (KEYS.length - 1);
      if (Math.abs(p - last) > 0.0005) {
        stage.style.setProperty("--p", p.toFixed(4));
        last = p;
      }
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
          <div className="pin-arc" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pin-arc-line">
              <path
                d={`M ${ARC[0].x} ${ARC[0].y} Q 50 50 ${ARC[ARC.length - 1].x} ${ARC[ARC.length - 1].y}`}
                fill="none"
              />
            </svg>
            {ARC.map((pt, i) => (
              <span
                key={i}
                className="pin-arc-num"
                style={{ left: `${pt.x}%`, top: `${pt.y}%`, ["--i" as string]: i }}
              >
                <i className="pin-dot" />
                {t(`${KEYS[i]}.n`)}
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
