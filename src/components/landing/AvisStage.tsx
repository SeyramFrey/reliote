"use client";
import { Fragment, useEffect, useRef, useState } from "react";

// Scène des avis : index des auteurs à gauche, citation en très grand à droite,
// mot à mot. Le défilement automatique est tenu par le CSS — la barre de
// l'auteur actif se remplit (rl-pgFill) et sa fin d'animation passe à l'avis
// suivant ; survol, focus ou section hors écran la mettent en pause.

export type AvisSlide = {
  id: string;
  quote: string;
  author: string;
  role: string;
  location: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function AvisStage({
  slides,
  labels,
}: {
  slides: AvisSlide[];
  labels: { prev: string; next: string; show: string };
}) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const count = slides.length;
  const go = (i: number) => setActive((i + count) % count);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const slide = slides[active];
  const words = slide.quote.split(/\s+/).filter(Boolean);
  const paused = hovered || !visible || count < 2;

  return (
    <div
      ref={rootRef}
      className={`avis-stage${paused ? " is-paused" : ""}${visible ? " is-in" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <ol className="avis-index">
        {slides.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`avis-who${i === active ? " is-active" : ""}`}
              aria-current={i === active ? "true" : undefined}
              aria-label={labels.show.replace("{author}", s.author)}
              onClick={() => go(i)}
            >
              <span className="avis-who-num">{pad(i + 1)}</span>
              <span className="avis-who-name">{s.author}</span>
              {s.role && <span className="avis-who-role">{s.role}</span>}
              {i === active && count > 1 && (
                <span
                  className="avis-who-bar"
                  aria-hidden="true"
                  onAnimationEnd={() => go(active + 1)}
                />
              )}
            </button>
          </li>
        ))}
      </ol>

      <figure className="avis-quote" aria-live="polite">
        <span className="avis-mark" aria-hidden="true">
          “
        </span>
        {/* La clé rejoue l'entrée mot à mot à chaque changement d'avis. */}
        <blockquote key={slide.id} className="avis-text">
          {/* L'espace reste hors du masque : en fin de bloc inline, il serait avalé. */}
          {words.map((w, i) => (
            <Fragment key={i}>
              <span className="avis-word" style={{ "--i": i } as React.CSSProperties}>
                <span>{w}</span>
              </span>{" "}
            </Fragment>
          ))}
        </blockquote>
        <figcaption key={`${slide.id}-cap`} className="avis-cite">
          <span>{slide.author}</span>
          {slide.role && <span>{slide.role}</span>}
          {slide.location && <span>{slide.location}</span>}
        </figcaption>
      </figure>

      {count > 1 && (
        <div className="avis-ctrl">
          <span className="avis-counter">
            <b>{pad(active + 1)}</b> / {pad(count)}
          </span>
          <button type="button" className="avis-arrow" aria-label={labels.prev} onClick={() => go(active - 1)}>
            ←
          </button>
          <button type="button" className="avis-arrow" aria-label={labels.next} onClick={() => go(active + 1)}>
            →
          </button>
        </div>
      )}
    </div>
  );
}
