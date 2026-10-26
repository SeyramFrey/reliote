// Projet web Adobe Fonts « Reliote » : Degular Text (texte, boutons, menus)
// et Degular Mono (petits intitulés). Les fichiers sont servis par Adobe ;
// React remonte les <link> dans le <head>, où qu'on les rende.
const KIT_URL = "https://use.typekit.net/aya2svh.css";

// La feuille du kit ne doit pas bloquer le premier rendu : posée en
// <link rel="stylesheet">, elle et son @import vers p.typekit.net retardaient
// le LCP de la landing en mobile bridé. On la précharge dès le <head>, puis ce
// script l'insère — une feuille insérée par script ne bloque pas le rendu.
// Le titre de la hero est en Ramillas (servie par next/font), il n'attend pas
// Degular.
const LOAD_KIT = `(function(){var l=document.createElement("link");l.rel="stylesheet";l.href=${JSON.stringify(KIT_URL)};document.head.appendChild(l)})()`;

// Le script inline doit porter le nonce de la CSP (src/lib/security/csp.ts).
// Sans nonce (page d'erreur globale, rendue côté client), on se rabat sur une
// feuille bloquante : rendu un peu plus lent, mais rien d'inline à exécuter.
export function AdobeFonts({ nonce }: { nonce?: string }) {
  if (!nonce) return <link rel="stylesheet" href={KIT_URL} />;
  return (
    <>
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
      <link rel="preload" href={KIT_URL} as="style" />
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: LOAD_KIT }} />
      <noscript>
        <link rel="stylesheet" href={KIT_URL} />
      </noscript>
    </>
  );
}
