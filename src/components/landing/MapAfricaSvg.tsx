"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AFRICA_GEO, AFRICA_VIEWBOX } from "@/lib/countries/africaGeo";
import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";
import type { Presence } from "@/lib/countries/presence";

// Version A — inline SVG of Africa, zero runtime dependency. One <path> per
// mainland country + <circle> per small island state, keyed by iso2. Countries
// with ≥1 verified architect are "lit" (brass fill); the rest are faint
// outlines. Geometry is pre-projected (Mercator) in africaGeo.ts.

const TOTAL = AFRICAN_COUNTRIES.length;
const NAME_BY_ISO = new Map(AFRICAN_COUNTRIES.map((c) => [c.iso2, c.name]));

export function MapAfricaSvg({ presence }: { presence: Presence }) {
  const t = useTranslations("landing.territoire");
  const litByIso = new Map(presence.lit.map((l) => [l.iso2, l]));
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const clear = () => {
    setHoverIso(null);
    setPos(null);
  };

  const hoverLit = hoverIso ? litByIso.get(hoverIso) : undefined;

  return (
    <div className="territoire-map" onMouseMove={onMove} onMouseLeave={clear}>
      <span className="t-coord tl">
        {t("mapTitle")}
        <br />
        <b>
          {TOTAL} {t("statCountries")}
        </b>
      </span>
      <span className="t-coord tr">
        {t("presence")}
        <br />
        <b>
          {presence.totalCountries} · {presence.totalArchitects}
        </b>
      </span>
      <span className="t-coord bl">
        <b>PROJ. MERCATOR</b>
      </span>

      <svg viewBox={AFRICA_VIEWBOX} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t("mapTitle")}>
        <g>
          {AFRICA_GEO.map((g) => {
            const lit = litByIso.has(g.iso2);
            const cls = `t-country${lit ? " lit" : ""}${hoverIso === g.iso2 ? " hover" : ""}`;
            const handlers = {
              onMouseEnter: () => setHoverIso(g.iso2),
            };
            return g.d ? (
              <path key={g.iso2} d={g.d} className={cls} {...handlers} />
            ) : (
              <circle
                key={g.iso2}
                cx={g.cx}
                cy={g.cy}
                r={lit ? 5 : 3.2}
                className={`${cls} t-country-dot`}
                {...handlers}
              />
            );
          })}
        </g>
        <g className="t-country-labels" aria-hidden="true">
          {presence.lit.map((l) => {
            const g = AFRICA_GEO.find((x) => x.iso2 === l.iso2);
            if (!g) return null;
            return (
              <g key={l.iso2} transform={`translate(${g.cx} ${g.cy})`}>
                <circle r={3} className="t-lit-dot" />
                <text className="t-lit-name" x={0} y={-8} textAnchor="middle">
                  {l.name}
                </text>
                <text className="t-lit-count" x={0} y={18} textAnchor="middle">
                  {l.count}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {hoverIso && pos && (
        <div
          className="t-map-tip"
          style={{ left: pos.x, top: pos.y }}
          role="status"
        >
          <b>{NAME_BY_ISO.get(hoverIso) ?? hoverIso}</b>
          {hoverLit && (
            <span className="t-map-tip-n">
              {t("tooltipArchitects", { count: hoverLit.count })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
