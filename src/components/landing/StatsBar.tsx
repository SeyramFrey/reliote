import { getTranslations } from "next-intl/server";

// Bordered stat strip below the hero (.stat-strip / .stat-grid / .stat-cell).
export async function StatsBar() {
  const t = await getTranslations("stats");
  const items = ["a", "b", "c", "d"].map((k) => ({
    num: t(`${k}.num`),
    label: t(`${k}.label`),
  }));
  return (
    <div className="stat-strip">
      <div className="stat-grid">
        {items.map((s, i) => (
          <div key={i} className="stat-cell">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
