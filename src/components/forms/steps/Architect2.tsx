"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CountrySelectField } from "../fields/CountrySelectField";

export default function Architect2() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CountrySelectField name="country" />
      <label className="block">
        <span className="eyebrow">
          {t("fields.city")} <span className="text-brass">*</span>
        </span>
        <input
          {...register("city")}
          placeholder={t("placeholders.city")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {errors.city && (
          <span className="text-xs text-red-700 block mt-1">
            {String(errors.city.message)}
          </span>
        )}
      </label>
      <label className="block md:col-span-2">
        <span className="eyebrow">{t("fields.structure")}</span>
        <input
          {...register("structure")}
          placeholder={t("placeholders.structure")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
      </label>
    </div>
  );
}
