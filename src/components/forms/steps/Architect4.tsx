"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

export default function Architect4() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  return (
    <div className="space-y-6">
      <label className="block max-w-[200px]">
        <span className="eyebrow">{t("fields.years_experience")}</span>
        <input
          type="number"
          min={0}
          max={70}
          {...register("years_experience")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
        {errors.years_experience && (
          <span className="text-xs text-red-700">
            {String(errors.years_experience.message)}
          </span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.description")}</span>
        <textarea
          {...register("description")}
          rows={5}
          className="w-full mt-1 bg-transparent border border-[var(--hairline)] p-3 outline-none focus:border-green"
        />
        {errors.description && (
          <span className="text-xs text-red-700">{String(errors.description.message)}</span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.portfolio_url")}</span>
        <input
          type="url"
          {...register("portfolio_url")}
          placeholder="https://…"
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
      </label>
    </div>
  );
}
