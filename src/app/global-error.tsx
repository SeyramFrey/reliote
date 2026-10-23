"use client";
import { useEffect } from "react";
import { ErrorScreen } from "@/components/shared/ErrorScreen";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import { fontVariables } from "./fonts";
import { AdobeFonts } from "./adobe-fonts";
import "@/styles/globals.css";
import "@/styles/landing.css";

// Dernier filet : une erreur dans le layout racine lui-même. Il remplace tout
// le document, sans fournisseur de traductions — message bilingue, textes lus
// directement dans les fichiers de messages.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const e = fr.errors.error;
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        <AdobeFonts />
        <title>{`${e.eyebrow} — Reliote`}</title>
        <ErrorScreen
          code="500"
          lang="fr"
          copy={e}
          alt={{ lang: "en", copy: en.errors.error }}
          actions={
            <>
              <button
                type="button"
                onClick={() => unstable_retry()}
                className="btn btn-primary"
                style={{ background: "var(--paper)", color: "var(--ink)" }}
              >
                {e.retry} · {en.errors.error.retry} <span className="btn-arrow" />
              </button>
              {/* Rechargement complet voulu : le layout racine vient de planter. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/fr"
                className="btn btn-ghost on-dark"
                style={{ color: "var(--paper)", borderColor: "rgba(243,241,236,0.3)" }}
              >
                {e.home}
              </a>
            </>
          }
          footnote={error.digest ? `${e.ref} · ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
