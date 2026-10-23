"use client";
import { Controller, useFormContext } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// Phone input with searchable country selector (flag emoji + dial code).
// Stores E.164 in `name` and the selected ISO-2 country code in `${name}_country`.
// No default country: Reliote covers 54 countries, the indicative is picked or typed.
export function PhoneField({
  name,
  label,
  defaultCountry,
  required = false,
}: {
  name: string;
  label: string;
  defaultCountry?: string;
  required?: boolean;
}) {
  const { control, setValue } = useFormContext();
  return (
    <label className="block">
      <span className="eyebrow">
        {label}
        {required && <span className="text-gold-deep ml-1">*</span>}
      </span>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <PhoneInput
              international
              countryCallingCodeEditable={false}
              defaultCountry={defaultCountry as "CI" | undefined}
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v ?? "")}
              onCountryChange={(c) => c && setValue(`${name}_country`, c)}
              className="mt-1 flex items-center gap-3 border-b border-[var(--hairline)] focus-within:border-green transition-colors pb-1"
              numberInputProps={{
                className:
                  "flex-1 bg-transparent outline-none py-2 text-[16px] placeholder:text-concrete-3",
              }}
            />
            {fieldState.error && (
              <span className="text-xs text-red-700 block mt-1">
                {fieldState.error.message}
              </span>
            )}
          </>
        )}
      />
    </label>
  );
}
