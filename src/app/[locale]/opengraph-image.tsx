import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";

// Image de partage (Open Graph / Twitter) de toutes les pages localisées.
// Générée au build pour chaque locale : photo du hero assombrie, marque et
// promesse dans la langue de la page.

export const alt = "Reliote";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const m = locale === "en" ? en : fr;
  const photo = await readFile(join(process.cwd(), "public/assets/img-courtyard-pool.jpg"), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0c1614",
          color: "#f3f1ec",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by next/og, not the browser */}
        <img
          src={`data:image/jpeg;base64,${photo}`}
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.42 }}
          alt=""
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 44,
                height: 44,
                border: "1.5px solid rgba(243,241,236,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              R
            </div>
            <div style={{ fontSize: 28, letterSpacing: 8 }}>RELIOTE</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 66, lineHeight: 1.05, maxWidth: 900, letterSpacing: -1.5 }}>
              {m.meta.title.replace(/^Reliote — /, "")}
            </div>
            <div style={{ fontSize: 26, lineHeight: 1.4, maxWidth: 940, color: "rgba(243,241,236,0.8)" }}>
              {m.meta.description}
            </div>
          </div>
          <div style={{ display: "flex", height: 3, width: 96, background: "#b89968" }} />
        </div>
      </div>
    ),
    size,
  );
}
