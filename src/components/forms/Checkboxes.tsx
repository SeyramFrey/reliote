"use client";
import { useFormContext, useWatch } from "react-hook-form";

export function Checkboxes({ name, options }: { name: string; options: readonly string[] }) {
  const { register } = useFormContext();
  const value = useWatch({ name }) as string[] | undefined;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((o) => (
        <label
          key={o}
          className={`px-3 py-1.5 border text-sm cursor-pointer transition-colors ${
            value?.includes(o)
              ? "bg-ink text-paper border-ink"
              : "border-[var(--hairline)] text-concrete-1 hover:text-ink"
          }`}
        >
          <input type="checkbox" value={o} {...register(name)} className="sr-only" />
          {o}
        </label>
      ))}
    </div>
  );
}
