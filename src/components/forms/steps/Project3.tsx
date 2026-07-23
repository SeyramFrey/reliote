"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CountrySelectField } from "../fields/CountrySelectField";

export default function Project3() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardClient");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="mb-6 md:col-span-2">
        <CountrySelectField
          name="project_country"
          namespace="wizardClient"
          labelKey="fields.project_country"
        />
      </div>
      <label className="block md:col-span-2">
        <span className="eyebrow">{t("fields.project_location")}</span>
        <input
          {...register("project_location")}
          placeholder="Cocody · Abidjan"
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
        {errors.project_location && (
          <span className="text-xs text-red-700">
            {String(errors.project_location.message)}
          </span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.budget_range")}</span>
        <select
          {...register("budget_range")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        >
          <option value="">—</option>
          <option>&lt; €100k</option>
          <option>€100k–€500k</option>
          <option>€500k–€1M</option>
          <option>&gt; €1M</option>
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.timeline")}</span>
        <select
          {...register("timeline")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        >
          <option value="">—</option>
          <option>&lt; 6 mois</option>
          <option>6–12 mois</option>
          <option>12–24 mois</option>
          <option>&gt; 24 mois</option>
        </select>
      </label>
    </div>
  );
}
