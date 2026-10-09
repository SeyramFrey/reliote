"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FEE_CURRENCIES } from "@/lib/validation/architect.schema";
import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";

type Currency = (typeof FEE_CURRENCIES)[number];

// Devise proposée d'après le pays d'exercice (zone franc CFA de l'Ouest → XOF,
// sinon EUR). Elle n'est enregistrée que si un montant est saisi : les
// honoraires restent facultatifs.
function suggestedCurrency(country: string | undefined): Currency {
  return AFRICAN_COUNTRIES.find((c) => c.name === country)?.currency === "XOF" ? "XOF" : "EUR";
}

// Currency toggle + amount input. Stores `fee_currency` ('EUR'|'XOF') and `fee_amount`.
export function FeeField() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const country = useWatch({ name: "country" }) as string | undefined;
  const stored = useWatch({ name: "fee_currency" }) as Currency | "" | undefined;
  const amountRaw = useWatch({ name: "fee_amount" }) as string | number | undefined;
  const currency: Currency = stored || suggestedCurrency(country);
  const amount = Number(amountRaw);

  const formatted =
    Number.isFinite(amount) && amount > 0
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(amount)
      : "";

  const amountField = register("fee_amount", {
    onChange: (e) => {
      // Un montant sans devise ne passe pas la validation : on fixe la devise
      // affichée au moment où le montant est saisi.
      if (e.target.value !== "" && !stored) {
        setValue("fee_currency", currency, { shouldValidate: true });
      }
    },
  });

  const error = errors.fee_currency?.message ?? errors.fee_amount?.message;

  return (
    <div className="space-y-3">
      <span className="eyebrow">{t("fields.fee_from")}</span>
      <div className="flex flex-wrap gap-2">
        {FEE_CURRENCIES.map((c) => (
          <button
            type="button"
            key={c}
            aria-pressed={currency === c}
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
          {...amountField}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
        />
        {formatted && (
          <span className="mono text-[11px] tracking-[0.16em] uppercase text-concrete-2 mt-2 block">
            ≈ {formatted}
          </span>
        )}
        {error && <span className="text-xs text-red-700 block mt-1">{String(error)}</span>}
      </label>
    </div>
  );
}
