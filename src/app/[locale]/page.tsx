import { useTranslations } from "next-intl";
import { Nav } from "@/components/shared/Nav";

export default function Page() {
  const t = useTranslations("nav");
  return (
    <>
      <Nav />
      <main className="page-edge pt-32 pb-16">
        <p className="eyebrow">01 — Reliote</p>
        <h1 className="serif-i text-6xl mt-4">{t("cta")}</h1>
        <div style={{ height: "200vh" }} />
      </main>
    </>
  );
}
