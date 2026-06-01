"use client";
import Image from "next/image";
import type { ArchitectRow } from "./ArchitectIndex";

export function ArchitectCard({ a, onOpen }: { a: ArchitectRow; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="text-left group">
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-2">
        {a.photo_url && (
          <Image
            src={a.photo_url}
            alt={a.full_name}
            fill
            className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.04]"
            sizes="(min-width: 768px) 25vw, 50vw"
          />
        )}
        <span className="absolute top-3 left-3 mono text-[10px] tracking-[0.18em] uppercase text-paper/90 bg-water/40 px-2 py-1">
          {a.years_experience} ans
        </span>
        <span
          className={`absolute top-3 right-3 inline-flex items-center gap-1.5 mono text-[10px] tracking-[0.18em] uppercase ${
            a.availability === "available" ? "text-paper" : "text-paper/70"
          } bg-water/40 px-2 py-1`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              a.availability === "available" ? "bg-brass animate-pulse" : "bg-concrete-3"
            }`}
          />
          {a.availability === "available" ? "Disponible" : "Complet"}
        </span>
      </div>
      <div className="mt-3 flex justify-between items-baseline">
        <h4 className="font-medium text-[15px]">{a.full_name}</h4>
        <span className="mono text-[12px]">{a.rating?.toFixed(1)}★</span>
      </div>
      <p className="eyebrow mt-1">{a.city}</p>
      <p className="mt-2 text-[12px] text-concrete-1">{a.specialties.join(" · ")}</p>
    </button>
  );
}
