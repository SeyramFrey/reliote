"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { safeUrl } from "@/lib/security/safeUrl";

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
// Les logos publiés depuis l'admin (Partenaires) prennent place dans l'anneau,
// répartis à intervalles réguliers parmi les pastilles vides, dont le nombre se
// règle aussi dans l'admin.

export type OrbitLogo = { id: string; name: string; logo_url: string; url: string | null };

type Slot = { key: string; logo: OrbitLogo | null };

/** Répartit les logos à intervalles réguliers parmi les pastilles vides, pour
 *  qu'ils ne se suivent pas tous sur le même arc de l'anneau. */
export function orbitSlots(logos: OrbitLogo[], placeholders: number): Slot[] {
  const total = logos.length + placeholders;
  const at = new Map(logos.map((l, k) => [Math.floor((k * total) / logos.length), l]));
  let empty = 0;
  return Array.from({ length: total }, (_, i) => {
    const logo = at.get(i) ?? null;
    return { key: logo ? logo.id : `empty-${empty++}`, logo };
  });
}
/** Un tour complet, en secondes. */
const TOUR = 19;
/** Inclinaison de l'ellipse, en radians. C'est elle qui évite l'anneau « droit ». */
const INCLINAISON = (-14.5 * Math.PI) / 180;
/** Aplatissement de l'ellipse. La référence est presque circulaire (0,875),
 *  mais un anneau écrasé se lit comme un horizon : on le voit par la tranche,
 *  et les pastilles balaient la bande du titre au lieu de tourner autour. */
const APLATISSEMENT = 0.46;

export function PartnersOrbit({
  logos,
  placeholders,
}: {
  logos: OrbitLogo[];
  placeholders: number;
}) {
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
        const a = phase + (i / pucks.length) * Math.PI * 2;
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
  }, [logos, placeholders]);

  const slots = orbitSlots(logos, placeholders);

  return (
    <section className="sect orb-sect" aria-labelledby="orb-title">
      <div className="orb-ring" ref={ringRef}>
        {slots.map(({ key, logo }) =>
          logo ? (
            <span key={key} className="orb-puck is-logo" aria-hidden="true">
              {/* Logos externes (Storage) ou locaux : <img> évite la config de domaines de next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.logo_url} alt="" loading="lazy" decoding="async" />
            </span>
          ) : (
            <span key={key} className="orb-puck" aria-hidden="true">
              <i />
            </span>
          ),
        )}
        <h2 className="orb-title" id="orb-title">
          {t("titlePre")}
          <em>{t("titleItalic")}</em>
        </h2>
      </div>
      <p className="orb-note">{t("note")}</p>
      {/* Les pastilles sont décoratives (aria-hidden) : les partenaires sont
          annoncés ici aux lecteurs d'écran. */}
      {logos.length > 0 && (
        <ul className="sr-only">
          {logos.map((l) => (
            <li key={l.id}>{safeUrl(l.url) ? <a href={safeUrl(l.url)!}>{l.name}</a> : l.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
