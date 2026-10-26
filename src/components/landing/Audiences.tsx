import { getLocale, getTranslations } from "next-intl/server";
import { AudienceDuo, type DuoCard } from "./AudienceDuo";

type Say = DuoCard["say"];

export async function Audiences({ num }: { num: string }) {
  const locale = await getLocale();
  const a = await getTranslations("audiences");
  const la = await getTranslations("landing.audiences");

  // Visuels GPT Image (1024 × 1536) : « la décision à distance » à gauche,
  // « l'architecte sur le chantier » à droite. Chacun garde calme la zone où
  // se pose le titre de sa carte (le haut à gauche, le bas à droite).
  const cards: [DuoCard, DuoCard] = [
    {
      href: `/${locale}/projets/initier`,
      image: "/assets/duo-client.jpg",
      eyebrow: a("client.eyebrow"),
      step: "→ 01 / 02",
      titlePre: la("client.titlePre"),
      titleItalic: la("client.titleItalic"),
      titleRest: la("client.titleRest"),
      cta: a("client.cta"),
      say: la.raw("client.say") as Say,
    },
    {
      href: `/${locale}/architectes/rejoindre`,
      image: "/assets/duo-architect.jpg",
      eyebrow: a("architect.eyebrow"),
      step: "→ 02 / 02",
      titlePre: la("architect.titlePre"),
      titleItalic: la("architect.titleItalic"),
      titleRest: la("architect.titleRest"),
      cta: a("architect.cta"),
      say: la.raw("architect.say") as Say,
    },
  ];

  return (
    <AudienceDuo
      num={num}
      head={{
        titlePre: la("head.titlePre"),
        titleItalic: la("head.titleItalic"),
        kicker: la("head.kicker"),
      }}
      cards={cards}
    />
  );
}
