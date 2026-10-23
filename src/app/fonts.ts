import localFont from "next/font/local";

// Polices partagées par le layout localisé et les pages qui le remplacent
// (global-not-found, global-error doivent fournir leur propre <html>).
// Le texte et les intitulés viennent d'Adobe Fonts (voir adobe-fonts.tsx).

// TT Ramillas (TypeType) : titres, mots en italique et grands chiffres.
const ramillas = localFont({
  src: [
    { path: "./fonts/ramillas/TTRamillas-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/ramillas/TTRamillas-LightItalic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/ramillas/TTRamillas-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ramillas/TTRamillas-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const fontVariables = ramillas.variable;
