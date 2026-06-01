import { Nav } from "@/components/shared/Nav";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { Pillars } from "@/components/landing/Pillars";
import { ArchitectIndex } from "@/components/landing/ArchitectIndex";
import { Process } from "@/components/landing/Process";
import { FeaturedCase } from "@/components/landing/FeaturedCase";
import { Audiences } from "@/components/landing/Audiences";
import { Journal } from "@/components/landing/Journal";
import { CtaBand } from "@/components/landing/CtaBand";
import { Footer } from "@/components/landing/Footer";

export default function Page() {
  return (
    <>
      <Nav dark />
      <Hero />
      <StatsBar />
      <Pillars />
      <ArchitectIndex />
      <Process />
      <FeaturedCase />
      <Audiences />
      <Journal />
      <CtaBand />
      <Footer />
    </>
  );
}
