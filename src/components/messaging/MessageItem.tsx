"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AttachmentView, MessageView } from "@/lib/messaging/types";
import { cn } from "@/lib/utils";

function formatSize(bytes: number, locale: string): string {
  const mb = bytes / (1024 * 1024);
  const nf = new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: 1 });
  return mb >= 1 ? `${nf.format(mb)} Mo` : `${nf.format(Math.max(1, Math.round(bytes / 1024)))} Ko`;
}

export function MessageItem({
  m,
  now,
  showSeen,
  isAdmin,
  onEdit,
  onDelete,
  onForward,
  onRemove,
}: {
  m: MessageView;
  now: number;
  showSeen: boolean;
  isAdmin: boolean;
  onEdit: (id: string, body: string) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
  onForward: (a: AttachmentView) => void;
  onRemove: (a: AttachmentView) => void;
}) {
  const t = useTranslations("messaging");
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.body);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const editable = !!m.editableUntil && Date.parse(m.editableUntil) > now && !m.deleted;
  const time = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(m.createdAt));

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(t(`errors.${err}` as "errors.generic"));
    return !err;
  };

  return (
    <li className={cn("flex flex-col max-w-[min(85%,560px)]", m.mine ? "self-end items-end" : "self-start items-start")}>
      <div className="mono text-[10.5px] tracking-[0.14em] uppercase text-concrete-2 mb-1.5 flex gap-2">
        <span>{m.authorLabel}</span>
        <span aria-hidden>·</span>
        <time dateTime={m.createdAt}>{time}</time>
        {m.edited && !m.deleted && <span>· {t("edited")}</span>}
      </div>

      <div
        className={cn(
          "px-4 py-3 text-[15px] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap",
          m.mine ? "bg-green text-paper" : "bg-paper-2 border border-[var(--hairline-soft)]",
          m.deleted && "bg-transparent text-concrete-2 italic border border-dashed border-[var(--hairline)]",
        )}
      >
        {m.deleted ? (
          t("deleted")
        ) : editing ? (
          <div className="flex flex-col gap-2 min-w-[min(70vw,420px)]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={5000}
              className="w-full bg-paper text-ink p-2 outline-none text-[15px]"
              aria-label={t("edit")}
            />
            <div className="flex gap-3 justify-end text-[13px]">
              <button type="button" onClick={() => setEditing(false)} className="underline underline-offset-2">
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => onEdit(m.id, draft)).then((ok) => ok && setEditing(false))}
                className="underline underline-offset-2 font-medium"
              >
                {t("save")}
              </button>
            </div>
          </div>
        ) : (
          m.body
        )}

        {!m.deleted && m.attachments.length > 0 && (
          <ul className={cn("flex flex-col gap-1.5", m.body && "mt-3")}>
            {m.attachments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
                {a.removed ? (
                  <span className="italic opacity-70">{t("removed")}</span>
                ) : (
                  <a
                    href={a.href}
                    className={cn("underline underline-offset-2 [overflow-wrap:anywhere]", m.mine ? "text-paper" : "text-ink")}
                  >
                    {a.name}
                  </a>
                )}
                {!a.removed && <span className="opacity-60 mono text-[11px]">{formatSize(a.size, locale)}</span>}
                {a.forwarded && !a.removed && <span className="opacity-70 mono text-[10.5px] uppercase tracking-[0.1em]">{t("forwarded")}</span>}
                {isAdmin && !a.removed && a.forward && (
                  <button type="button" onClick={() => onForward(a)} className="underline underline-offset-2 opacity-90">
                    {a.forward.target === "client" ? t("forwardToClient") : t("forwardToArchitect")}
                  </button>
                )}
                {isAdmin && !a.removed && (
                  <button type="button" onClick={() => onRemove(a)} className="underline underline-offset-2 opacity-70">
                    {t("remove")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {m.revisions && m.revisions.length > 0 && (
        <details className="mt-1.5 text-[12.5px] text-concrete-1 max-w-full">
          <summary className="cursor-pointer hover:text-ink">{t("history")}</summary>
          <ol className="mt-1.5 space-y-1.5 border-l border-[var(--hairline)] pl-3">
            {m.revisions.map((r, i) => (
              <li key={i} className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-concrete-2">
                  {r.action === "delete" ? t("deletedVersion") : t("editedVersion")} ·{" "}
                  {new Date(r.at).toLocaleString(locale === "en" ? "en-GB" : "fr-FR")}
                </span>
                <br />
                {r.body || "—"}
              </li>
            ))}
          </ol>
        </details>
      )}
      {editable && !editing && (
        <div className="flex gap-3 mt-1.5 text-[12px] text-concrete-1">
          <button
            type="button"
            onClick={() => {
              setDraft(m.body);
              setEditing(true);
            }}
            className="hover:text-ink underline-offset-2 hover:underline"
          >
            {t("edit")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t("confirmDelete"))) run(() => onDelete(m.id));
            }}
            className="hover:text-ink underline-offset-2 hover:underline"
          >
            {t("delete")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-1 text-[12.5px] text-red-700">
          {error}
        </p>
      )}
      {showSeen && <span className="mt-1 mono text-[10.5px] tracking-[0.14em] uppercase text-concrete-2">{t("seen")}</span>}
    </li>
  );
}
