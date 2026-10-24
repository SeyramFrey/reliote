"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

// Anneau de partenaires qui gravite autour du titre, d'après la section « uod »
// de kononenkogroup.com. Relevé sur le site : ellipse de 364 × 326, dix-sept
// pastilles réparties à angle égal, un tour en ~19 s (mesuré : −47° en 2,5 s).
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
      const rx = 0.36 * w;
      const ry = 0.5 * h;
      pucks.forEach((el, i) => {
        const a = phase + (i / COUNT) * Math.PI * 2;
        // sin(a) vaut 1 en bas de l'anneau : c'est là que l'on est « près ».
        const pres = (Math.sin(a) + 1) / 2;
        const x = Math.cos(a) * rx;
        const y = Math.sin(a) * ry;
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
