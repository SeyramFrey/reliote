"use client";
import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchemaFor, type ProjectInput } from "@/lib/validation/project.schema";
import { useLocale, useTranslations } from "next-intl";
import { WizardShell } from "./WizardShell";
import Step1 from "./steps/Project1";
import Step2 from "./steps/Project2";
import Step3 from "./steps/Project3";
import Step4 from "./steps/Project4";
import Step5 from "./steps/Project5";
import { submitProject } from "@/app/[locale]/projets/initier/actions";
import { ProjectWizardContext, type ProjectWizardAccount } from "./projectWizardContext";

const STEPS = [Step1, Step2, Step3, Step4, Step5];

// Brouillon conservé le temps de la session : un visiteur qui doit se
// connecter en cours de route retrouve sa saisie. Jamais le mot de passe.
const DRAFT_KEY = "reliote.projectDraft";

function stepFields(mode: ProjectWizardAccount["mode"]): (keyof ProjectInput)[][] {
  return [
    ["project_type"],
    ["project_description", "required_specialties", "notes"],
    ["project_country", "project_location", "budget_range", "timeline"],
    mode === "guest" ? ["first_name", "last_name", "email", "phone", "password"] : ["phone"],
    [],
  ];
}

function readDraft(): Partial<ProjectInput> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<ProjectInput>) : null;
  } catch {
    return null;
  }
}

function writeDraft(values: Partial<ProjectInput> | null) {
  try {
    if (values === null) sessionStorage.removeItem(DRAFT_KEY);
    else {
      const { password: _password, ...rest } = values;
      void _password;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    }
  } catch {
    // stockage indisponible (navigation privée…) : pas de brouillon, rien de cassé
  }
}

type Outcome = null | { kind: "error"; message: string } | { kind: "exists" } | { kind: "wrongRole" } | { kind: "confirm"; email: string };

export function ProjectWizard({ account }: { account: ProjectWizardAccount }) {
  const t = useTranslations("wizardClient");
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [submitting, setSubmitting] = useState(false);
  const fields = stepFields(account.mode);
  const form = useForm<ProjectInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(projectSchemaFor(account.mode)) as any,
    mode: "onTouched",
    defaultValues: {
      project_type: "residential",
      project_description: "",
      required_specialties: [],
      project_country: "",
      project_location: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    } as Partial<ProjectInput> as ProjectInput,
  });

  // Restaure le brouillon une fois, après le premier rendu (sessionStorage
  // n'existe pas côté serveur).
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = readDraft();
    if (draft) form.reset({ ...form.getValues(), ...draft, password: "" });
    const sub = form.watch((values) => writeDraft(values as Partial<ProjectInput>));
    return () => sub.unsubscribe();
  }, [form]);

  async function next() {
    const valid = await form.trigger(fields[step - 1]);
    if (!valid) return;
    if (step < 5) return setStep(step + 1);
    setSubmitting(true);
    setOutcome(null);
    // Le succès se termine par une redirection serveur : le brouillon doit
    // être effacé avant l'envoi, puis restauré si l'envoi échoue.
    const values = form.getValues();
    writeDraft(null);
    const res = await submitProject(values, account.mode);
    setSubmitting(false);
    if (!res) return;
    if (!("needsConfirmation" in res)) writeDraft(values);
    if ("needsConfirmation" in res) {
      setOutcome({ kind: "confirm", email: res.email });
    } else if (res.error === "exists") {
      setOutcome({ kind: "exists" });
      setStep(4);
    } else if (res.error === "wrongRole") {
      setOutcome({ kind: "wrongRole" });
    } else {
      setOutcome({ kind: "error", message: res.error });
    }
  }

  if (outcome?.kind === "confirm") {
    return (
      <section className="page-edge py-32 max-w-[720px] mx-auto">
        <p className="eyebrow">{t("account.confirmEyebrow")}</p>
        <h1 className="font-light text-[clamp(36px,4.4vw,56px)] leading-[1.05] mt-4">
          {t("account.confirmTitle")}
        </h1>
        <p className="text-concrete-1 mt-6 max-w-[56ch]">
          {t("account.confirmBody", { email: outcome.email })}
        </p>
      </section>
    );
  }

  const Current = STEPS[step - 1];
  const title = t(`titles.${step}` as "titles.1");
  const steps = [1, 2, 3, 4, 5].map((n) => ({
    n: String(n).padStart(2, "0"),
    t: t(`titles.${n}` as "titles.1"),
  }));
  const loginHref = `/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/projets/initier`)}`;
  return (
    <ProjectWizardContext.Provider value={account}>
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
          {outcome?.kind === "exists" && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {t("account.exists")}{" "}
              <a href={loginHref} className="underline">
                {t("account.existsLink")}
              </a>
            </p>
          )}
          {outcome?.kind === "wrongRole" && (
            <p role="alert" className="mt-4 text-sm text-red-700">{t("account.wrongRole")}</p>
          )}
          {outcome?.kind === "error" && (
            <p role="alert" className="mt-4 text-sm text-red-700">{outcome.message}</p>
          )}
        </WizardShell>
      </FormProvider>
    </ProjectWizardContext.Provider>
  );
}
