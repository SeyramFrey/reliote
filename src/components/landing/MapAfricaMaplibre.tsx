"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import "maplibre-gl/dist/maplibre-gl.css";
import africaFeatures from "@/lib/countries/africa.features.json";
import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";
import type { Presence } from "@/lib/countries/presence";

// Version B — a real WebGL vector map (MapLibre GL JS, no React peer dep → safe
// on React 19). No external tiles or API key: an offline style paints a local
// GeoJSON of Africa with a data-driven fill keyed by iso2. maplibre-gl is
// imported dynamically inside the effect so its window/WebGL access never runs
// during SSR.
//
// NB: pinned to maplibre-gl v4 — v6 (latest) ships a Web Worker that never
// completes under this project's Next 16 / Turbopack dev server (the GeoJSON
// source stays unloaded, no error surfaces), so the map never renders. v4's
// worker loads correctly here.

const TOTAL = AFRICAN_COUNTRIES.length;
const NAME_BY_ISO = new Map(AFRICAN_COUNTRIES.map((c) => [c.iso2, c.name]));

const BRASS = "#b89968";
const BRASS_HI = "#d8c194";
const FILL_FAINT = "rgba(243,241,236,0.05)";
const LINE_FAINT = "rgba(243,241,236,0.16)";
const DOT_FAINT = "rgba(243,241,236,0.28)";
const MAP_BG = "#07120f";

type Feat = {
  properties: { iso2: string; name?: string; kind: string };
  geometry: { type: string; coordinates: unknown };
};
const FC = africaFeatures as unknown as { features: Feat[] };

// Flatten arbitrarily-nested coordinate arrays into [lon,lat] pairs.
function eachCoord(coords: unknown, fn: (lng: number, lat: number) => void) {
  const a = coords as number[] | number[][];
  if (typeof (a as number[])[0] === "number") {
    fn((a as number[])[0], (a as number[])[1]);
  } else {
    for (const c of a as unknown[]) eachCoord(c, fn);
  }
}
function bounds(feats: Feat[]): [[number, number], [number, number]] {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  for (const f of feats)
    eachCoord(f.geometry.coordinates, (x, y) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
  return [[minX, minY], [maxX, maxY]];
}
function center(f: Feat): [number, number] {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  eachCoord(f.geometry.coordinates, (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

type LitLabel = { iso2: string; html: string };

export function MapAfricaMaplibre({ presence }: { presence: Presence }) {
  const t = useTranslations("landing.territoire");
  const ref = useRef<HTMLDivElement>(null);

  // Snapshot render-time data + translated labels so the map effect can run
  // once on mount instead of re-creating the map on every render — t has an
  // unstable identity, which would otherwise tear the map down before it loads.
  const dataRef = useRef<{ litIsos: string[]; litLabels: LitLabel[] }>({ litIsos: [], litLabels: [] });
  useEffect(() => {
    dataRef.current = {
      litIsos: presence.lit.map((l) => l.iso2),
      litLabels: presence.lit.map((l) => ({
        iso2: l.iso2,
        html: `<b>${l.name}</b><span>${t("tooltipArchitects", { count: l.count })}</span>`,
      })),
    };
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let map: import("maplibre-gl").Map | undefined;
    let ro: ResizeObserver | undefined;
    let cancelled = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !el) return;

      const { litIsos } = dataRef.current;
      // match needs ≥1 label; fall back to a constant when nothing is lit.
      const byLit = <T,>(litVal: T, elseVal: T) =>
        litIsos.length
          ? (["match", ["get", "iso2"], litIsos, litVal, elseVal] as unknown)
          : (elseVal as unknown);

      const m = new maplibregl.Map({
        container: el,
        attributionControl: { compact: true, customAttribution: "© Natural Earth" },
        bounds: bounds(FC.features),
        fitBoundsOptions: { padding: 16 },
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
        style: {
          version: 8,
          sources: {
            africa: { type: "geojson", data: africaFeatures as unknown as GeoJSON.FeatureCollection },
          },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": MAP_BG } },
            {
              id: "fill",
              type: "fill",
              source: "africa",
              paint: {
                "fill-color": byLit(BRASS, FILL_FAINT) as never,
                "fill-opacity": (litIsos.length ? byLit(0.82, 1) : 1) as never,
              },
            },
            {
              id: "line",
              type: "line",
              source: "africa",
              paint: {
                "line-color": byLit(BRASS_HI, LINE_FAINT) as never,
                "line-width": byLit(1.4, 0.5) as never,
              },
            },
            {
              id: "dots",
              type: "circle",
              source: "africa",
              // Circle layers render a point at EVERY vertex of any geometry;
              // restrict to the island Point features so polygons stay clean.
              filter: ["==", ["geometry-type"], "Point"],
              paint: {
                "circle-radius": byLit(6, 3.2) as never,
                "circle-color": byLit(BRASS, DOT_FAINT) as never,
                "circle-stroke-color": BRASS_HI,
                "circle-stroke-width": byLit(1.2, 0) as never,
              },
            },
          ],
        },
      });
      map = m;

      // Keep the WebGL canvas sized to its container — covers the case where the
      // map initialises while the section is off-screen / the pane is hidden
      // (observe() fires once immediately with the current size).
      ro = new ResizeObserver(() => m.resize());
      ro.observe(el);

      m.on("error", (e) => console.error("[maplibre]", (e as { error?: Error }).error?.message ?? e));

      const decorate = () => {
        const { litLabels } = dataRef.current;
        const litSet = new Set(litIsos);

        // Persistent labels on lit countries (name + count) — no glyph server
        // needed since these are HTML popups.
        for (const l of litLabels) {
          const f = FC.features.find((x) => x.properties.iso2 === l.iso2);
          if (!f) continue;
          new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "t-ml-pop lit" })
            .setLngLat(center(f))
            .setHTML(l.html)
            .addTo(m);
        }

        // Hover name popup for the (unlit) rest.
        const hover = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "t-ml-pop" });
        for (const layer of ["fill", "dots"]) {
          m.on("mousemove", layer, (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const iso = f.properties?.iso2 as string;
            m.getCanvas().style.cursor = "pointer";
            if (litSet.has(iso)) {
              hover.remove();
              return;
            }
            hover.setLngLat(e.lngLat).setHTML(`<b>${NAME_BY_ISO.get(iso) ?? iso}</b>`).addTo(m);
          });
          m.on("mouseleave", layer, () => {
            m.getCanvas().style.cursor = "";
            hover.remove();
          });
        }
      };

      // Decorate once the style is ready — guard against the case where 'load'
      // has already fired by the time we get here.
      if (m.isStyleLoaded()) decorate();
      else m.on("load", decorate);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
    };
    // Mount once: live data is read from dataRef, so no dep-driven re-creation.
  }, []);

  return (
    <div className="territoire-map">
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
        <b>WEBGL · MAPLIBRE</b>
      </span>
      <div ref={ref} className="t-ml-canvas" />
    </div>
  );
}
