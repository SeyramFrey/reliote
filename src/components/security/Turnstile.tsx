"use client";
import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";

// Widget Cloudflare Turnstile. Dans un <form>, il y ajoute le champ caché
// « cf-turnstile-response » ; hors formulaire (assistant de projet), le jeton
// remonte par onToken. Rien ne s'affiche tant que la clé de site manque.

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  // Script inséré par le code de l'app (nonce de la page) : 'strict-dynamic' l'autorise.
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export function Turnstile({ action, onToken }: { action: string; onToken?: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY) return;
    let id: string | null = null;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        id = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          action,
          language: locale,
          theme: "light",
          callback: (t: string) => onTokenRef.current?.(t),
          "expired-callback": () => onTokenRef.current?.(null),
          "error-callback": () => onTokenRef.current?.(null),
        });
      })
      .catch(() => onTokenRef.current?.(null));
    return () => {
      cancelled = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [action, locale]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
