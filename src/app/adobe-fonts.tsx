// Projet web Adobe Fonts « Reliote » : Degular Text (texte, boutons, menus)
// et Degular Mono (petits intitulés). Les fichiers sont servis par Adobe ;
// React remonte ces <link> dans le <head>, où qu'on les rende.
const KIT_URL = "https://use.typekit.net/aya2svh.css";

export function AdobeFonts() {
  return (
    <>
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
      <link rel="stylesheet" href={KIT_URL} precedence="default" />
    </>
  );
}
