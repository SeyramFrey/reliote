import { getTranslations } from "next-intl/server";
import { aggregatePresence } from "@/lib/countries/presence";
import { getVerifiedArchitects } from "@/lib/landing/data";
import { buildStatCells } from "@/lib/landing/stats";

// Bordered stat strip below the hero (.stat-strip / .stat-grid / .stat-cell).
// Real aggregates only — see buildStatCells.
export async function StatsBar() {
  const t = await getTranslations("stats");
  const presence = aggregatePresence(await getVerifiedArchitects());
  const items = buildStatCells(presence).map((c) => ({
    key: c.key,
    num: c.num ?? t(`${c.key}.num`),
    label: t(`${c.key}.label`),
  }));
  return (
    <div className="stat-strip">
      <div className="stat-grid">
        {items.map((s) => (
          <div key={s.key} className="stat-cell">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
