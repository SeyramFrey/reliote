"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ALLOWED_EXTENSIONS, MAX_FILES, checkAttachment } from "@/lib/messaging/files";

const ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

// Zone de saisie : texte + pièces jointes. La vérification des fichiers ici
// n'est qu'un retour immédiat ; le serveur refait tout.
export function Composer({
  onSend,
  disabled,
}: {
  onSend: (body: string, files: File[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("messaging");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      const c = checkAttachment({ name: f.name, size: f.size });
      if (!c.ok) {
        setError(`${f.name} — ${t(c.error === "size" || c.error === "empty" ? "errors.fileSize" : "errors.fileType")}`);
        continue;
      }
      next.push(f);
    }
    if (next.length > MAX_FILES) {
      setError(t("errors.tooMany"));
      next.length = MAX_FILES;
    }
    setFiles(next);
    if (input.current) input.current.value = "";
  };

  const submit = () => {
    if (disabled) return;
    if (!body.trim() && files.length === 0) {
      setError(t("errors.empty"));
      return;
    }
    onSend(body, files);
    setBody("");
    setFiles([]);
    setError(null);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-[var(--hairline)] bg-paper pt-4"
    >
      <label className="sr-only" htmlFor="message-body">
        {t("placeholder")}
      </label>
      <textarea
        id="message-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
        }}
        rows={3}
        maxLength={5000}
        placeholder={t("placeholder")}
        disabled={disabled}
        className="w-full resize-y min-h-[84px] bg-transparent border border-[var(--hairline)] focus:border-green outline-none p-3 text-[16px]"
      />

      {files.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 border border-[var(--hairline)] px-2.5 py-1 text-[13px] max-w-full">
              <span className="truncate max-w-[220px]">{f.name}</span>
              <button
                type="button"
                aria-label={`${t("delete")} ${f.name}`}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <input
            ref={input}
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            id="message-files"
            onChange={(e) => addFiles(e.target.files)}
            disabled={disabled}
          />
          <label
            htmlFor="message-files"
            className="cursor-pointer px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink"
          >
            {t("attach")}
          </label>
          <span className="hidden sm:inline text-[12px] text-concrete-2 truncate">{t("attachHint")}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline mono text-[10.5px] tracking-[0.1em] uppercase text-concrete-3">{t("shortcut")}</span>
          <button
            type="submit"
            disabled={disabled}
            className="px-5 py-2.5 bg-green text-paper text-sm hover:bg-green-deep transition-colors disabled:opacity-50"
          >
            {t("send")}
          </button>
        </div>
      </div>
      <p className="sm:hidden mt-2 text-[12px] text-concrete-2">{t("attachHint")}</p>
    </form>
  );
}
