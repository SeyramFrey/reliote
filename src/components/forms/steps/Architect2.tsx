"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CountrySelectField } from "../fields/CountrySelectField";
import { LEGAL_FORMS, LEGAL_STATUSES } from "@/lib/validation/architect.schema";

const input =
  "w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]";

// Statut juridique, puis localisation. Une agence (personne morale) donne son
// identité de société ; un indépendant garde le champ libre « Structure ».
export default function Architect2() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const company = watch("legal_status") === "company";

  const err = (name: string) =>
    errors[name] ? (
      <span className="text-xs text-red-700 block mt-1">{String(errors[name]?.message)}</span>
    ) : null;
  const req = <span className="text-gold-deep">*</span>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <fieldset className="md:col-span-2">
        <legend className="eyebrow">
          {t("fields.legal_status")} {req}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {LEGAL_STATUSES.map((s) => (
            <label
              key={s}
              className="border border-[var(--hairline)] p-4 cursor-pointer transition-colors hover:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:checked]:border-ink"
            >
              <input type="radio" value={s} {...register("legal_status")} className="sr-only" />
              <span className="block text-sm font-medium">{t(`legalStatus.${s}.label`)}</span>
              <span className="block text-[12.5px] mt-1 opacity-70">{t(`legalStatus.${s}.hint`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {company && (
        <>
          <label className="block md:col-span-2">
            <span className="eyebrow">
              {t("fields.company_name")} {req}
            </span>
            <input {...register("company_name")} placeholder={t("placeholders.company_name")} className={input} />
            {err("company_name")}
          </label>
          <label className="block">
            <span className="eyebrow">
              {t("fields.legal_form")} {req}
            </span>
            <select {...register("legal_form")} defaultValue="" className={`${input} cursor-pointer`}>
              <option value="" disabled>
                {t("placeholders.legal_form")}
              </option>
              {LEGAL_FORMS.map((f) => (
                <option key={f} value={f}>
                  {f === "Autre" ? t("legalFormOther") : f}
                </option>
              ))}
            </select>
            {err("legal_form")}
          </label>
          <label className="block">
            <span className="eyebrow">
              {t("fields.registration_number")} {req}
            </span>
            <input
              {...register("registration_number")}
              placeholder={t("placeholders.registration_number")}
              className={input}
            />
            {err("registration_number")}
          </label>
          <label className="block md:col-span-2">
            <span className="eyebrow">
              {t("fields.legal_representative")} {req}
            </span>
            <input
              {...register("legal_representative")}
              placeholder={t("placeholders.legal_representative")}
              autoComplete="name"
              className={input}
            />
            {err("legal_representative")}
          </label>
        </>
      )}

      <CountrySelectField name="country" />
      <label className="block">
        <span className="eyebrow">
          {t("fields.city")} {req}
        </span>
        <input {...register("city")} placeholder={t("placeholders.city")} className={input} />
        {err("city")}
      </label>
      {!company && (
        <label className="block md:col-span-2">
          <span className="eyebrow">{t("fields.structure")}</span>
          <input {...register("structure")} placeholder={t("placeholders.structure")} className={input} />
        </label>
      )}
    </div>
  );
}
