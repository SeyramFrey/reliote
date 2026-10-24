"use client";

// Le « R » du mot, c'est le monogramme 3D : seules les six lettres restantes
// sont du texte. Leur révélation est pilotée depuis la boucle de rendu du
// calque (styles posés directement sur les nœuds), pas par un état React —
// à soixante images par seconde, un rendu React par image serait du gâchis.

const LETTERS = ["E", "L", "I", "O", "T", "E"] as const;

/** Les lettres n'arrivent qu'une fois le monogramme rangé à sa place : sinon
 *  le E s'écrit par-dessus la queue du R pendant le glissé. */
export const WORD_START = 3.74;
export const LETTER_DURATION = 0.264;
export const LETTER_STAGGER = 0.054;

export function IntroWordmark({ rootRef }: { rootRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="intro-word" ref={rootRef} aria-hidden="true">
      {LETTERS.map((l, i) => (
        <span className="intro-letter" data-letter={i} key={`${l}${i}`}>
          {l}
        </span>
      ))}
    </div>
  );
}

/** Avancement de la lettre `i` à l'instant `t`, de 0 (absente) à 1 (en place). */
export function letterProgress(t: number, i: number): number {
  const start = WORD_START + i * LETTER_STAGGER;
  return Math.min(1, Math.max(0, (t - start) / LETTER_DURATION));
}
