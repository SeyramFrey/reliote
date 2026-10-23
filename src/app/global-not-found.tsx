import type { Metadata } from "next";
import Link from "next/link";
import { ErrorScreen } from "@/components/shared/ErrorScreen";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import { fontVariables } from "./fonts";
import { AdobeFonts } from "./adobe-fonts";
import "@/styles/globals.css";
import "@/styles/landing.css";

// 404 des URL qui n'atteignent aucune route (hors /fr et /en, p. ex. un
// fichier inexistant). La langue est inconnue : message bilingue.
export const metadata: Metadata = {
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        <AdobeFonts />
        {/* Titre posé ici plutôt que dans metadata : servie via
            app/not-found.tsx, la page hériterait sinon du titre du layout
            [locale] à l'hydratation. */}
        <title>{`${fr.errors.notFound.eyebrow} — Reliote`}</title>
        <ErrorScreen
          code="404"
          lang="fr"
          copy={fr.errors.notFound}
          alt={{ lang: "en", copy: en.errors.notFound }}
          actions={
            <>
              <Link
                href="/fr"
                className="btn btn-primary"
                style={{ background: "var(--paper)", color: "var(--ink)" }}
              >
                {fr.errors.notFound.home} <span className="btn-arrow" />
              </Link>
              <Link
                href="/en"
                lang="en"
                className="btn btn-ghost on-dark"
                style={{ color: "var(--paper)", borderColor: "rgba(243,241,236,0.3)" }}
              >
                {en.errors.notFound.home}
              </Link>
            </>
          }
        />
      </body>
    </html>
  );
}
