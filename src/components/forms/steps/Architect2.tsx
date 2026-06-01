"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

export default function Architect2() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label className="block">
        <span className="eyebrow">{t("fields.country")}</span>
        <input
          {...register("country")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.city")}</span>
        <input
          {...register("city")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
        {errors.city && (
          <span className="text-xs text-red-700">{String(errors.city.message)}</span>
        )}
      </label>
    </div>
  );
}
