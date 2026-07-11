"use client";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectInput } from "@/lib/validation/project.schema";
import { useTranslations } from "next-intl";
import { WizardShell } from "./WizardShell";
import Step1 from "./steps/Project1";
import Step2 from "./steps/Project2";
import Step3 from "./steps/Project3";
import Step4 from "./steps/Project4";
import Step5 from "./steps/Project5";
import { submitProject } from "@/app/[locale]/projets/initier/actions";

const STEP_FIELDS: (keyof ProjectInput)[][] = [
  ["project_type"],
  ["project_description", "required_specialties", "notes"],
  ["project_location", "budget_range", "timeline"],
  ["client_name", "email", "phone"],
  [],
];

const STEPS = [Step1, Step2, Step3, Step4, Step5];

export function ProjectWizard({ defaultEmail }: { defaultEmail?: string }) {
  const t = useTranslations("wizardClient");
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ProjectInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(projectSchema) as any,
    mode: "onTouched",
    defaultValues: {
      project_type: "residential",
      project_description: "",
      required_specialties: [],
      project_location: "",
      client_name: "",
      email: defaultEmail ?? "",
    } as Partial<ProjectInput> as ProjectInput,
  });

  async function next() {
    const valid = await form.trigger(STEP_FIELDS[step - 1] as (keyof ProjectInput)[]);
    if (!valid) return;
    if (step < 5) return setStep(step + 1);
    setSubmitting(true);
    const res = await submitProject(form.getValues());
    setSubmitting(false);
    if (res && "error" in res && res.error) setServerError(res.error);
  }

  const Current = STEPS[step - 1];
  const title = t(`titles.${step}` as "titles.1");
  const steps = [1, 2, 3, 4, 5].map((n) => ({
    n: String(n).padStart(2, "0"),
    t: t(`titles.${n}` as "titles.1"),
  }));
  return (
    <FormProvider {...form}>
      <WizardShell
        step={step}
        totalSteps={5}
        eyebrow={t("eyebrow")}
        title={title}
        steps={steps}
        onBack={step > 1 ? () => setStep(step - 1) : undefined}
        onNext={next}
        nextLabel={step === 5 ? t("submit") : t("next")}
        backLabel={t("back")}
        submitting={submitting}
      >
        <Current />
        {serverError && <p className="mt-4 text-sm text-red-700">{serverError}</p>}
      </WizardShell>
    </FormProvider>
  );
}
