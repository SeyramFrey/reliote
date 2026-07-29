import { getLocale, getTranslations } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SectionHead } from "./SectionHead";

// Bloc D — Journal alimenté par la table media_items (contenu géré depuis l'admin).
// Fallback : si aucune ligne publiée, on retombe sur le contenu i18n d'origine
// pour ne jamais laisser la section vide pendant la transition.

const KEYS = ["j1", "j2", "j3"] as const;
const IMGS = [
  "/assets/img-museum-mist.jpg",
  "/assets/img-redrock-pool.jpg",
  "/assets/img-stairs-water.jpg",
];

type MediaItem = {
  id: string;
  title_fr: string;
  title_en: string;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  image_url: string | null;
  read_time: string | null;
  date: string | null;
  url: string | null;
};

export async function Journal() {
  const locale = await getLocale();
  const en = locale === "en";
  const j = await getTranslations("journal");
  const lj = await getTranslations("landing.journal");
  const cards = lj.raw("cards") as { pre: string; italic: string }[];

  const service = createServiceClient();
  const { data } = (await service
    .from("media_items")
    .select("id, title_fr, title_en, excerpt_fr, excerpt_en, image_url, read_time, date, url")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: MediaItem[] | null };
  const items = data ?? [];

  return (
    <section className="sect" id="journal" style={{ background: "var(--paper-2)" }}>
      <SectionHead
        num={j("eyebrow")}
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
                  <span
                    className="mono"
                    style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}
                  >
                    {lj("more")}
                  </span>
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
            })
          : KEYS.map((k, i) => (
              <article key={k} className="j-card">
                <div className="j-meta">
                  <span>{j(`${k}.read`)}</span>
                  <span>{j(`${k}.date`)}</span>
                </div>
                <div className="j-img" style={{ backgroundImage: `url(${IMGS[i]})` }} />
                <h3 className="j-title">
                  {cards[i].pre}
                  <em>{cards[i].italic}</em>
                </h3>
                <p className="j-excerpt">{j(`${k}.excerpt`)}</p>
                <span
                  className="mono"
                  style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  {lj("more")}
                </span>
              </article>
            ))}
      </div>
    </section>
  );
}
