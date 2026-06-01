"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArchitectCard } from "./ArchitectCard";
import { ArchitectDrawer } from "./ArchitectDrawer";
import type { ArchitectRow } from "./ArchitectIndex";

const FILTERS = ["all", "Résidentiel", "Hospitalité", "Commercial", "Urbain", "Culturel"] as const;

export function ArchitectGrid({ architects }: { architects: ArchitectRow[] }) {
  const t = useTranslations("architects");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [open, setOpen] = useState<ArchitectRow | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? architects : architects.filter((a) => a.specialties.includes(filter))),
    [filter, architects]
  );

  return (
    <>
      <div className="mt-10 flex flex-wrap gap-1 border-b border-[var(--hairline)] pb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-[12px] mono tracking-[0.1em] uppercase rounded-full transition-colors ${
              filter === f ? "bg-ink text-paper" : "text-concrete-1 hover:text-ink"
            }`}
          >
            {f === "all" ? t("filterAll") : f}
          </button>
        ))}
        <span className="ml-auto eyebrow self-center">
          {filtered.length} {t("count")}
        </span>
      </div>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-[var(--gutter)]">
        {filtered.map((a) => (
          <ArchitectCard key={a.id} a={a} onOpen={() => setOpen(a)} />
        ))}
      </div>
      <ArchitectDrawer architect={open} onClose={() => setOpen(null)} />
    </>
  );
}
