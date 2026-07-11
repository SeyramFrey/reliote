import { Nav } from "@/components/shared/Nav";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { TrustRail } from "@/components/landing/TrustRail";
import { Pillars } from "@/components/landing/Pillars";
import { TerresApproche } from "@/components/landing/TerresApproche";
import { MethodProof } from "@/components/landing/MethodProof";
import { Process } from "@/components/landing/Process";
import { MapTerritoire } from "@/components/landing/MapTerritoire";
import { FeaturedCase } from "@/components/landing/FeaturedCase";
import { Audiences } from "@/components/landing/Audiences";
import { Journal } from "@/components/landing/Journal";
import { CtaBand } from "@/components/landing/CtaBand";
import { Footer } from "@/components/landing/Footer";

export default function Page() {
  return (
    <>
      <Nav dark />
      <main>
        <Hero />
        <StatsBar />
        <TrustRail />
        <Pillars />
        <Audiences />
        <TerresApproche />
        <MethodProof />
        <Process />
        <MapTerritoire />
        <FeaturedCase />
        <Journal />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
