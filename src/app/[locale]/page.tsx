import { useTranslations } from "next-intl";
import { LangSwitch } from "@/components/shared/LangSwitch";

export default function Page() {
  const t = useTranslations("nav");
  return (
    <main className="page-edge py-16">
      <div className="flex justify-end mb-8"><LangSwitch /></div>
      <p className="eyebrow">01 — Reliote</p>
      <h1 className="serif-i text-6xl mt-4">{t("cta")}</h1>
    </main>
  );
}
