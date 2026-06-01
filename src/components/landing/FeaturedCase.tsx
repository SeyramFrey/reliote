"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/shared/Eyebrow";

const IMGS = [
  "/assets/img-courtyard-pool.jpg",
  "/assets/img-redrock-pool.jpg",
  "/assets/img-museum-mist.jpg",
];

function useCounter(target: number, run: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const d = 1400;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / d);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return v;
}

const HOTSPOTS = [
  { x: 28, y: 38, k: "h1" as const },
  { x: 68, y: 30, k: "h2" as const },
  { x: 42, y: 72, k: "h3" as const },
];

function StatCard({
  n,
  suf,
  label,
  run,
}: {
  n: number;
  suf: string;
  label: string;
  run: boolean;
}) {
  const v = useCounter(n, run);
  return (
    <div className="border-t border-paper/20 pt-4">
      <span className="font-display text-5xl">
        {v}
        {suf}
      </span>
      <p className="eyebrow text-paper/60 mt-2">{label}</p>
    </div>
  );
}

export function FeaturedCase() {
  const t = useTranslations("featured");
  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setRun(true),
      { threshold: 0.4 },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % IMGS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const stats: { n: number; suf: string; label: string }[] = [
    { n: 480, suf: " m²", label: t("stats.area") },
    { n: 18, suf: " mois", label: t("stats.duration") },
    { n: 23, suf: "", label: t("stats.craftsmen") },
    { n: 100, suf: "%", label: t("stats.milestones") },
  ];

  return (
    <section id="projets" ref={ref} className="bg-water text-paper">
      <div className="page-edge py-32">
        <Eyebrow className="text-paper/70">05 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">
          {t("titlePre")}
          <em className="serif-i">{t("titleItalic")}</em>
        </h2>
        <p className="text-paper/70 max-w-[60ch] mt-6">{t("kicker")}</p>
        <div className="mt-16 grid grid-cols-12 gap-[var(--gutter)]">
          <div className="col-span-12 md:col-span-8 relative aspect-[16/10] overflow-hidden">
            {IMGS.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                className={`object-cover transition-opacity duration-[800ms] ${i === idx ? "opacity-100" : "opacity-0"}`}
                sizes="800px"
                priority={i === 0}
              />
            ))}
            {idx === 0 &&
              HOTSPOTS.map((h) => (
                <span
                  key={h.k}
                  className="absolute group"
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                >
                  <span className="block w-3 h-3 rounded-full bg-brass ring-4 ring-brass/30 animate-pulse" />
                  <span className="absolute left-5 top-1 whitespace-nowrap text-[11px] mono uppercase tracking-[0.18em] opacity-0 group-hover:opacity-100 bg-water/80 px-2 py-1 transition-opacity">
                    {t(`hotspots.${h.k}.t`)}
                  </span>
                </span>
              ))}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {IMGS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`w-8 h-px ${i === idx ? "bg-paper" : "bg-paper/40"} transition-colors`}
                />
              ))}
            </div>
          </div>
          <aside className="col-span-12 md:col-span-4 grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <StatCard key={i} {...s} run={run} />
            ))}
            <div className="col-span-2 mt-6">
              <p className="serif-i text-2xl leading-snug">«{t("quote")}»</p>
              <p className="eyebrow mt-3 text-paper/60">{t("cite")}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
