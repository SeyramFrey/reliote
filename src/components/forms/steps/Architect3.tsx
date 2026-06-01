"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Checkboxes } from "../Checkboxes";
import { SPECIALTIES, PROJECT_TYPES } from "@/lib/validation/architect.schema";

export default function Architect3() {
  const {
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">{t("fields.specialties")}</span>
        <Checkboxes name="specialties" options={SPECIALTIES} />
        {errors.specialties && (
          <span className="text-xs text-red-700 mt-1 block">
            {String(errors.specialties.message)}
          </span>
        )}
      </div>
      <div>
        <span className="eyebrow">{t("fields.languages")}</span>
        <Checkboxes name="languages" options={["FR", "EN", "DE", "IT", "PT", "ES"]} />
      </div>
      <div>
        <span className="eyebrow">{t("fields.project_types")}</span>
        <Checkboxes name="project_types" options={PROJECT_TYPES} />
      </div>
    </div>
  );
}
