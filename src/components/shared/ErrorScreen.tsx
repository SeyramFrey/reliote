import type { ReactNode } from "react";

// Écran plein cadre des pages d'erreur (404, erreur applicative, erreur
// globale), dans la grammaire du bandeau d'appel final de la landing : fond
// vert, brume en luminosité, titre léger + italique serif. Sans hook, pour
// servir aussi bien côté serveur que dans les error boundaries client.

export type ErrorCopy = {
  eyebrow: string;
  titlePre: string;
  titleItalic: string;
  body: string;
};

export function ErrorScreen({
  code,
  copy,
  lang,
  alt,
  actions,
  footnote,
}: {
  code: string;
  copy: ErrorCopy;
  lang?: string;
  /** Même message dans l'autre langue, quand la locale est inconnue. */
  alt?: { copy: ErrorCopy; lang: string };
  actions: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <main className="cta-band err-screen">
      <div className="err-inner">
        <div className="err-code" aria-hidden>
          {code}
        </div>
        <div lang={lang}>
          <div className="eyebrow err-eyebrow">{copy.eyebrow} —</div>
          <h1 className="cta-title">
            {copy.titlePre}
            <em>{copy.titleItalic}</em>
          </h1>
          <p className="err-body">{copy.body}</p>
        </div>
        {alt && (
          <div lang={alt.lang} className="err-alt">
            <p className="err-alt-title">
              {alt.copy.titlePre}
              <em>{alt.copy.titleItalic}</em>
            </p>
            <p className="err-body">{alt.copy.body}</p>
          </div>
        )}
        <div className="err-actions">{actions}</div>
        {footnote && <div className="err-foot mono">{footnote}</div>}
      </div>
    </main>
  );
}
