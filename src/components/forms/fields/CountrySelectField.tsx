"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AFRICAN_COUNTRIES_SORTED } from "@/lib/countries/africa";

// Native <select> styled like the wizard's other underlined inputs.
// Lists all 54 African countries; only those flagged `available: true` are selectable.
// `namespace`/`labelKey` let the same field serve both the architect and the project wizards.
export function CountrySelectField({
  name,
  namespace = "wizardArchitect",
  labelKey = "fields.country",
}: {
  name: string;
  namespace?: string;
  labelKey?: string;
}) {
  const { register, formState } = useFormContext();
  const t = useTranslations(namespace);
  const error = formState.errors[name];
  return (
    <label className="block">
      <span className="eyebrow">
        {t(labelKey)} <span className="text-brass">*</span>
      </span>
      <div className="relative mt-1">
        <select
          {...register(name)}
          className="w-full bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green appearance-none pr-8 text-[16px]"
        >
          {AFRICAN_COUNTRIES_SORTED.map((c) => (
            <option key={c.iso2} value={c.name} disabled={!c.available}>
              {c.emoji} {c.name}
              {!c.available ? "  —  Bientôt" : ""}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 mono text-[11px] text-concrete-2">
          ▾
        </span>
      </div>
      {error && (
        <span className="text-xs text-red-700 block mt-1">
          {String(error.message)}
        </span>
      )}
    </label>
  );
}
