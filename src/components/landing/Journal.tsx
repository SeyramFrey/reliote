import { getLocale, getTranslations } from "next-intl/server";
import type { MediaItem } from "@/lib/landing/data";
import { SectionHead } from "./SectionHead";
import { safeUrl } from "@/lib/security/safeUrl";

// Journal alimenté par la table media_items (contenu géré depuis l'admin).
// Sans média publié, la section reste visible avec les trois sujets en
// préparation, annoncés « À paraître » : ni fausse date, ni lien vers un
// article qui n'existe pas encore.

const TOPIC_IMGS = [
  "/assets/img-museum-mist.jpg",
  "/assets/img-redrock-pool.jpg",
  "/assets/img-stairs-water.jpg",
];

type Topic = { tag: string; pre: string; italic: string; excerpt: string };

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
        {items.length > 0
          ? items.map((m) => {
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
                    style={m.image_url ? { backgroundImage: `url(${m.image_url})` } : undefined}
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
              const href = safeUrl(m.url);
              return href ? (
                <a
                  key={m.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {inner}
                </a>
              ) : (
                <div key={m.id}>{inner}</div>
              );
            })
          : (lj.raw("topics") as Topic[]).map((topic, i) => (
              <article key={topic.tag} className="j-card is-soon">
                <div className="j-meta">
                  <span>{topic.tag}</span>
                  <span className="j-soon">{lj("soon")}</span>
                </div>
                <div className="j-img" style={{ backgroundImage: `url(${TOPIC_IMGS[i]})` }} />
                <h3 className="j-title">
                  {topic.pre}
                  <em>{topic.italic}</em>
                </h3>
                <p className="j-excerpt">{topic.excerpt}</p>
              </article>
            ))}
      </div>
    </section>
  );
}
