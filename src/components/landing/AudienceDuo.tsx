"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useReducer, useSyncExternalStore } from "react";
import { DUO_IDLE, DUO_SETTLE_MS, duoPose, duoReduce } from "@/lib/landing/duo";
import { SectionHead } from "./SectionHead";

// « Deux côtés du même cadre », d'après le menu des galeries de
// hollywoodexhibit2026.com. Relevé dans leur code (Framer Motion), reproduit en
// CSS pour ne pas charger Framer sur la landing :
// - cartes : 800 ms, easeInOut.quart ; la survolée passe à x ±20 % et × 1,1,
//   l'autre glisse dans le même sens à × 0,8 et 20 % d'opacité ;
// - fond de section : 600 ms, même courbe ; l'en-tête part dans un flou de 6 px ;
// - titre ancré au coin extérieur de la grille : lignes décalées de 0,18 s,
//   800 ms easeInOut.cubic, depuis ±30 % et un flou de 6 px ; le mot manuscrit
//   se trace après (0,1 s à gauche, 0,5 s à droite).
// Desktop à souris seulement : sur tactile, les cartes s'empilent et se touchent.

export type DuoCard = {
  href: string;
  image: string;
  eyebrow: string;
  step: string;
  titlePre: string;
  titleItalic: string;
  titleRest: string;
  cta: string;
  say: { pre: string; script: string; word: string };
};

const HOVER_QUERY = "(min-width: 1024px) and (hover: hover)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(HOVER_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getSnapshot = () => window.matchMedia(HOVER_QUERY).matches;
const getServerSnapshot = () => false;

export function AudienceDuo({
  num,
  head,
  cards,
}: {
  num: string;
  head: { titlePre: string; titleItalic: string; kicker: string };
  cards: [DuoCard, DuoCard];
}) {
  const canHover = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [state, dispatch] = useReducer(duoReduce, DUO_IDLE);

  // La carte en attente s'active une fois le premier mouvement défait.
  useEffect(() => {
    if (state.pending === null) return;
    const t = setTimeout(() => dispatch({ type: "settle" }), DUO_SETTLE_MS);
    return () => clearTimeout(t);
  }, [state.pending]);

  // Passage en tactile (ou fenêtre rétrécie) en plein survol : retour au repos.
  useEffect(() => {
    if (!canHover) dispatch({ type: "leave" });
  }, [canHover]);

  const hovered = canHover ? state.hovered : null;

  return (
    <section className="sect duo-sect" id="apropos" data-active={hovered ?? "none"}>
      <SectionHead
        num={num}
        titlePre={head.titlePre}
        titleItalic={head.titleItalic}
        kicker={head.kicker}
      />
      <div className="duo-stage">
        <div
          className="duo-grid"
          onMouseLeave={canHover ? () => dispatch({ type: "leave" }) : undefined}
        >
          {cards.map((c, i) => (
            <div
              key={c.href}
              className="duo-say"
              data-side={i === 0 ? "left" : "right"}
              data-on={hovered === i}
              aria-hidden="true"
            >
              <span className="duo-say-line">
                <span className="duo-say-word duo-say-pre">{c.say.pre}</span>
              </span>
              <span className="duo-say-line">
                <span className="duo-say-row">
                  <span className="duo-say-script">{c.say.script}</span>
                  <span className="duo-say-word">{c.say.word}</span>
                </span>
              </span>
            </div>
          ))}

          {cards.map((c, i) => {
            const side = i === 0 ? "left" : "right";
            const title = (
              <h3 className="duo-cover-title">
                {c.titlePre}
                <em>{c.titleItalic}</em>
                {c.titleRest}
              </h3>
            );
            return (
              <div
                key={c.href}
                className="duo-card"
                data-side={side}
                data-pose={duoPose(i, hovered)}
                style={{ zIndex: state.zOwner === i ? 1 : 0 }}
                onMouseEnter={canHover ? () => dispatch({ type: "enter", index: i }) : undefined}
              >
                <Link href={c.href} className="duo-link">
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 34vw, 92vw"
                    className="duo-img"
                  />
                  {/* Le titre de survol est ancré au coin extérieur de la grille
                      (bas-gauche, haut-droite) : la couverture garde ce coin libre. */}
                  <div className="duo-cover">
                    <div className="duo-cover-top">
                      <span className="duo-cover-row">
                        <span>{c.eyebrow}</span>
                        {side === "left" && <span>{c.step}</span>}
                      </span>
                      {side === "left" && title}
                    </div>
                    <div className="duo-cover-bottom">
                      {side === "right" && title}
                      <span className="duo-cta">
                        {c.cta} <span className="btn-arrow" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
