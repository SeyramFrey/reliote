"use client";
import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  subscribeFromFooter,
  type FooterSubscribeState,
} from "@/app/[locale]/newsletter/actions";
import { Turnstile } from "@/components/security/Turnstile";

// Inscription du pied de page. Double opt-in : l'inscription n'est active
// qu'après le clic dans l'e-mail de confirmation — le message le dit.
export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [state, action, pending] = useActionState<FooterSubscribeState, FormData>(
    subscribeFromFooter,
    { status: "idle" },
  );
  // Le captcha ne se charge qu'à l'intention d'écrire : pas de script tiers sur
  // chaque page vue de la landing.
  const [armed, setArmed] = useState(false);
  // Un jeton ne sert qu'une fois : nouveau widget après chaque réponse du serveur.
  const [answered, setAnswered] = useState(state);
  const [round, setRound] = useState(0);
  if (state !== answered) {
    setAnswered(state);
    setRound(round + 1);
  }

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
              onFocus={() => setArmed(true)}
              aria-invalid={state.status === "invalid" || undefined}
            />
          </label>
          <button type="submit" disabled={pending}>
            {pending ? "…" : t("footerSubmit")}
          </button>
          {(armed || state.status === "captcha") && <Turnstile key={round} action="newsletter" />}
          {(state.status === "invalid" || state.status === "error" || state.status === "captcha") && (
            <p role="alert" className="footer-news-err">
              {state.status === "invalid"
                ? t("invalidEmail")
                : state.status === "captcha"
                  ? t("captchaError")
                  : t("genericError")}
            </p>
          )}
          <p className="footer-news-legal">{t("footerLegal")}</p>
        </form>
      )}
    </div>
  );
}
