"use client";

import { Component, type ReactNode } from "react";

// L'intro est décorative : si elle casse, elle disparaît et la landing reste.
// Sans cette barrière, la moindre erreur dedans (création du contexte WebGL
// refusée, chunk non chargé après un redéploiement, mémoire insuffisante)
// remonte jusqu'à [locale]/error.tsx et remplace la page d'accueil par un 500.
export class IntroBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("Séquence d'ouverture désactivée après une erreur :", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
