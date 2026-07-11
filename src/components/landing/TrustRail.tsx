import { getTranslations } from "next-intl/server";

// Studio proper nouns are not translated.
const TRUST_NAMES = [
  "Atelier Faïdhèrbe",
  "Forme & Latitude",
  "Parallèle Architectes",
  "Studio Asa",
  "Bureau Lagune",
  "Atelier 21",
  "Plan B Architectes",
  "Studio Rive Est",
  "Cabinet N'Guessan",
  "Atelier Bingerville",
];

// Quiet sweeping marquee under the hero (.trust-rail).
export async function TrustRail() {
  const t = await getTranslations("landing.trustRail");
  const items = [...TRUST_NAMES, ...TRUST_NAMES];
  return (
    <div className="trust-rail">
      <div className="lbl">{t("label")}</div>
      <div className="trust-marquee">
        <div className="trust-track">
          {items.map((n, i) => (
            <span key={i}>
              {n}
              <span style={{ marginLeft: 64, color: "var(--concrete-3)" }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
