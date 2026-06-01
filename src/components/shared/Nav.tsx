"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { LangSwitch } from "./LangSwitch";
import { cn } from "@/lib/utils";

export function Nav({ dark = false }: { dark?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: { id: string; href: string }[] = [
    { id: "architects", href: `/${locale}/architectes` },
    { id: "approach",   href: `/${locale}#approche` },
    { id: "projects",   href: `/${locale}#projets` },
    { id: "journal",    href: `/${locale}#journal` },
    { id: "about",      href: `/${locale}#apropos` },
  ];

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 px-[var(--edge)] py-[18px] flex items-center justify-between transition-[background,color,border,padding] duration-[360ms] border-b border-transparent",
      scrolled && (dark
        ? "bg-water/70 backdrop-blur-md saturate-[1.05] text-paper border-white/10 py-3"
        : "bg-paper/85 backdrop-blur-md saturate-[1.05] border-[var(--hairline-soft)] py-3"),
      !scrolled && dark && "text-paper"
    )}>
      <Link href={`/${locale}`} aria-label="Reliote"><BrandMark /></Link>
      <nav className="hidden md:flex gap-7 text-[13px]">
        {links.map((l) => (
          <Link key={l.id} href={l.href} className="opacity-80 hover:opacity-100 transition-opacity relative group">
            {t(l.id)}
            <span className="absolute left-0 -bottom-1 h-px w-0 bg-current group-hover:w-full transition-[width] duration-300" />
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3.5">
        <LangSwitch dark={dark && !scrolled} />
        <Link href={`/${locale}/projets/initier`} className="inline-flex items-center gap-2.5 px-5 py-3 bg-green text-paper text-[13px] font-medium hover:bg-green-deep transition-colors">
          {t("cta")}
          <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
        </Link>
      </div>
    </header>
  );
}
