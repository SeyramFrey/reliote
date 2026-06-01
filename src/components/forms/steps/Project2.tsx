"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Checkboxes } from "../Checkboxes";
import { SPECIALTIES } from "@/lib/validation/architect.schema";

export default function Project2() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardClient");
  const desc = useWatch({ name: "project_description" }) as string | undefined;
  return (
    <div className="space-y-6">
      <label className="block">
        <span className="eyebrow flex justify-between">
          <span>{t("fields.project_description")}</span>
          <span className="text-concrete-3">{(desc ?? "").length} / 100</span>
        </span>
        <textarea
          {...register("project_description")}
          rows={6}
          className="w-full mt-1 bg-transparent border border-[var(--hairline)] p-3 outline-none focus:border-green"
        />
        {errors.project_description && (
          <span className="text-xs text-red-700">
            {String(errors.project_description.message)}
          </span>
        )}
      </label>
      <div>
        <span className="eyebrow">{t("fields.required_specialties")}</span>
        <Checkboxes name="required_specialties" options={SPECIALTIES} />
        {errors.required_specialties && (
          <span className="text-xs text-red-700 mt-1 block">
            {String(errors.required_specialties.message)}
          </span>
        )}
      </div>
      <label className="block">
        <span className="eyebrow">{t("fields.notes")}</span>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full mt-1 bg-transparent border border-[var(--hairline)] p-3 outline-none focus:border-green"
        />
      </label>
    </div>
  );
}
