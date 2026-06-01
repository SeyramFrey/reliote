import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Eyebrow } from "@/components/shared/Eyebrow";

export async function Hero() {
  const locale = await getLocale();
  const t = await getTranslations("hero");
  return (
    <section id="top" className="relative min-h-screen bg-water text-paper overflow-hidden">
      <div className="absolute inset-0 bg-[url('/assets/img-courtyard-pool.jpg')] bg-cover bg-[center_30%] brightness-[0.62] contrast-[1.05] saturate-[0.7] scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-b from-water/55 via-water/20 to-water" />
      <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:3px_3px] mix-blend-overlay opacity-60 pointer-events-none" />
      <div className="absolute top-[120px] left-[var(--edge)] mono text-[10px] tracking-[0.18em] uppercase text-paper/60">48°51′24″N — Paris</div>
      <div className="absolute bottom-[120px] right-[var(--edge)] mono text-[10px] tracking-[0.18em] uppercase text-paper/60">5°20′08″N — Abidjan</div>
      <div className="relative z-10 min-h-screen flex flex-col pt-[120px] pb-8 page-edge">
        <Eyebrow className="text-paper/70">{t("eyebrow")}</Eyebrow>
        <h1 className="font-light text-[clamp(48px,7.5vw,116px)] leading-[0.96] tracking-[-0.025em] mt-8 text-balance">
          {t("titlePre")}<em className="serif-i tracking-[-0.005em]">{t("titleItalic")}</em><br />
          {t("titleRest")}
        </h1>
        <p className="text-[15px] leading-[1.55] text-paper/80 max-w-[38ch] mt-7 mb-9">{t("sub")}</p>
        <div className="flex gap-4 flex-wrap">
          <Link href={`/${locale}/projets/initier`} className="inline-flex items-center gap-2.5 px-5 py-3 bg-green text-paper text-[13px] hover:bg-green-deep transition-colors">{t("primary")}<span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" /></Link>
          <Link href={`/${locale}/architectes`} className="inline-flex items-center gap-2.5 px-5 py-3 border border-current text-paper/90 text-[13px] hover:bg-white/5 transition-colors">{t("secondary")}</Link>
        </div>
        <div className="mt-auto flex items-center gap-8 mono text-[11px] tracking-[0.16em] uppercase text-paper/70">
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-brass align-middle mr-2 animate-pulse" />{t("liveLabel")}</span>
          <span>{t("liveName")}</span>
        </div>
      </div>
    </section>
  );
}
