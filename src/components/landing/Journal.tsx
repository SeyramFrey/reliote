import { getLocale, getTranslations } from "next-intl/server";
import type { MediaItem } from "@/lib/landing/data";
import { SectionHead } from "./SectionHead";

// Journal alimenté par la table media_items (contenu géré depuis l'admin).
// La page ne rend cette section que s'il existe au moins un média publié :
// pas d'articles de repli.

export async function Journal({ items, num }: { items: MediaItem[]; num: string }) {
  const locale = await getLocale();
  const en = locale === "en";
  const lj = await getTranslations("landing.journal");

  return (
    <section className="sect" id="journal" style={{ background: "var(--paper-2)" }}>
      <SectionHead
        num={num}
        titlePre={lj("titlePre")}
        titleItalic={lj("titleItalic")}
        kicker={lj("kicker")}
      />
      <div className="journal-grid">
        {items.map((m) => {
          const title = (en ? m.title_en : m.title_fr) || m.title_fr;
          const excerpt = (en ? m.excerpt_en : m.excerpt_fr) ?? "";
          const inner = (
            <article className="j-card">
              <div className="j-meta">
                <span>{m.read_time ?? ""}</span>
                <span>{m.date ?? ""}</span>
              </div>
              <div
                className="j-img"
                style={m.image_url ? { backgroundImage: `url(${JSON.stringify(m.image_url)})` } : undefined}
              />
              <h3 className="j-title">{title}</h3>
              <p className="j-excerpt">{excerpt}</p>
              {m.url && (
                <span
                  className="mono"
                  style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  {lj("more")}
                </span>
              )}
            </article>
          );
          return m.url ? (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {inner}
            </a>
          ) : (
            <div key={m.id}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
