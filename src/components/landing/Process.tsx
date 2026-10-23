"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const STEPS = ["s1", "s2", "s3", "s4"] as const;
// État 0 : le titre de la section ; états 1 à 4 : un palier chacun.
const LAST = STEPS.length;

// Fond et encre de chaque état, du papier de l'intuition au vert de nuit de la
// remise des clés : papier, sable doré, vert clair, vert, eau.
const BG: Rgb[] = [[243, 241, 236], [224, 209, 166], [10, 74, 31], [7, 62, 24], [12, 22, 20]];
const FG: Rgb[] = [[20, 20, 15], [20, 20, 15], [243, 241, 236], [243, 241, 236], [243, 241, 236]];

// Fleur : un rayon par livrable (3 par palier), dans un SVG de 1000 × 1000.
const C = 500;
const R = 440;
// Les rayons naissent à distance du centre, où se lit le texte.
const R0 = R * 0.42;
const POINTS = 18;
const SECTOR = 360 / STEPS.length;
const RAY_STEP = SECTOR / 3;
// Rotation lente et régulière, proportionnelle au défilement (≈ 10° pour
// 150 px, comme la référence) ; le secteur du palier en cours arrive à droite
// (90°), où ses livrables se lisent à l'horizontale.
const rotationAt = (p: number) => 90 + SECTOR / 2 - SECTOR * p;
// Léger amorti, en plus de celui de la page (SmoothScroll).
const EASE = 0.2;
// Les rayons restent droits ; ils ne s'infléchissent que de quelques degrés
// pendant le mouvement, selon sa vitesse, et se redressent à l'arrêt.
const BEND_GAIN = 260;
const BEND_MAX = 5;

type Rgb = [number, number, number];
const mix = (a: Rgb, b: Rgb, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function Process({ num }: { num: string }) {
  const t = useTranslations("process");
  const lt = useTranslations("landing.process");
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flowerRef = useRef<HTMLDivElement>(null);
  const rayRefs = useRef<(SVGPathElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [state, setState] = useState(0);

  const deliverables = STEPS.flatMap((k) => t.raw(`${k}.deliverables`) as string[]);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const flower = flowerRef.current;
    if (!section || !stage || !flower) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 0;
    let current = 0;
    let bend = 0;
    let scale = flower.clientWidth / 1000;
    let frame = 0;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const run = rect.height - window.innerHeight;
      target = run > 0 ? Math.min(1, Math.max(0, -rect.top / run)) * LAST : 0;
    };

    const paint = (raw: number) => {
      const base = Math.min(Math.floor(raw), LAST - 1);
      // Le fond passe d'un palier au suivant au milieu du défilement.
      const f = smooth(0.25, 0.75, raw - base);
      stage.style.backgroundColor = mix(BG[base], BG[base + 1], f);
      stage.style.color = mix(FG[base], FG[base + 1], f);
      setState(Math.round(raw));

      const rot = rotationAt(raw);
      for (let i = 0; i < deliverables.length; i++) {
        const a0 = i * RAY_STEP + RAY_STEP / 2 + rot;
        let d = "";
        for (let j = 0; j <= POINTS; j++) {
          const u = j / POINTS;
          const a = ((a0 + bend * u * u) * Math.PI) / 180;
          const r = R0 + (R - R0) * u;
          d += `${j ? "L" : "M"}${(C + r * Math.sin(a)).toFixed(1)},${(C - r * Math.cos(a)).toFixed(1)}`;
        }
        rayRefs.current[i]?.setAttribute("d", d);
        const label = labelRefs.current[i];
        if (label) {
          const a = ((a0 + bend) * Math.PI) / 180;
          const sx = Math.sin(a);
          const sy = -Math.cos(a);
          const x = (C + (R + 18) * sx) * scale;
          const y = (C + (R + 18) * sy) * scale;
          // Le libellé part du bout du rayon, vers l'extérieur.
          label.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(${(-50 + sx * 50).toFixed(1)}%,${(-50 + sy * 50).toFixed(1)}%)`;
        }
      }
    };

    const loop = () => {
      const next = still ? target : current + (target - current) * EASE;
      const settled = Math.abs(target - next) < 0.0005;
      const velocity = (settled ? target : next) - current;
      current = settled ? target : next;
      // Le bout des rayons traîne un peu derrière la rotation.
      const wanted = still ? 0 : Math.max(-BEND_MAX, Math.min(BEND_MAX, velocity * BEND_GAIN));
      bend += (wanted - bend) * 0.12;
      if (Math.abs(bend) < 0.01) bend = 0;
      paint(current);
      frame = settled && bend === 0 ? 0 : requestAnimationFrame(loop);
    };
    const wake = () => {
      measure();
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      scale = flower.clientWidth / 1000;
      wake();
    };

    measure();
    current = target;
    paint(current);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
    // `deliverables` ne change qu'avec la langue, qui recharge la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (s: number) => (s === state ? "is-on" : s < state ? "is-past" : "");
  const two = (n: number) => String(n).padStart(2, "0");
  const tone = (i: number) => {
    const step = Math.floor(i / 3) + 1;
    return step === state ? "is-active" : step < state ? "is-done" : "";
  };

  return (
    <section className="journey" id="projets" ref={sectionRef} aria-labelledby="journey-title">
      {/* `data-tone` : les deux premiers états sont clairs, l'or y est assombri. */}
      <div className="journey-stage" ref={stageRef} data-tone={state <= 1 ? "light" : "dark"}>
        <span className="journey-num">{num} —</span>

        <div className="journey-flower" ref={flowerRef} aria-hidden="true">
          <svg viewBox="0 0 1000 1000">
            <defs>
              {/* Les rayons s'effacent vers le centre : un dégradé de trait, bien
                  moins coûteux à repeindre qu'un masque à chaque image. */}
              {(["ink", "gold"] as const).map((k) => (
                <radialGradient key={k} id={`journey-${k}`} cx={C} cy={C} r={R} gradientUnits="userSpaceOnUse">
                  <stop offset={R0 / R} className={`j-stop-${k}`} stopOpacity="0" />
                  <stop offset="1" className={`j-stop-${k}`} stopOpacity="1" />
                </radialGradient>
              ))}
            </defs>
            <g>
              {deliverables.map((d, i) => (
                <path
                  key={d}
                  className={`journey-ray ${tone(i)}`}
                  ref={(el) => {
                    rayRefs.current[i] = el;
                  }}
                />
              ))}
            </g>
          </svg>
          {deliverables.map((d, i) => (
            <span
              key={d}
              className={`journey-label ${tone(i)}`}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
            >
              {d}
            </span>
          ))}
        </div>

        <div className="journey-center">
          <div className={`journey-slide ${pos(0)}`}>
            <h2 id="journey-title" className="journey-title">
              <span className="j-mask"><span className="j-line">{t("titlePre").trim()}</span></span>
              <span className="j-mask"><em className="j-line" style={{ ["--i"]: 1 } as React.CSSProperties}>{t("titleItalic")}</em></span>
            </h2>
          </div>
          {STEPS.map((k, i) => (
            <div key={k} className={`journey-slide ${pos(i + 1)}`}>
              <p className="journey-eyebrow">
                <span className="j-mask"><span className="j-line">
                  {lt("stage")} {t(`${k}.n`)} / {two(STEPS.length)}
                </span></span>
              </p>
              <h3 className="journey-step">
                <span className="j-mask"><span className="j-line" style={{ ["--i"]: 1 } as React.CSSProperties}>{t(`${k}.t`)}</span></span>
              </h3>
              <p className="journey-verb">
                <span className="j-mask"><em className="j-line" style={{ ["--i"]: 2 } as React.CSSProperties}>{t(`${k}.verb`)}</em></span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
