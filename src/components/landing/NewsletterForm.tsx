"use client";
import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  subscribeFromFooter,
  type FooterSubscribeState,
} from "@/app/[locale]/newsletter/actions";

// Inscription du pied de page. Double opt-in : l'inscription n'est active
// qu'après le clic dans l'e-mail de confirmation — le message le dit.
export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [state, action, pending] = useActionState<FooterSubscribeState, FormData>(
    subscribeFromFooter,
    { status: "idle" },
  );

  return (
    <div className="footer-news">
      <div>
        <h5 className="footer-news-h">{t("eyebrow")}</h5>
        <p className="footer-news-p">{t("footerPitch")}</p>
      </div>
      {state.status === "pending" || state.status === "subscribed" ? (
        <p role="status" className="footer-news-ok">
          {state.status === "pending" ? t("footerPending") : t("footerAlready")}
        </p>
      ) : (
        <form action={action} className="footer-news-form" noValidate>
          <input type="hidden" name="locale" value={locale} />
          {/* Pot de miel : invisible pour un humain, rempli par les robots. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="footer-news-trap"
          />
          <label className="footer-news-field">
            <span className="sr-only">{t("emailLabel")}</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              defaultValue={state.email}
              aria-invalid={state.status === "invalid" || undefined}
            />
          </label>
          <button type="submit" disabled={pending}>
            {pending ? "…" : t("footerSubmit")}
          </button>
          {(state.status === "invalid" || state.status === "error") && (
            <p role="alert" className="footer-news-err">
              {state.status === "invalid" ? t("invalidEmail") : t("genericError")}
            </p>
          )}
          <p className="footer-news-legal">{t("footerLegal")}</p>
        </form>
      )}
    </div>
  );
}
