import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("nav");
  return (
    <main className="page-edge py-16">
      <p className="eyebrow">01 — Reliote</p>
      <h1 className="serif-i text-6xl mt-4">{t("cta")}</h1>
      <div className="hairline mt-8" />
    </main>
  );
}
