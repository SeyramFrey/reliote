"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { PhoneField } from "../fields/PhoneField";
import { PhotoUploadField } from "../fields/PhotoUploadField";

export default function Architect1({ userId }: { userId: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label className="block">
        <span className="eyebrow">
          {t("fields.first_name")} <span className="text-brass">*</span>
        </span>
        <input
          {...register("first_name")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {errors.first_name && (
          <span className="text-xs text-red-700 block mt-1">
            {String(errors.first_name.message)}
          </span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">
          {t("fields.last_name")} <span className="text-brass">*</span>
        </span>
        <input
          {...register("last_name")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {errors.last_name && (
          <span className="text-xs text-red-700 block mt-1">
            {String(errors.last_name.message)}
          </span>
        )}
      </label>
      <label className="block">
        <span className="eyebrow">
          {t("fields.email")} <span className="text-brass">*</span>
        </span>
        <input
          type="email"
          {...register("email")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {errors.email && (
          <span className="text-xs text-red-700 block mt-1">
            {String(errors.email.message)}
          </span>
        )}
      </label>
      <PhoneField name="phone" label={t("fields.phone")} />
      <div className="md:col-span-2">
        <PhotoUploadField userId={userId} />
      </div>
    </div>
  );
}
