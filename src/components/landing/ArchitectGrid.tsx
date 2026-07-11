"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArchitectCard } from "./ArchitectCard";
import { ArchitectDrawer } from "./ArchitectDrawer";
import type { ArchitectRow } from "./ArchitectIndex";

const FILTERS = [
  "all",
  "Résidentiel",
  "Hospitalité",
  "Commercial",
  "Urbain",
  "Culturel",
] as const;

export function ArchitectGrid({ architects }: { architects: ArchitectRow[] }) {
  const t = useTranslations("architects");
  const lt = useTranslations("landing.architects");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [open, setOpen] = useState<ArchitectRow | null>(null);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? architects
        : architects.filter((a) => a.specialties.includes(filter)),
    [filter, architects]
  );

  return (
    <>
      <div className="archi-controls">
        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? "on" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? t("filterAll") : f}
            </button>
          ))}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--concrete-2)",
          }}
        >
          {filtered.length} {lt("shown")} · {architects.length} {lt("verifiedPlural")}
        </div>
      </div>
      <div className="archi-grid">
        {filtered.map((a, i) => (
          <ArchitectCard
            key={a.id}
            a={a}
            index={i}
            total={architects.length}
            onOpen={() => setOpen(a)}
          />
        ))}
      </div>
      <ArchitectDrawer architect={open} onClose={() => setOpen(null)} />
    </>
  );
}
