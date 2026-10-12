"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { MESSAGE_BUCKET } from "@/lib/messaging/files";
import {
  deleteMessage,
  editMessage,
  forwardAttachment,
  markRead,
  prepareUploads,
  refreshThread,
  removeAttachment,
  sendMessage,
} from "@/lib/messaging/actions";
import type { AttachmentView, MessageView, ThreadView as View } from "@/lib/messaging/types";
import { useThreadRealtime } from "./useThreadRealtime";
import { MessageItem } from "./MessageItem";
import { Composer } from "./Composer";
import { ForwardDialog } from "./ForwardDialog";

type Pending = { key: string; body: string; files: File[]; status: "sending" | "failed"; error?: string };

export function ThreadView({
  initial,
  backHref,
  embedded = false,
}: {
  initial: View;
  backHref: string;
  /** Dans la console admin (déjà encadrée) : pas de marges de page. */
  embedded?: boolean;
}) {
  const t = useTranslations("messaging");
  const locale = useLocale();
  const [view, setView] = useState(initial);
  // Tous les messages chargés (pages anciennes comprises), du plus ancien au
  // plus récent. Un rafraîchissement remplace toute cette fenêtre.
  const [messages, setMessages] = useState<MessageView[]>(initial.messages);
  const [hasOlder, setHasOlder] = useState(initial.hasOlder);
  const oldestRef = useRef<string | undefined>(initial.messages[0]?.createdAt);
  const [pending, setPending] = useState<Pending[]>([]);
  const [forwarding, setForwarding] = useState<AttachmentView | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const isAdmin = view.viewerSide === "admin";

  const refresh = useCallback(async () => {
    const since = oldestRef.current;
    const r = await refreshThread(view.id, locale, since ? { since } : {});
    if ("ok" in r) {
      setView(r.view);
      setMessages(r.view.messages);
      setHasOlder(r.view.hasOlder);
      oldestRef.current = r.view.messages[0]?.createdAt ?? since;
    }
    if (document.visibilityState === "visible") await markRead(view.id);
  }, [view.id, locale]);

  useThreadRealtime(view.id, refresh);

  useEffect(() => {
    markRead(view.id);
  }, [view.id]);

  // Horloge pour masquer « Modifier / Supprimer » à la fin des 5 minutes.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  // « Vu » sous mon dernier message vu par l'autre côté.
  const seenId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].mine && messages[i].seen) return messages[i].id;
    }
    return null;
  }, [messages]);

  // Reste collé en bas si l'utilisateur y était.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, pending.length]);

  const loadOlder = async () => {
    const first = messages[0];
    if (!first) return;
    stick.current = false;
    const r = await refreshThread(view.id, locale, { before: first.createdAt });
    if ("ok" in r) {
      setMessages((list) => {
        const ids = new Set(list.map((m) => m.id));
        return [...r.view.messages.filter((m) => !ids.has(m.id)), ...list];
      });
      setHasOlder(r.view.hasOlder);
      if (r.view.messages[0]) oldestRef.current = r.view.messages[0].createdAt;
    }
  };

  const deliver = async (p: Pending) => {
    setPending((list) => list.map((x) => (x.key === p.key ? { ...x, status: "sending", error: undefined } : x)));
    const fail = (error: string) =>
      setPending((list) => list.map((x) => (x.key === p.key ? { ...x, status: "failed", error } : x)));

    let attachments: { path: string; name: string }[] = [];
    if (p.files.length) {
      const prep = await prepareUploads(view.id, p.files.map((f) => ({ name: f.name, size: f.size })));
      if (!("ok" in prep)) return fail(prep.error);
      const supabase = createClient();
      for (let i = 0; i < prep.uploads.length; i++) {
        const u = prep.uploads[i];
        const { error } = await supabase.storage.from(MESSAGE_BUCKET).uploadToSignedUrl(u.path, u.token, p.files[i]);
        if (error) return fail("fileMissing");
      }
      attachments = prep.uploads.map((u) => ({ path: u.path, name: u.name }));
    }
    const res = await sendMessage({ threadId: view.id, body: p.body, attachments });
    if (!("ok" in res)) return fail(res.error);
    setPending((list) => list.filter((x) => x.key !== p.key));
    await refresh();
  };

  const send = (body: string, files: File[]) => {
    stick.current = true;
    const p: Pending = { key: crypto.randomUUID(), body, files, status: "sending" };
    setPending((list) => [...list, p]);
    void deliver(p);
  };

  const afterAction = async (res: { error: string } | { ok: true }) => {
    if ("error" in res) return res.error;
    await refresh();
    return null;
  };

  return (
    <section
      className={
        embedded
          ? "flex flex-col max-w-[880px]"
          : "page-edge py-10 md:py-14 max-w-[880px] mx-auto flex flex-col min-h-[calc(100svh-6rem)]"
      }
    >
      <Link href={backHref} className="eyebrow hover:text-ink">
        ← {t("back")}
      </Link>
      <header className="mt-4 pb-5 border-b border-[var(--hairline)]">
        <h1 className="font-light text-[clamp(26px,3.4vw,40px)] leading-[1.1] [overflow-wrap:anywhere]">{view.title}</h1>
        <p className="mono text-[11px] tracking-[0.16em] uppercase text-concrete-2 mt-2">{view.subtitle}</p>
      </header>

      {view.closed && (
        <p role="status" className="mt-4 p-3 border border-[var(--hairline)] bg-paper-2 text-sm">
          {isAdmin ? t("readOnlyAdmin") : t("readOnly")}
        </p>
      )}

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto py-6 min-h-[280px] max-h-[62svh]"
        aria-live="polite"
      >
        {hasOlder && (
          <div className="text-center mb-6">
            <button type="button" onClick={loadOlder} className="eyebrow underline underline-offset-4 hover:text-ink">
              {t("older")}
            </button>
          </div>
        )}
        {messages.length === 0 && pending.length === 0 && (
          <p className="text-concrete-1 text-sm">{isAdmin ? t("noMessagesAdmin") : t("noMessagesYet")}</p>
        )}
        <ul className="flex flex-col gap-5">
          {messages.map((m) => (
            <MessageItem
              key={m.id}
              m={m}
              now={now}
              isAdmin={isAdmin}
              showSeen={m.id === seenId}
              onEdit={(id, body) => editMessage(id, body).then(afterAction)}
              onDelete={(id) => deleteMessage(id).then(afterAction)}
              onForward={setForwarding}
              onRemove={(a) => {
                if (window.confirm(t("confirmRemove"))) void removeAttachment(a.id).then(afterAction);
              }}
            />
          ))}
          {pending.map((p) => (
            <li key={p.key} className="self-end max-w-[min(85%,560px)] flex flex-col items-end">
              <div className="px-4 py-3 bg-green/70 text-paper text-[15px] whitespace-pre-wrap [overflow-wrap:anywhere]">
                {p.body}
                {p.files.length > 0 && (
                  <ul className="mt-2 text-[13px] opacity-90">
                    {p.files.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                )}
              </div>
              {p.status === "sending" ? (
                <span className="mt-1 mono text-[10.5px] uppercase tracking-[0.14em] text-concrete-2">{t("sending")}</span>
              ) : (
                <span role="alert" className="mt-1 text-[12.5px] text-red-700">
                  {t("notSent")} {p.error ? t(`errors.${p.error}` as "errors.generic") : ""}{" "}
                  <button type="button" onClick={() => deliver(p)} className="underline underline-offset-2">
                    {t("retry")}
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {view.anonymityReminder && view.writable && (
        <p className="mb-2 text-[12.5px] text-concrete-1">⚠ {t("anonymityReminder")}</p>
      )}
      {view.writable && <Composer onSend={send} />}

      {forwarding && (
        <ForwardDialog
          attachment={forwarding}
          onCancel={() => setForwarding(null)}
          onSubmit={async (note, confirmed) => {
            const res = await forwardAttachment({ attachmentId: forwarding.id, note, confirmed });
            if ("error" in res) return res.error;
            setForwarding(null);
            await refresh();
            return null;
          }}
        />
      )}
    </section>
  );
}
