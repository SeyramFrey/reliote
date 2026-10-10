"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Nav } from "@/components/shared/Nav";
import { ErrorScreen } from "@/components/shared/ErrorScreen";

// Erreur applicative sous [locale] : le layout (et donc la langue) tient
// encore, seul le contenu de la page est remplacé.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("errors.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>{`${t("eyebrow")} — Reliote`}</title>
      <Nav dark />
      <ErrorScreen
        code="500"
        copy={{
          eyebrow: t("eyebrow"),
          titlePre: t("titlePre"),
          titleItalic: t("titleItalic"),
          body: t("body"),
        }}
        actions={
          <>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="btn btn-primary"
              style={{ background: "var(--paper)", color: "var(--ink)" }}
            >
              {t("retry")} <span className="btn-arrow" />
            </button>
            <Link
              href={`/${locale}`}
              className="btn btn-ghost on-dark"
              style={{ color: "var(--paper)", borderColor: "rgba(243,241,236,0.3)" }}
            >
              {t("home")}
            </Link>
          </>
        }
        footnote={error.digest ? `${t("ref")} · ${error.digest}` : undefined}
      />
    </>
  );
}
