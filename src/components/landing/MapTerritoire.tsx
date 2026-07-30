import { getTranslations } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/service";
import { aggregatePresence } from "@/lib/countries/presence";
import { SectionHead } from "./SectionHead";
import { PresencePanel, type PresenceLabels } from "./PresencePanel";
import { MapAfricaSvg } from "./MapAfricaSvg";
import { MapAfricaMaplibre } from "./MapAfricaMaplibre";

// Bloc Territoire — carte de présence Afrique. Serveur : agrège les architectes
// vérifiés par pays via createServiceClient() (bypass RLS, server-only) et ne
// transmet que des COMPTES, jamais une ligne architecte individuelle.
//
// SPIKE : rend deux versions de carte empilées (A = SVG inline, B = MapLibre GL)
// avec le même panneau droit réel, pour comparaison navigateur. La version non
// retenue et son artefact/dépendance seront supprimés avant le merge.

export async function MapTerritoire() {
  const t = await getTranslations("landing.territoire");

  const service = createServiceClient();
  const { data } = (await service
    .from("architect_profiles")
    .select("country")
    .eq("status", "verified")) as { data: { country: string | null }[] | null };

  const presence = aggregatePresence(data ?? []);

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
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        titleRest={t("titleRest")}
        kicker={t("kicker")}
      />
      <div className="territoire-versions">
        <div className="territoire-version">
          <div className="version-badge">
            <span className="vb-id">A</span> SVG inline · zéro dépendance
          </div>
          <div className="territoire-frame">
            <MapAfricaSvg presence={presence} />
            <PresencePanel presence={presence} labels={labels} />
          </div>
        </div>

        <div className="territoire-version">
          <div className="version-badge">
            <span className="vb-id">B</span> MapLibre GL · WebGL
          </div>
          <div className="territoire-frame">
            <MapAfricaMaplibre presence={presence} />
            <PresencePanel presence={presence} labels={labels} />
          </div>
        </div>
      </div>
    </section>
  );
}
