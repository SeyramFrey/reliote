"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

export default function Architect5() {
  const { register } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const opts = ["available", "busy", "unavailable"] as const;
  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">{t("fields.availability")}</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {opts.map((o) => (
            <label
              key={o}
              className="px-3 py-1.5 border border-[var(--hairline)] text-sm cursor-pointer hover:text-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:checked]:border-ink transition-colors"
            >
              <input type="radio" value={o} {...register("availability")} className="sr-only" />
              {t(`availability.${o}`)}
            </label>
          ))}
        </div>
      </div>
      <label className="block max-w-[280px]">
        <span className="eyebrow">{t("fields.fee_from")}</span>
        <input
          {...register("fee_from")}
          placeholder="€48k"
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green"
        />
      </label>
    </div>
  );
}
