"use client";

import { useState, useSyncExternalStore } from "react";
import { shouldPlayIntro, hasSeenThisTab } from "@/lib/intro/gate";
import { IntroOverlay } from "./IntroOverlay";

/** Un contexte WebGL suffit-il à faire tourner la scène ? C'est le test
 *  minimal : il écarte les navigateurs sans WebGL, pas les GPU trop lents.
 *  Le résultat est mis en cache — créer un canvas à chaque lecture coûterait. */
let webglCache: boolean | null = null;
function webglOk(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    webglCache = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}

// La décision dépend du navigateur (stockage, préférences, WebGL) : le serveur
// répond toujours « pas d'intro », sinon l'hydratation se désynchronise.
const subscribe = () => () => {};
const getSnapshot = () =>
  shouldPlayIntro({
    // Éteinte par défaut. Mesure du 2026-10-24, mobile bridé (4× CPU, Slow 4G) :
    // LCP 2581 ms avec l'intro contre 2367 ms sans, pour un seuil de 2500 ms.
    // La landing était déjà à 2367 ms — la cause est le CSS et les fontes
    // bloquants, pas l'intro, qui n'ajoute que ~214 ms. Rallumer avec
    // NEXT_PUBLIC_INTRO=1 une fois ce blocage traité ; `?intro=1` la force déjà
    // pour la montrer.
    enabled: process.env.NEXT_PUBLIC_INTRO === "1",
    queryIntro: new URLSearchParams(window.location.search).get("intro"),
    seenThisTab: hasSeenThisTab(window.sessionStorage),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    webglOk: webglOk(),
  });
const getServerSnapshot = () => false;

export function IntroGate() {
  const eligible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [finished, setFinished] = useState(false);

  if (!eligible || finished) return null;
  return <IntroOverlay onFinish={() => setFinished(true)} />;
}
