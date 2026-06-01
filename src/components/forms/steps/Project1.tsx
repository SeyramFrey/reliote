"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { PROJECT_TYPES } from "@/lib/validation/architect.schema";

export default function Project1() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardClient");
  return (
    <div>
      <span className="eyebrow">{t("fields.project_type")}</span>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        {PROJECT_TYPES.map((p) => (
          <label
            key={p}
            className="border border-[var(--hairline)] p-4 cursor-pointer transition-colors hover:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:checked]:border-ink"
          >
            <input type="radio" value={p} {...register("project_type")} className="sr-only" />
            <span className="block text-sm font-medium capitalize">{p}</span>
          </label>
        ))}
      </div>
      {errors.project_type && (
        <span className="text-xs text-red-700 mt-2 block">
          {String(errors.project_type.message)}
        </span>
      )}
    </div>
  );
}
