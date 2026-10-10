import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { ErrorScreen, type ErrorCopy } from "@/components/shared/ErrorScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors.notFound");
  return { title: t("eyebrow") };
}

// 404 localisée : notFound() appelé sous [locale], et toute URL /fr/… ou
// /en/… qui ne correspond à aucune route (voir [...rest]).
export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("errors.notFound");
  const copy: ErrorCopy = {
    eyebrow: t("eyebrow"),
    titlePre: t("titlePre"),
    titleItalic: t("titleItalic"),
    body: t("body"),
  };
  return (
    <>
      <Nav dark />
      <ErrorScreen
        code="404"
        copy={copy}
        actions={
          <>
            <Link
              href={`/${locale}`}
              className="btn btn-primary"
              style={{ background: "var(--paper)", color: "var(--ink)" }}
            >
              {t("home")} <span className="btn-arrow" />
            </Link>
            <Link
              href={`/${locale}/projets/initier`}
              className="btn btn-ghost on-dark"
              style={{ color: "var(--paper)", borderColor: "rgba(243,241,236,0.3)" }}
            >
              {t("project")}
            </Link>
          </>
        }
      />
    </>
  );
}
