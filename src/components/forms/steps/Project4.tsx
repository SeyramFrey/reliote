"use client";
import { useFormContext } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { useProjectWizardAccount } from "../projectWizardContext";

const input =
  "w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green";

// Coordonnées. Visiteur non connecté : son compte porteur est créé avec le
// projet (prénom, nom, e-mail, mot de passe). Connecté : seul le téléphone
// reste à saisir.
export default function Project4() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardClient");
  const locale = useLocale();
  const account = useProjectWizardAccount();

  const err = (name: string) =>
    errors[name] ? (
      <span className="text-xs text-red-700">{String(errors[name]?.message)}</span>
    ) : null;

  if (account.mode === "member") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <p className="md:col-span-2 text-sm text-concrete-1">
          {t("account.signedInAs", { email: account.email })}
        </p>
        <label className="block">
          <span className="eyebrow">{t("fields.phone")}</span>
          <input {...register("phone")} autoComplete="tel" className={input} />
        </label>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <p className="md:col-span-2 text-sm text-concrete-1 max-w-[60ch]">{t("account.createHint")}</p>
      <label className="block">
        <span className="eyebrow">{t("fields.first_name")}</span>
        <input {...register("first_name")} autoComplete="given-name" className={input} />
        {err("first_name")}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.last_name")}</span>
        <input {...register("last_name")} autoComplete="family-name" className={input} />
        {err("last_name")}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.email")}</span>
        <input type="email" {...register("email")} autoComplete="email" className={input} />
        {err("email")}
      </label>
      <label className="block">
        <span className="eyebrow">{t("fields.phone")}</span>
        <input {...register("phone")} autoComplete="tel" className={input} />
      </label>
      <label className="block md:col-span-2">
        <span className="eyebrow">{t("fields.password")}</span>
        <input type="password" {...register("password")} autoComplete="new-password" className={input} />
        {err("password")}
      </label>
      <p className="md:col-span-2 text-sm">
        {t("account.hasAccount")}{" "}
        <a
          href={`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/projets/initier`)}`}
          className="underline"
        >
          {t("account.signIn")}
        </a>
      </p>
    </div>
  );
}
