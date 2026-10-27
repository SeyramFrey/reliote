"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { startEnrollment, confirmEnrollment } from "@/app/[locale]/compte/securite/actions";

type Pending = { factorId: string; qrCode: string; secret: string };

// Activation d'un appareil : QR code (ou clé à saisir), puis premier code.
export function MfaEnroll({ locale, next, startLabel }: { locale: string; next: string; startLabel: string }) {
  const t = useTranslations("mfa");
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const start = () =>
    startTransition(async () => {
      setError(null);
      const res = await startEnrollment();
      if ("error" in res) setError(t("errors.generic"));
      else setPending(res);
    });

  const confirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending) return;
    startTransition(async () => {
      setError(null);
      // Succès : l'action redirige vers la destination.
      const res = await confirmEnrollment({ factorId: pending.factorId, code, next, locale });
      if (res?.error) setError(t(`errors.${res.error}`));
    });
  };

  if (!pending) {
    return (
      <div className="mt-8">
        {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm disabled:opacity-60"
        >
          {startLabel}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={confirm} className="mt-8 space-y-6">
      <p>{t("step1")}</p>
      {/* Data URL SVG produite par GoTrue : rien à optimiser. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={pending.qrCode} alt={t("qrAlt")} width={200} height={200} className="bg-white p-2 border border-[var(--hairline)]" />
      <p className="text-sm text-concrete-1">
        {t("manual")} <code className="break-all select-all text-ink">{pending.secret}</code>
      </p>
      <label className="block">
        <span className="eyebrow">{t("step2")}</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-2xl tracking-[0.4em]"
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm disabled:opacity-60">
        {t("confirm")}
      </button>
    </form>
  );
}
