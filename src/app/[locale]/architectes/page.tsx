import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { ArchitectIndex } from "@/components/landing/ArchitectIndex";

export default function Page() {
  return (
    <>
      <Nav />
      <div className="pt-24">
        <ArchitectIndex />
      </div>
      <Footer />
    </>
  );
}
