"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// Mobile : le bouton « Initier un projet » reste à portée de pouce une fois
// la hero passée. Il s'efface quand le bandeau final (qui porte le même appel)
// ou le pied de page sont à l'écran.
export function MobileCtaBar() {
  const locale = useLocale();
  const t = useTranslations("landing");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ends = [...document.querySelectorAll(".cta-band, footer")];
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onScreen.add(e.target);
        else onScreen.delete(e.target);
      }
      update();
    });
    const update = () => setVisible(window.scrollY > window.innerHeight * 0.8 && onScreen.size === 0);
    ends.forEach((el) => io.observe(el));
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline)] bg-[var(--paper)] px-[var(--edge)] pt-3 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <Link
        href={`/${locale}/projets/initier`}
        tabIndex={visible ? 0 : -1}
        className="btn btn-primary w-full justify-center"
      >
        {t("mobileCta")} <span className="btn-arrow" />
      </Link>
    </div>
  );
}
