import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Nav } from "@/components/shared/Nav";
import { MfaEnroll } from "@/components/auth/MfaEnroll";
import { createClient } from "@/lib/supabase/server";
import { mfaPath, mfaRequired } from "@/lib/auth/mfa";
import { sessionAal } from "@/lib/auth/mfaSession";
import { dashboardPathFor } from "@/lib/auth/roles";
import { safeLocale, safeRedirectPath } from "@/lib/auth/safeRedirect";
import { pageMetadata } from "@/lib/seo/metadata";
import { removeFactor } from "./actions";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "security" });
}

// Sécurité du compte : activer la double authentification (obligatoire pour
// l'admin et les porteurs, facultative pour les architectes), gérer ses appareils.
export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const locale = safeLocale(await getLocale());
  const t = await getTranslations("mfa");
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/compte/securite`);
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  const required = mfaRequired(prof?.role);
  const dest = safeRedirectPath(next ?? null, dashboardPathFor(prof?.role, locale));

  const factors = (user.factors ?? []).filter((f) => f.status === "verified");
  const aal2 = (await sessionAal(supabase)) === "aal2";
  // Appareil déjà enregistré mais code pas encore saisi : la gestion attend le code.
  if (factors.length > 0 && !aal2) redirect(mfaPath("challenge", locale, `/${locale}/compte/securite`));

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "long" });
  return (
    <>
      <Nav />
      <main className="page-edge pt-36 pb-32 max-w-[560px] mx-auto">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-light text-5xl mt-4 leading-tight">{t("securityTitle")}</h1>
        {error && (
          <p role="alert" className="mt-6 text-sm text-red-700">
            {error === "last" ? t("removeLastRequired") : t("errors.generic")}
          </p>
        )}

        {factors.length === 0 ? (
          <>
            <p className="mt-6 text-concrete-1">{required ? t("required") : t("optional")}</p>
            <MfaEnroll locale={locale} next={dest} startLabel={t("start")} />
          </>
        ) : (
          <>
            <p className="mt-6 text-green">{t("active")}</p>
            <h2 className="eyebrow mt-10">{t("devices")}</h2>
            <ul className="mt-4 divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
              {factors.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span>
                    {f.friendly_name || "TOTP"}{" "}
                    <span className="text-concrete-1">· {t("addedOn", { date: dateFmt.format(new Date(f.created_at)) })}</span>
                  </span>
                  {(!required || factors.length > 1) && (
                    <form action={removeFactor}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="factorId" value={f.id} />
                      <button className="underline underline-offset-4 text-concrete-1 hover:text-ink">{t("remove")}</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-concrete-1">{t("backupHint")}</p>
            <MfaEnroll locale={locale} next={`/${locale}/compte/securite`} startLabel={t("addDevice")} />
            <p className="mt-10">
              <a href={dest} className="text-sm underline underline-offset-4">{t("continue")}</a>
            </p>
          </>
        )}
      </main>
    </>
  );
}
