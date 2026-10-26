"use client";
import { useFormContext } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { PROJECT_TYPES } from "@/lib/validation/architect.schema";
import { useProjectWizardAccount } from "../projectWizardContext";

export default function Project1() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardClient");
  const tt = useTranslations("projectTypes");
  const locale = useLocale();
  const account = useProjectWizardAccount();
  return (
    <div>
      <span className="eyebrow">{t("fields.project_type")}</span>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
        {PROJECT_TYPES.map((p) => (
          <label
            key={p}
            className="border border-[var(--hairline)] p-4 cursor-pointer transition-colors hover:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:checked]:border-ink"
          >
            <input type="radio" value={p} {...register("project_type")} className="sr-only" />
            <span className="block text-sm font-medium">{tt(p)}</span>
          </label>
        ))}
      </div>
      {errors.project_type && (
        <span className="text-xs text-red-700 mt-2 block">
          {String(errors.project_type.message)}
        </span>
      )}
      {/* Visiteur sans projet pour l'instant : un compte porteur seul, le
          projet viendra plus tard depuis son tableau de bord. */}
      {account.mode === "guest" && (
        <div className="mt-10 pt-6 border-t border-[var(--hairline)] flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-concrete-1 max-w-[46ch]">{t("noProject.hint")}</p>
          <a
            href={`/${locale}/auth/register?role=client&intent=account`}
            className="inline-flex items-center gap-2 px-5 py-3 border border-[var(--hairline)] text-sm hover:border-ink transition-colors"
          >
            {t("noProject.cta")}
            <span className="inline-block w-[7px] h-[7px] border-r border-t border-current rotate-45" />
          </a>
        </div>
      )}
    </div>
  );
}
