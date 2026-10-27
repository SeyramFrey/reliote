"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FieldError } from "../FieldError";
import { Checkboxes } from "../Checkboxes";
import { SPECIALTIES } from "@/lib/validation/architect.schema";

// Coordonnées repérées dans le descriptif : les architectes proposés le lisent
// avant la révélation, qui n'a lieu qu'au rendez-vous confirmé.
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
function mentionsContact(text: string): boolean {
  if (EMAIL_RE.test(text)) return true;
  // Un numéro : au moins neuf chiffres d'affilée, séparateurs compris ; une
  // plage d'années (« 2025-2026 ») n'en est pas un.
  return (text.match(/\+?\d[\d\s().-]{6,}\d/g) ?? []).some(
    (m) => m.replace(/\D/g, "").length >= 9 && !/^\d{4}\s*-\s*\d{4}$/.test(m.trim()),
  );
}

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
        <p className="mt-2 text-xs text-concrete-1">{t("fields.descriptionPrivacy")}</p>
        {mentionsContact(desc ?? "") && (
          <p role="status" className="mt-1 text-xs text-[#806b3b]">{t("fields.descriptionContact")}</p>
        )}
        <FieldError message={errors.project_description?.message} />
      </label>
      <div>
        <span className="eyebrow">{t("fields.required_specialties")}</span>
        <Checkboxes name="required_specialties" options={SPECIALTIES} />
        <FieldError message={errors.required_specialties?.message} />
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
