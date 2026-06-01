"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { ArchitectRow } from "./ArchitectIndex";

export function ArchitectDrawer({ architect, onClose }: { architect: ArchitectRow | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {architect && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-water/60"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.5 }}
            className="fixed top-0 right-0 z-[70] h-full w-full md:w-[640px] bg-paper text-ink overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-5 right-5 mono text-[11px] tracking-[0.18em] uppercase">
              Fermer ✕
            </button>
            <div className="page-edge py-16">
              <p className="eyebrow">{architect.city}</p>
              <h3 className="font-light text-5xl mt-2 leading-tight">{architect.full_name}</h3>
              <p className="mt-3 text-concrete-1">{architect.specialties.join(" · ")}</p>
              {architect.photo_url && (
                <div className="mt-8 relative aspect-[4/3]">
                  <Image src={architect.photo_url} alt={architect.full_name} fill className="object-cover" sizes="640px" />
                </div>
              )}
              <p className="mt-8">{architect.description}</p>
              <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="eyebrow">Expérience</dt>
                  <dd>{architect.years_experience} ans</dd>
                </div>
                <div>
                  <dt className="eyebrow">Note</dt>
                  <dd>{architect.rating?.toFixed(1)}★</dd>
                </div>
                <div>
                  <dt className="eyebrow">Langues</dt>
                  <dd>{architect.languages.join(", ")}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Honoraires</dt>
                  <dd>{architect.fee_from ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
