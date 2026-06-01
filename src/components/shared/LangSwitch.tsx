"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/lib/i18n/config";
import styles from "./LangSwitch.module.css";

export function LangSwitch({ dark = false }: { dark?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("lang");
  const [pending, startTransition] = useTransition();

  function go(target: Locale) {
    if (target === locale) return;
    const next = pathname.replace(new RegExp(`^/${locale}`), `/${target}`);
    startTransition(() => router.replace(next));
  }

  return (
    <div className={`${styles.root} ${dark ? styles.dark : ""}`} data-pending={pending}>
      {locales.map((l, i) => (
        <button
          key={l}
          role="switch"
          aria-checked={l === locale}
          aria-label={t("switchTo", { target: t(l) })}
          className={`${styles.letter} ${l === locale ? styles.active : ""}`}
          onClick={() => go(l)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              const idx = locales.indexOf(l);
              const target = locales[(idx + (e.key === "ArrowRight" ? 1 : locales.length - 1)) % locales.length];
              const el = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[locales.indexOf(target)];
              el?.focus();
            }
          }}
        >
          {t(l)}
          {i === 0 && <span className={styles.divider} aria-hidden />}
        </button>
      ))}
      <span className={styles.rule} aria-hidden />
      <span
        className={styles.tick}
        style={{ transform: `translateX(${locale === "en" ? 100 : 0}%)` }}
        aria-hidden
      />
    </div>
  );
}
