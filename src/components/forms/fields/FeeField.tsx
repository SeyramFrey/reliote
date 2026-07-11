"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FEE_CURRENCIES } from "@/lib/validation/architect.schema";

// Currency toggle + amount input. Stores `fee_currency` ('EUR'|'XOF') and `fee_amount` (int).
// The format hint below the input previews the value in the chosen currency.
export function FeeField() {
  const { register, setValue } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const currency = (useWatch({ name: "fee_currency" }) as
    | "EUR"
    | "XOF"
    | undefined) ?? "EUR";
  const amount = useWatch({ name: "fee_amount" }) as number | undefined;

  const formatted =
    typeof amount === "number" && amount > 0
      ? new Intl.NumberFormat(currency === "EUR" ? "fr-FR" : "fr-CI", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(amount)
      : "";

  return (
    <div className="space-y-3">
      <span className="eyebrow">{t("fields.fee_from")}</span>
      <div className="flex flex-wrap gap-2">
        {FEE_CURRENCIES.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() =>
              setValue("fee_currency", c, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className={`px-4 py-1.5 border text-sm transition-colors ${
              currency === c
                ? "bg-ink text-paper border-ink"
                : "border-[var(--hairline)] hover:border-ink"
            }`}
          >
            {c === "EUR" ? t("currency.eur") : t("currency.xof")}
          </button>
        ))}
        {/* Register the field so RHF tracks it (the buttons drive setValue). */}
        <input type="hidden" {...register("fee_currency")} />
      </div>
      <label className="block max-w-[280px]">
        <span className="eyebrow">{t("fields.fee_amount")}</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          step={1000}
          placeholder={currency === "EUR" ? "48000" : "30000000"}
          {...register("fee_amount")}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {formatted && (
          <span className="mono text-[11px] tracking-[0.16em] uppercase text-concrete-2 mt-2 block">
            ≈ {formatted}
          </span>
        )}
      </label>
    </div>
  );
}
