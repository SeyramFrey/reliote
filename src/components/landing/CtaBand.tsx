import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export async function CtaBand() {
  const locale = await getLocale();
  const c = await getTranslations("ctaBand");
  const lc = await getTranslations("landing.ctaBand");

  return (
    <section className="cta-band">
      <div className="cta-inner">
        <div>
          <div
            className="eyebrow"
            style={{ color: "rgba(243,241,236,0.6)", marginBottom: 22 }}
          >
            {c("eyebrow")} — {lc("begin")}
          </div>
          <h2 className="cta-title">
            {c("titlePre")}
            <em>{c("titleItalic")}</em>
          </h2>
          <p
            style={{
              maxWidth: "52ch",
              marginTop: 24,
              color: "rgba(243,241,236,0.78)",
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            {lc("sub")}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          <Link
            href={`/${locale}/projets/initier`}
            className="btn btn-primary"
            style={{ background: "var(--paper)", color: "var(--ink)" }}
          >
            {c("button")} <span className="btn-arrow" />
          </Link>
          <Link
            href={`/${locale}/architectes`}
            className="btn btn-ghost on-dark"
            style={{ color: "var(--paper)", borderColor: "rgba(243,241,236,0.3)" }}
          >
            {lc("secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
