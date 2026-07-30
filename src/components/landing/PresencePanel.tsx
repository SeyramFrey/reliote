import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";
import type { Presence } from "@/lib/countries/presence";

// Shared right-hand panel for the Territoire block — real data, identical for
// both map versions during the spike so only the map itself is being compared.
// Pure presentational component (no hooks) → renders on the server.

const TOTAL = AFRICAN_COUNTRIES.length; // 54 eligible countries

export type PresenceLabels = {
  presence: string;
  activeCountries: string;
  legendLit: string;
  legendEligible: string;
  statCountries: string;
  statArchitects: string;
  meterLabel: string;
  soon: string;
};

export function PresencePanel({
  presence,
  labels,
}: {
  presence: Presence;
  labels: PresenceLabels;
}) {
  const { lit, totalCountries, totalArchitects } = presence;
  const pct = Math.max(2, Math.round((totalCountries / TOTAL) * 100));

  return (
    <aside className="territoire-side">
      <div className="t-panel">
        <div className="t-panel-head">
          <span>{labels.presence}</span>
          <span className="mono">
            {String(totalCountries).padStart(2, "0")} / {TOTAL}
          </span>
        </div>
        <div className="t-stat-row">
          <div>
            <div className="big">{totalCountries}</div>
            <div className="sub">{labels.statCountries}</div>
          </div>
          <div>
            <div className="big">{totalArchitects}</div>
            <div className="sub">{labels.statArchitects}</div>
          </div>
        </div>
        <div className="t-legend">
          <div className="t-legend-row">
            <span className="swatch lit" />
            {labels.legendLit}
          </div>
          <div className="t-legend-row">
            <span className="swatch eligible" />
            {labels.legendEligible}
          </div>
        </div>
      </div>

      <div className="t-panel">
        <div className="t-panel-head">
          <span>{labels.activeCountries}</span>
          <span className="mono">{String(lit.length).padStart(2, "0")}</span>
        </div>
        {lit.length === 0 ? (
          <p className="t-empty">{labels.soon}</p>
        ) : (
          <ul className="t-feed">
            {lit.map((c) => (
              <li key={c.iso2}>
                <span className="mono">{c.iso2}</span>
                <span>
                  <b>{c.name}</b>
                </span>
                <span className="t-feed-count mono">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="t-meter">
        <div className="t-meter-num">
          {totalCountries}
          <small> / {TOTAL}</small>
        </div>
        <div className="t-meter-lbl">{labels.meterLabel}</div>
        <div className="t-meter-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="t-meter-foot mono">
          <span>01</span>
          <span>27</span>
          <span>{TOTAL}</span>
        </div>
      </div>
    </aside>
  );
}
