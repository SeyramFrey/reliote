import { getTranslations } from "next-intl/server";

// Quiet sweeping marquee under the hero (.trust-rail): what every architect
// goes through before being put forward. No names — identities stay hidden
// until the confirmed meeting.
export async function TrustRail() {
  const t = await getTranslations("landing.trustRail");
  const checks = t.raw("items") as string[];
  const items = [...checks, ...checks];
  return (
    <div className="trust-rail">
      <div className="lbl">{t("label")}</div>
      <div className="trust-marquee">
        <div className="trust-track">
          {items.map((n, i) => (
            <span key={i} aria-hidden={i >= checks.length || undefined}>
              {n}
              <span style={{ marginLeft: 64, color: "var(--concrete-3)" }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
