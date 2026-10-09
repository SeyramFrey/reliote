"use client";
import { useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useProjectWizardAccount } from "../projectWizardContext";

export default function Project5() {
  const t = useTranslations("wizardClient");
  const v = useWatch();
  const account = useProjectWizardAccount();
  const contact: [string, string][] =
    account.mode === "member"
      ? [[t("fields.email"), account.email]]
      : [
          [t("fields.client_name"), [v.first_name, v.last_name].filter(Boolean).join(" ") || "—"],
          [t("fields.email"), v.email || "—"],
        ];
  const rows: [string, string][] = [
    [t("fields.project_type"), v.project_type ?? "—"],
    [t("fields.project_country"), v.project_country || "—"],
    [t("fields.project_location"), v.project_location || "—"],
    [t("fields.budget_range"), v.budget_range || "—"],
    [t("fields.timeline"), v.timeline || "—"],
    [t("fields.required_specialties"), (v.required_specialties ?? []).join(" · ") || "—"],
    ...contact,
  ];
  return (
    <dl className="border-t border-[var(--hairline)]">
      {rows.map(([k, val]) => (
        <div key={k} className="flex justify-between gap-4 py-3 border-b border-[var(--hairline-soft)]">
          <dt className="eyebrow">{k}</dt>
          <dd className="text-sm text-right">{val}</dd>
        </div>
      ))}
      <p className="mt-6 text-sm text-concrete-1">{t("fields.project_description")}</p>
      <p className="text-sm">{v.project_description || "—"}</p>
    </dl>
  );
}
