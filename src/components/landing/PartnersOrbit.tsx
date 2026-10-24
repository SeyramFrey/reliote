"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

// Anneau de partenaires qui gravite autour du titre, d'après la section « uod »
// de kononenkogroup.com. Relevé sur le site puis ajusté par moindres carrés sur
// les 17 positions mesurées : l'ellipse n'est pas droite, elle est INCLINÉE —
// demi-axes 369 × 323, basculés d'environ 14,5° (erreur résiduelle 0,0013).
// Un tour en ~19 s (mesuré : −47° en 2,5 s).
//
// La profondeur est une illusion tenue par trois choses qui suivent la même
// sinusoïde : l'échelle (0,70 → 1,00), l'opacité (0,10 → 1,00) et surtout le
// z-index, qui bascule à mi-course — la moitié proche passe DEVANT le titre, la
// moitié lointaine derrière. C'est ce croisement qui fait le volume ; sans lui
// l'anneau reste un dessin plat.
//
// Les pastilles sont vides pour l'instant : les vrais logos viendront.

const COUNT = 14;
/** Un tour complet, en secondes. */
const TOUR = 19;
/** Inclinaison de l'ellipse, en radians. C'est elle qui évite l'anneau « droit ». */
const INCLINAISON = (-14.5 * Math.PI) / 180;
/** Rapport des demi-axes relevé sur la référence (323 / 369). */
const APLATISSEMENT = 0.875;

export function PartnersOrbit() {
  const t = useTranslations("partners");
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const pucks = [...ring.querySelectorAll<HTMLElement>(".orb-puck")];

    const place = (phase: number) => {
      const w = ring.clientWidth;
      const h = ring.clientHeight;
      if (!w || !h) return;
      const ci = Math.cos(INCLINAISON);
      const si = Math.sin(INCLINAISON);
      // Le rayon se déduit du cadre : demi-largeur et demi-hauteur de l'ellipse
      // INCLINÉE, pastilles comprises. Fixé à la louche, l'anneau débordait et
      // les pastilles du bas mordaient la légende.
      const rPuck = (pucks[0]?.offsetWidth ?? 0) / 2;
      const demiLarge = Math.sqrt(ci * ci + (APLATISSEMENT * si) ** 2);
      const demiHaut = Math.sqrt(si * si + (APLATISSEMENT * ci) ** 2);
      const rx = Math.max(
        40,
        Math.min((w / 2 - rPuck) / demiLarge, (h / 2 - rPuck) / demiHaut),
      );
      const ry = rx * APLATISSEMENT;
      pucks.forEach((el, i) => {
        const a = phase + (i / COUNT) * Math.PI * 2;
        // sin(a) vaut 1 au bas de l'anneau AVANT inclinaison : la pastille la
        // plus proche se trouve donc légèrement décalée du bas de l'écran,
        // exactement comme sur la référence.
        const pres = (Math.sin(a) + 1) / 2;
        const u = Math.cos(a) * rx;
        const v = Math.sin(a) * ry;
        const x = u * ci - v * si;
        const y = u * si + v * ci;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(0.7 + 0.3 * pres).toFixed(3)})`;
        el.style.opacity = (0.1 + 0.9 * Math.pow(pres, 1.15)).toFixed(3);
        // le flou achève la profondeur : ce qui est loin n'est pas net
        el.style.filter = `blur(${((1 - pres) * 1.6).toFixed(2)}px)`;
        el.style.zIndex = pres > 0.5 ? "3" : "1";
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      place(0);
      return;
    }

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, {
      rootMargin: "120px",
    });
    io.observe(ring);

    const t0 = performance.now();
    const frame = (now: number) => {
      if (visible) place(((now - t0) / 1000 / TOUR) * Math.PI * 2);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <section className="sect orb-sect" aria-labelledby="orb-title">
      <div className="orb-ring" ref={ringRef}>
        {Array.from({ length: COUNT }, (_, i) => (
          <span key={i} className="orb-puck" aria-hidden="true">
            <i />
          </span>
        ))}
        <h2 className="orb-title" id="orb-title">
          {t("titlePre")}
          <em>{t("titleItalic")}</em>
        </h2>
      </div>
      <p className="orb-note">{t("note")}</p>
    </section>
  );
}
