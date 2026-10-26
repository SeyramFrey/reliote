"use client";

import { useState, useSyncExternalStore } from "react";
import { shouldPlayIntro, hasSeenThisTab } from "@/lib/intro/gate";
import { IntroOverlay } from "./IntroOverlay";
import { IntroBoundary } from "./IntroBoundary";

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
    enabled: process.env.NEXT_PUBLIC_INTRO !== "0",
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
  return (
    <IntroBoundary>
      <IntroOverlay onFinish={() => setFinished(true)} />
    </IntroBoundary>
  );
}
