"use client";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

export default function Project5() {
  const t = useTranslations("wizardClient");
  const v = useWatch();
  const rows: [string, string][] = [
    [t("fields.project_type"), v.project_type ?? "—"],
    [t("fields.project_location"), v.project_location ?? "—"],
    [t("fields.budget_range"), v.budget_range ?? "—"],
    [t("fields.timeline"), v.timeline ?? "—"],
    [t("fields.required_specialties"), (v.required_specialties ?? []).join(" · ") || "—"],
    [t("fields.client_name"), v.client_name ?? "—"],
    [t("fields.email"), v.email ?? "—"],
  ];
  return (
    <dl className="border-t border-[var(--hairline)]">
      {rows.map(([k, val]) => (
        <div key={k} className="flex justify-between py-3 border-b border-[var(--hairline-soft)]">
          <dt className="eyebrow">{k}</dt>
          <dd className="text-sm">{val}</dd>
        </div>
      ))}
      <p className="mt-6 text-sm text-concrete-1">{t("fields.project_description")}</p>
      <p className="text-sm">{v.project_description ?? "—"}</p>
    </dl>
  );
}
