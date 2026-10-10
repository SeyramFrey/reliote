import { getTranslations } from "next-intl/server";
import { getVerifiedArchitects } from "@/lib/landing/data";
import { aggregatePresence } from "@/lib/countries/presence";
import { SectionHead } from "./SectionHead";
import { PresencePanel, type PresenceLabels } from "./PresencePanel";
import { MapAfricaSvg } from "./MapAfricaSvg";

// Bloc Territoire — carte de présence Afrique. Serveur : agrège les architectes
// vérifiés par pays (getVerifiedArchitects, server-only) et ne transmet que des
// COMPTES, jamais une ligne architecte individuelle.
// Carte en SVG inline (géométrie générée : lib/countries/africaGeo.ts), sans
// dépendance ni WebGL.

export async function MapTerritoire({ num }: { num: string }) {
  const t = await getTranslations("landing.territoire");

  const presence = aggregatePresence(await getVerifiedArchitects());

  const labels: PresenceLabels = {
    presence: t("presence"),
    activeCountries: t("activeCountries"),
    legendLit: t("legendLit"),
    legendEligible: t("legendEligible"),
    statCountries: t("statCountries"),
    statArchitects: t("statArchitects"),
    meterLabel: t("meterLabel"),
    soon: t("soon"),
  };

  return (
    <section className="sect territoire-sect" id="territoire">
      <SectionHead
        num={num}
        label={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        titleRest={t("titleRest")}
        kicker={t("kicker")}
      />
      <div className="territoire-frame">
        <MapAfricaSvg presence={presence} />
        <PresencePanel presence={presence} labels={labels} />
      </div>
    </section>
  );
}
