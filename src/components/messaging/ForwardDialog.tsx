"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AttachmentView } from "@/lib/messaging/types";

// Transmission d'un document vers l'autre fil du projet (admin). Avant le RDV
// confirmé, la vérification d'anonymat est obligatoire.
export function ForwardDialog({
  attachment,
  onCancel,
  onSubmit,
}: {
  attachment: AttachmentView;
  onCancel: () => void;
  onSubmit: (note: string, confirmed: boolean, fileName: string) => Promise<string | null>;
}) {
  const t = useTranslations("messaging");
  const [note, setNote] = useState("");
  const dot = attachment.name.lastIndexOf(".");
  const ext = dot > 0 ? attachment.name.slice(dot) : "";
  const [fileName, setFileName] = useState(dot > 0 ? attachment.name.slice(0, dot) : attachment.name);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsCheck = !!attachment.forward?.needsCheck;
  const title = attachment.forward?.target === "client" ? t("forwardToClient") : t("forwardToArchitect");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forward-title"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/40 p-4"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <form
        className="w-full max-w-lg bg-paper p-6 border border-[var(--hairline)]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (needsCheck && !checked) {
            setError(t("errors.checkRequired"));
            return;
          }
          setBusy(true);
          setError(null);
          const err = await onSubmit(note, checked, fileName);
          setBusy(false);
          if (err) setError(t(`errors.${err}` as "errors.generic"));
        }}
      >
        <p className="eyebrow">{t("forwarded")}</p>
        <h2 id="forward-title" className="font-light text-2xl mt-2">
          {title}
        </h2>
        <p className="mt-2 text-sm text-concrete-1 [overflow-wrap:anywhere]">{attachment.name}</p>

        <label className="block mt-5">
          <span className="eyebrow">{t("forwardName")}</span>
          <span className="mt-1 flex items-baseline gap-1 border border-[var(--hairline)] focus-within:border-green p-2">
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              maxLength={110}
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px]"
            />
            <span className="mono text-[12px] text-concrete-2">{ext}</span>
          </span>
        </label>

        {needsCheck && (
          <p className="mt-3 text-[13px] text-concrete-1">
            {attachment.forward?.scrubbable ? t("forwardScrubbed") : `⚠ ${t("forwardNotScrubbable")}`}
          </p>
        )}

        <label className="block mt-5">
          <span className="eyebrow">{t("forwardNote")}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={5000}
            className="w-full mt-1 border border-[var(--hairline)] focus:border-green outline-none p-2 text-[15px] bg-transparent"
          />
        </label>

        {needsCheck && (
          <label className="mt-4 flex gap-3 items-start text-sm">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1" />
            <span>{t("forwardCheck")}</span>
          </label>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink">
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 bg-green text-paper text-sm hover:bg-green-deep disabled:opacity-50"
          >
            {t("forwardSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
}
