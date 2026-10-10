import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/seo/site";
import { fontVariables } from "../fonts";
import "@/styles/globals.css";
import "@/styles/landing.css";

// Valeurs par défaut de tout le site ; chaque page précise titre, canonical
// et hreflang. L'image de partage vient de ./opengraph-image.tsx.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = hasLocale(locales, raw) ? raw : defaultLocale;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("title"), template: "%s — Reliote" },
    description: t("description"),
    applicationName: "Reliote",
    openGraph: {
      type: "website",
      siteName: "Reliote",
      locale: locale === "en" ? "en_GB" : "fr_FR",
      title: t("title"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image" },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={fontVariables}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
