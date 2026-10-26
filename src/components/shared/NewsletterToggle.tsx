import { getLocale, getTranslations } from "next-intl/server";
import { subscriptionFor } from "@/lib/newsletter/subscriptions";
import { setDashboardNewsletter } from "@/app/[locale]/newsletter/actions";

// Abonnement à la newsletter depuis l'espace connecté (porteur ou architecte).
export async function NewsletterToggle({ email }: { email: string | null | undefined }) {
  const locale = await getLocale();
  const t = await getTranslations("newsletter");
  const status = await subscriptionFor(email);
  const on = status === "subscribed";

  return (
    <aside className="mt-16 pt-8 border-t border-[var(--hairline)] flex flex-wrap items-center justify-between gap-4">
      <div className="max-w-[56ch]">
        <p className="eyebrow">{t("eyebrow")}</p>
        <p className="text-sm text-concrete-1 mt-2">
          {on ? t("dashboardOn") : status === "pending" ? t("dashboardPending") : t("dashboardOff")}
        </p>
      </div>
      <form action={setDashboardNewsletter}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="on" value={on ? "0" : "1"} />
        <button className="px-5 py-2.5 border border-[var(--hairline)] text-sm hover:border-ink transition-colors">
          {on ? t("dashboardUnsubscribe") : t("dashboardSubscribe")}
        </button>
      </form>
    </aside>
  );
}
