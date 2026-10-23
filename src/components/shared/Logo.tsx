import { useId } from "react";

// Monogramme R — exporté de Figma (fichier « Reliote », nœud 35:26).
// Deux formes : la boucle du P (vert forêt, ou paper sur fond sombre) et la
// queue du R, en dégradé vert clair → teal (déclinaison « test 4 », nœud 80:2).
// Les tracés servent aussi à app/icon.svg et aux images générées
// (apple-icon, opengraph-image).

export const LOGO_VIEWBOX = "0 0 299 314";
export const LOGO_RATIO = 299 / 314;

export const LOGO_P_PATH =
  "M153.5 0C198.5 2 226.5 48.6716 226.5 78.5C226.5 108.328 214.5 138 181 151C172 152.5 156 152.5 156 152.5C156 152.5 148.5 151.5 149.5 145C149.5 145 160.815 126.764 166.5 118.5C173.5 104 176.579 102.006 177.5 86C177.5 67.5 166 51.5 147.5 47.5H80C63.0357 50.8929 53.5891 60.8637 48.9274 75.1352C48.6329 76.0368 48.4964 76.9815 48.4894 77.93L48 144.219V199C45 212 36.5 219.5 36.5 219.5C32 225 22.5 228.5 22.5 228.5C22.5 228.5 0 235.343 0 226L0.5 69.5C3 37.5 34.5 4 70.5 0.5L153.5 0Z";

export const LOGO_R_PATH =
  "M154.5 95.498C155 99.998 153.5 102.498 149.5 108.998C146.517 113.392 142.782 119.313 139.5 124.498C139.5 124.498 127.56 141.258 127.56 160.864C127.56 180.47 143.5 199.498 162.5 200.998H213.5C233.5 196.498 245.56 180.47 245.56 160.864C244.634 147.004 237.648 138.001 228.897 131.28C226.773 129.649 226.095 126.689 227.543 124.437C233.023 115.906 237.09 110.546 240.421 95.4001C241.055 92.519 243.966 90.6779 246.732 91.7034C274.782 102.103 292 129.439 292 160.559C289.5 196.998 276 221.998 245 237.998C237.052 242.1 220 243.998 220 243.998C247 261.998 258 268.498 258 268.498C270.5 275.998 289.128 287.498 292 291.498C306 310.998 294.5 313.998 294.5 313.998H251.931C251.931 313.998 123.016 235.498 107 220.998C90.9844 206.498 81.0001 181.898 81 160.559C81 120.485 106.926 90.498 147 90.498C153.488 92.498 153.5 93.498 154.5 95.498Z";

/** Dégradé de la queue du R, du haut-gauche vers le bout de la queue. */
export const LOGO_R_STOPS = ["#7ccf8f", "#3cb298", "#1e9591"] as const;
/** Couleur unie du R aux petites tailles (≤ 32 px), où le dégradé ne se lit plus. */
export const LOGO_R_SOLID = { light: "#1e9591", dark: "#3cb298" } as const;

/** Dégradé SVG du R, à poser dans un <defs>. */
function LogoGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="81" y1="90" x2="300" y2="314" gradientUnits="userSpaceOnUse">
      {LOGO_R_STOPS.map((c, i) => (
        <stop key={c} offset={i / (LOGO_R_STOPS.length - 1)} stopColor={c} />
      ))}
    </linearGradient>
  );
}

/** Logo complet en data URI SVG, pour les images next/og : Satori ne rend pas
 *  un <linearGradient> écrit en JSX, mais accepte une <img> SVG. */
export function logoDataUri(pColor: string): string {
  const stops = LOGO_R_STOPS.map(
    (c, i) => `<stop offset="${i / (LOGO_R_STOPS.length - 1)}" stop-color="${c}"/>`,
  ).join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}">` +
    `<defs><linearGradient id="r" x1="81" y1="90" x2="300" y2="314" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs>` +
    `<path d="${LOGO_P_PATH}" fill="${pColor}"/><path d="${LOGO_R_PATH}" fill="url(#r)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** `inverse` : P en paper pour les fonds sombres ; sinon P en vert forêt. */
export function Logo({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  // Un id par instance : avec un id partagé, le navigateur prend le premier
  // dégradé du document, et le R disparaît si celui-là est masqué.
  const gradientId = `reliote-r-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} aria-hidden="true" focusable="false">
      <defs>
        <LogoGradient id={gradientId} />
      </defs>
      <path d={LOGO_P_PATH} fill={inverse ? "var(--color-paper)" : "var(--color-green)"} />
      <path d={LOGO_R_PATH} fill={`url(#${gradientId})`} />
    </svg>
  );
}
