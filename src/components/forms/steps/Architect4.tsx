"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { DiplomaField } from "../fields/DiplomaField";

export default function Architect4() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const country = useWatch({ name: "country" }) as string | undefined;
  const ordreRequired = country === "Côte d'Ivoire";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label className="block">
        <span className="eyebrow">
          {t("fields.years_experience")} <span className="text-brass">*</span>
        </span>
        <input
          type="number"
          min={0}
          max={70}
          {...register("years_experience")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {errors.years_experience && (
          <span className="text-xs text-red-700 block mt-1">
            {String(errors.years_experience.message)}
          </span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">
          {t("fields.ordre_number")}{" "}
          {ordreRequired && <span className="text-brass">*</span>}
        </span>
        <input
          {...register("ordre_number")}
          placeholder={t("placeholders.ordre_number")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {errors.ordre_number && (
          <span className="text-xs text-red-700 block mt-1">
            {String(errors.ordre_number.message)}
          </span>
        )}
        <span className="mono text-[10.5px] tracking-[0.16em] uppercase text-concrete-2 mt-2 block">
          {t("hints.ordre_number")}
        </span>
      </label>
      <div className="md:col-span-2">
        <DiplomaField />
      </div>
      <label className="block md:col-span-2">
        <span className="eyebrow">
          {t("fields.description")} <span className="text-brass">*</span>
        </span>
        <textarea
          {...register("description")}
          rows={5}
          placeholder={t("placeholders.description")}
          className="w-full mt-1 bg-transparent border border-[var(--hairline)] p-3 outline-none focus:border-green text-[16px]"
        />
        {errors.description && (
          <span className="text-xs text-red-700 block mt-1">
            {String(errors.description.message)}
          </span>
        )}
      </label>
      <label className="block md:col-span-2">
        <span className="eyebrow">{t("fields.portfolio_url")}</span>
        <input
          type="url"
          {...register("portfolio_url")}
          placeholder="https://…"
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
      </label>
    </div>
  );
}
