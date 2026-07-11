"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

type StepMeta = { n: string; t: string };

// Full-page two-column wizard shell.
// Left: sticky aside with brand + step list (with active highlight + check marks for done steps).
// Right: form body fills the viewport. Step 6 (the recap) opts into full width via `wide`.
export function WizardShell({
  step,
  totalSteps,
  eyebrow,
  title,
  steps,
  children,
  onBack,
  onNext,
  nextLabel,
  backLabel,
  submitting,
  wide = false,
}: {
  step: number;
  totalSteps: number;
  eyebrow: string;
  title: ReactNode;
  steps: StepMeta[];
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel: string;
  backLabel: string;
  submitting?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[320px_1fr] bg-paper">
      {/* Sticky aside — brand + step list */}
      <aside
        className="hidden md:flex flex-col gap-7 p-10 sticky top-0 self-start h-screen"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(7,62,24,0.94), rgba(5,30,12,0.96)), url(/assets/img-redrock-pool.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "var(--color-paper)",
        }}
      >
        <div className="flex items-center gap-[10px]">
          <span className="inline-grid place-items-center w-[22px] h-[22px] border border-current font-display text-[13px] leading-none pt-px">
            R
          </span>
          <span className="font-sans font-medium tracking-[0.18em] text-[13px]">RELIOTE</span>
        </div>
        <span className="mono text-[10.5px] tracking-[0.18em] uppercase opacity-65">
          {eyebrow}
        </span>
        <ol className="space-y-px">
          {steps.map((s, i) => {
            const done = i + 1 < step;
            const active = i + 1 === step;
            return (
              <li
                key={s.n}
                className={`grid grid-cols-[28px_1fr_18px] items-center gap-3 py-3 border-b border-paper/10 transition-colors ${
                  active
                    ? "text-paper"
                    : done
                      ? "text-brass/90"
                      : "text-paper/55"
                }`}
              >
                <span className="mono text-[10.5px] tracking-[0.14em]">{s.n}</span>
                <span className="text-[13.5px]">{s.t}</span>
                <span
                  className={`w-3.5 h-3.5 rounded-full border grid place-items-center text-[8px] leading-none ${
                    done
                      ? "border-brass bg-brass text-water"
                      : active
                        ? "border-paper"
                        : "border-paper/40"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-auto mono text-[10.5px] tracking-[0.16em] uppercase opacity-55">
          Paris ⇄ Abidjan · 48.85°N / 5.34°W
        </div>
      </aside>

      {/* Body */}
      <section className="px-[var(--edge)] py-16 md:py-20">
        <div
          className={`mx-auto ${wide ? "max-w-[1200px]" : "max-w-[860px]"} transition-all`}
        >
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
          <h1 className="font-light text-[clamp(36px,4.4vw,64px)] leading-[1.04] mt-10 max-w-[20ch]">
            {title}
          </h1>
          <div className="mt-12">
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
          <div className="mt-12 flex justify-between items-center pt-8 border-t border-[var(--hairline)]">
            <button
              type="button"
              onClick={onBack}
              disabled={!onBack}
              className="text-sm mono tracking-[0.18em] uppercase opacity-70 disabled:opacity-30 hover:opacity-100 transition-opacity"
            >
              ← {backLabel}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={submitting}
              className="px-6 py-3 bg-green text-paper text-sm inline-flex items-center gap-2 disabled:opacity-60 hover:bg-green-deep transition-colors"
            >
              {submitting ? "…" : nextLabel}
              <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
