import { getTranslations } from "next-intl/server";

export async function Footer() {
  const f = await getTranslations("landing.footer");
  const cols = f.raw("cols") as { h: string; links: string[] }[];

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand-block">
          <div className="brand">
            <span
              className="brand-mark"
              style={{ borderColor: "rgba(243,241,236,0.6)" }}
            >
              R
            </span>
            <span className="brand-name">RELIOTE</span>
          </div>
          <p className="footer-tag">{f("tag")}</p>
          <div style={{ marginTop: 28, display: "flex", gap: 18 }}>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                color: "rgba(243,241,236,0.55)",
              }}
            >
              PARIS
            </span>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                color: "rgba(243,241,236,0.55)",
              }}
            >
              ·
            </span>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                color: "rgba(243,241,236,0.55)",
              }}
            >
              ABIDJAN
            </span>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h} className="footer-col">
            <h5>{c.h}</h5>
            <ul>
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-base">
        <span>© Reliote · 2026 — {f("rights")}</span>
        <span>{f("version")}</span>
      </div>
    </footer>
  );
}
