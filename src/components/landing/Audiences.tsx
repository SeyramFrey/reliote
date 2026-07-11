import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SectionHead } from "./SectionHead";

export async function Audiences() {
  const locale = await getLocale();
  const a = await getTranslations("audiences");
  const la = await getTranslations("landing.audiences");
  const clientList = la.raw("client.list") as string[];
  const archList = la.raw("architect.list") as string[];

  return (
    <section className="sect" id="apropos">
      <SectionHead
        num={la("head.eyebrow")}
        titlePre={la("head.titlePre")}
        titleItalic={la("head.titleItalic")}
        kicker={la("head.kicker")}
      />
      <div className="aud-split">
        <article className="aud-card">
          <div className="aud-head">
            <span>{a("client.eyebrow")}</span>
            <span className="mono">→ 01 / 02</span>
          </div>
          <h3 className="aud-title">
            {la("client.titlePre")}
            <em>{la("client.titleItalic")}</em>
            {la("client.titleRest")}
          </h3>
          <p className="aud-body">{a("client.body")}</p>
          <ul className="aud-list">
            {clientList.map((it, i) => (
              <li key={it}>
                <span className="num">0{i + 1}</span>
                {it}
              </li>
            ))}
          </ul>
          <div className="aud-foot">
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--concrete-2)",
              }}
            >
              {la("client.foot")}
            </span>
            <Link href={`/${locale}/projets/initier`} className="btn btn-primary">
              {a("client.cta")} <span className="btn-arrow" />
            </Link>
          </div>
        </article>

        <article className="aud-card dark">
          <div className="aud-head">
            <span>{a("architect.eyebrow")}</span>
            <span className="mono">→ 02 / 02</span>
          </div>
          <h3 className="aud-title">
            {la("architect.titlePre")}
            <em>{la("architect.titleItalic")}</em>
            {la("architect.titleRest")}
          </h3>
          <p className="aud-body">{a("architect.body")}</p>
          <ul className="aud-list">
            {archList.map((it, i) => (
              <li key={it}>
                <span className="num">0{i + 1}</span>
                {it}
              </li>
            ))}
          </ul>
          <div className="aud-foot">
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(243,241,236,0.5)",
              }}
            >
              {la("architect.foot")}
            </span>
            <Link
              href={`/${locale}/architectes/rejoindre`}
              className="btn btn-primary"
              style={{ background: "var(--paper)", color: "var(--ink)" }}
            >
              {a("architect.cta")} <span className="btn-arrow" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
