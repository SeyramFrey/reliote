import { ImageResponse } from "next/og";
import { LOGO_RATIO, logoDataUri } from "@/components/shared/Logo";

// Icône d'écran d'accueil iOS : déclinaison « inversé — vert forêt » du logo
// (P paper, R en dégradé sur fond vert). iOS arrondit lui-même les coins.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const h = 112;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#073E18",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by next/og, not the browser */}
        <img src={logoDataUri("#f3f1ec")} width={Math.round(h * LOGO_RATIO)} height={h} alt="" />
      </div>
    ),
    size,
  );
}
