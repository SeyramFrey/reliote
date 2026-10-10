"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { legalNoticeVariant } from "@/lib/legal/notice";
import { cn } from "@/lib/utils";

// Mention CGU / confidentialité sous un formulaire. `published` vient du
// serveur (getPublishedLegalSlugs) : sans page publiée, rien n'est rendu. Les
// liens s'ouvrent à part pour ne pas perdre une saisie en cours.
export function LegalNotice({
  published,
  action,
  className,
}: {
  published: readonly string[];
  action: "register" | "project" | "architect";
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("legalNotice");
  const variant = legalNoticeVariant(published);
  if (!variant) return null;

  const link = (slug: string) => {
    const DocLink = (chunks: React.ReactNode) => (
      <Link
        href={`/${locale}/legal/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-ink"
      >
        {chunks}
      </Link>
    );
    return DocLink;
  };

  return (
    <p className={cn("text-[12.5px] leading-relaxed text-concrete-2 max-w-[60ch]", className)}>
      {t.rich(variant, {
        action: t(`action.${action}`),
        cgu: link("cgu"),
        privacy: link("confidentialite"),
      })}
    </p>
  );
}
