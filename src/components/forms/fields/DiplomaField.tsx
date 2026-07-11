"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { DIPLOMAS } from "@/lib/validation/architect.schema";

// Diploma select with the canonical CNOA list. When the architect picks "Autre", a
// free-text field appears so they can enter their qualification verbatim. The form
// stores the selected enum value OR the free text in the same `diploma` field — the
// select is fully controlled via setValue so we never spread register's onChange on
// the same input.
export function DiplomaField() {
  const { setValue, formState } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const value = useWatch({ name: "diploma" }) as string | undefined;
  const isPreset = typeof value === "string" && DIPLOMAS.includes(value as (typeof DIPLOMAS)[number]);
  const showOther = value === "Autre" || (typeof value === "string" && value !== "" && !isPreset);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="eyebrow">{t("fields.diploma")}</span>
        <div className="relative mt-1">
          <select
            value={showOther ? "Autre" : (value ?? "")}
            onChange={(e) =>
              setValue("diploma", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className="w-full bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green appearance-none pr-8 text-[16px]"
          >
            <option value="" disabled>
              —
            </option>
            {DIPLOMAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 mono text-[11px] text-concrete-2">
            ▾
          </span>
        </div>
      </label>
      {showOther && (
        <label className="block">
          <span className="eyebrow">{t("fields.diploma_other")}</span>
          <input
            type="text"
            value={value === "Autre" ? "" : (value ?? "")}
            onChange={(e) =>
              setValue("diploma", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
          />
        </label>
      )}
      {formState.errors.diploma && (
        <span className="text-xs text-red-700">
          {String(formState.errors.diploma.message)}
        </span>
      )}
    </div>
  );
}
