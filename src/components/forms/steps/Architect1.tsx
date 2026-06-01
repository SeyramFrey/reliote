"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

export default function Architect1() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label className="block md:col-span-2">
        <span className="eyebrow">{t("fields.full_name")}</span>
        <input
          {...register("full_name")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
        {errors.full_name && (
          <span className="text-xs text-red-700">{String(errors.full_name.message)}</span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.email")}</span>
        <input
          type="email"
          {...register("email")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
        {errors.email && (
          <span className="text-xs text-red-700">{String(errors.email.message)}</span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.phone")}</span>
        <input
          {...register("phone")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="eyebrow">{t("fields.photo_url")}</span>
        <input
          {...register("photo_url")}
          placeholder="https://…"
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
      </label>
    </div>
  );
}
