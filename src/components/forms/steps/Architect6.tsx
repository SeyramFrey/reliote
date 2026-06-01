"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

export default function Architect6() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const v = useWatch();
  const rows: [string, string][] = [
    [t("fields.full_name"), v.full_name ?? "—"],
    [t("fields.email"), v.email ?? "—"],
    [t("fields.city"), `${v.city ?? "—"}, ${v.country ?? ""}`],
    [t("fields.specialties"), (v.specialties ?? []).join(" · ") || "—"],
    [t("fields.project_types"), (v.project_types ?? []).join(" · ") || "—"],
    [t("fields.years_experience"), v.years_experience ? `${v.years_experience} ans` : "—"],
    [t("fields.availability"), v.availability ?? "—"],
    [t("fields.fee_from"), v.fee_from ?? "—"],
  ];
  return (
    <div className="space-y-6">
      <dl className="border-t border-[var(--hairline)]">
        {rows.map(([k, val]) => (
          <div
            key={k}
            className="flex justify-between py-3 border-b border-[var(--hairline-soft)]"
          >
            <dt className="eyebrow">{k}</dt>
            <dd className="text-sm">{val}</dd>
          </div>
        ))}
      </dl>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" {...register("terms")} className="mt-1" />
        <span className="text-sm text-concrete-1">{t("fields.terms")}</span>
      </label>
      {errors.terms && (
        <span className="text-xs text-red-700 block">{String(errors.terms.message)}</span>
      )}
    </div>
  );
}
