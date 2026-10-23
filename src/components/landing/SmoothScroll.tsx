"use client";
import { useEffect } from "react";
import Lenis from "lenis";

// Défilement amorti de la page d'accueil : la molette avance par à-coups de
// ~100 px, Lenis les lisse pour que les animations liées au défilement (la
// fleur du Processus) glissent au lieu de sauter. Rien si l'utilisateur a
// demandé moins d'animations.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.07,
      autoRaf: true,
      anchors: true,
      // La fenêtre de projet et le tiroir défilent par eux-mêmes.
      prevent: (node) => !!node.closest(".modal-body, .drawer"),
    });
    return () => lenis.destroy();
  }, []);
  return null;
}
