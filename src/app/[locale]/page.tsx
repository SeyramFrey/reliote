import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { TrustRail } from "@/components/landing/TrustRail";
import { Pillars } from "@/components/landing/Pillars";
import { MethodProof } from "@/components/landing/MethodProof";
import { Process } from "@/components/landing/Process";
import { MapTerritoire } from "@/components/landing/MapTerritoire";
import { FeaturedCaseView } from "@/components/landing/FeaturedCaseView";
import { Audiences } from "@/components/landing/Audiences";
import { Journal } from "@/components/landing/Journal";
import { CtaBand } from "@/components/landing/CtaBand";
import { PartnersOrbit } from "@/components/landing/PartnersOrbit";
import { Footer } from "@/components/landing/Footer";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { IntroGate } from "@/components/landing/intro/IntroGate";
import { getFeaturedRow, getPublishedMedia } from "@/lib/landing/data";
import { toFeaturedContent } from "@/lib/landing/featured";
import { numberSections, type LandingSection } from "@/lib/landing/sections";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { localizedAlternates, ogImage } from "@/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = safeLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    alternates: localizedAlternates(locale, ""),
    // openGraph remplace celui du layout (fusion superficielle) : complet ici.
    openGraph: {
      type: "website",
      siteName: "Reliote",
      locale: locale === "en" ? "en_GB" : "fr_FR",
      title: t("title"),
      description: t("description"),
      url: `/${locale}`,
      images: [ogImage(locale)],
    },
  };
}

export default async function Page() {
  const locale = safeLocale(await getLocale());
  const [featuredRow, media] = await Promise.all([getFeaturedRow(), getPublishedMedia()]);
  const featured = toFeaturedContent(featuredRow, locale);

  // Étude de cas et Journal n'apparaissent qu'avec du contenu publié ; la
  // numérotation suit ce qui est réellement affiché.
  const shown: LandingSection[] = [
    "pillars",
    "audiences",
    "method",
    "process",
    "territoire",
    ...(featured ? (["featured"] as const) : []),
    ...(media.length > 0 ? (["journal"] as const) : []),
    "cta",
  ];
  const num = numberSections(shown) as Record<LandingSection, string>;

  return (
    <>
      <IntroGate />
      {/* La hero n'est pas dupliquée : le carré qui grandit à la fin de la
          séquence, c'est cette page même, mise à l'échelle. */}
      <div id="page-zoom">
        <Nav dark showJournal={media.length > 0} />
        <SmoothScroll />
        <main>
          <Hero />
          <StatsBar />
          <TrustRail />
          <Pillars num={num.pillars} />
          <Audiences num={num.audiences} />
          <MethodProof num={num.method} />
          <Process num={num.process} />
          <MapTerritoire num={num.territoire} />
          {featured && <FeaturedCaseView content={featured} num={num.featured} />}
          {media.length > 0 && <Journal items={media} num={num.journal} />}
          <PartnersOrbit />
          <CtaBand num={num.cta} />
        </main>
        <Footer />
      </div>
    </>
  );
}
