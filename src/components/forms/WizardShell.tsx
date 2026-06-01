"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

export function WizardShell({
  step,
  totalSteps,
  eyebrow,
  title,
  children,
  onBack,
  onNext,
  nextLabel,
  backLabel,
  submitting,
}: {
  step: number;
  totalSteps: number;
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel: string;
  backLabel: string;
  submitting?: boolean;
}) {
  return (
    <section className="page-edge py-32">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{eyebrow}</span>
          <span className="mono text-[11px] tracking-[0.18em] uppercase text-concrete-2">
            {String(step).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>
        </div>
        <div className="relative h-px bg-[var(--hairline)] mt-3">
          <span
            className="absolute left-0 top-0 h-px bg-green transition-[width] duration-[400ms]"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <h1 className="font-light text-[clamp(32px,4vw,56px)] leading-[1.05] mt-10">{title}</h1>
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-12 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            className="text-sm mono tracking-[0.18em] uppercase opacity-70 disabled:opacity-30"
          >
            ← {backLabel}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={submitting}
            className="px-6 py-3 bg-green text-paper text-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? "…" : nextLabel}
            <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
          </button>
        </div>
      </div>
    </section>
  );
}
