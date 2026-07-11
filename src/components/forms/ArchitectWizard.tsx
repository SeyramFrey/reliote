"use client";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { architectSchema, type ArchitectInput } from "@/lib/validation/architect.schema";
import { useTranslations } from "next-intl";
import { WizardShell } from "./WizardShell";
import Step1 from "./steps/Architect1";
import Step2 from "./steps/Architect2";
import Step3 from "./steps/Architect3";
import Step4 from "./steps/Architect4";
import Step5 from "./steps/Architect5";
import Step6 from "./steps/Architect6";
import { submitArchitect } from "@/app/[locale]/architectes/rejoindre/actions";

const STEP_FIELDS: (keyof ArchitectInput)[][] = [
  ["first_name", "last_name", "email", "phone", "photo_url"],
  ["country", "city", "structure"],
  ["specialties", "languages", "project_types"],
  ["years_experience", "ordre_number", "diploma", "description", "portfolio_url"],
  ["availability", "fee_currency", "fee_amount"],
  ["terms"],
];

export function ArchitectWizard({
  userId,
  defaultEmail,
  defaultFirstName,
  defaultLastName,
}: {
  userId: string;
  defaultEmail?: string;
  defaultFirstName?: string;
  defaultLastName?: string;
}) {
  const t = useTranslations("wizardArchitect");
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ArchitectInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(architectSchema) as any,
    mode: "onTouched",
    defaultValues: {
      first_name: defaultFirstName ?? "",
      last_name: defaultLastName ?? "",
      email: defaultEmail ?? "",
      country: "Côte d'Ivoire",
      specialties: [],
      languages: ["FR"],
      project_types: [],
      availability: "available",
    } as Partial<ArchitectInput> as ArchitectInput,
  });

  async function next() {
    const valid = await form.trigger(STEP_FIELDS[step - 1] as (keyof ArchitectInput)[]);
    if (!valid) return;
    if (step < 6) return setStep(step + 1);
    setSubmitting(true);
    const res = await submitArchitect(form.getValues());
    setSubmitting(false);
    if (res && "error" in res && res.error) setServerError(res.error);
  }

  const steps = [1, 2, 3, 4, 5, 6].map((n) => ({
    n: String(n).padStart(2, "0"),
    t: t(`titles.${n}` as "titles.1"),
  }));
  const title = t(`titles.${step}` as "titles.1");

  return (
    <FormProvider {...form}>
      <WizardShell
        step={step}
        totalSteps={6}
        eyebrow={t("eyebrow")}
        title={title}
        steps={steps}
        onBack={step > 1 ? () => setStep(step - 1) : undefined}
        onNext={next}
        nextLabel={step === 6 ? t("submit") : t("next")}
        backLabel={t("back")}
        submitting={submitting}
        wide={step === 6}
      >
        {step === 1 && <Step1 userId={userId} />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
        {step === 5 && <Step5 />}
        {step === 6 && <Step6 />}
        {serverError && (
          <p className="mt-4 text-sm text-red-700">{serverError}</p>
        )}
      </WizardShell>
    </FormProvider>
  );
}
