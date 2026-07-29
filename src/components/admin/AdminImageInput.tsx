"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Champ image admin : saisie d'URL OU téléversement vers le bucket 'content-images'
// (RLS insert = is_admin(), 0011). L'input texte porte `name` → sa valeur courante
// est soumise avec le formulaire (server action).

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function AdminImageInput({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setErr(null);
    if (!ACCEPTED.includes(file.type)) {
      setErr("Format accepté : JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("Fichier trop lourd (max 5 Mo).");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("content-images")
        .upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("content-images").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec du téléversement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… ou téléverser une image"
          className="flex-1 bg-transparent border-b border-[var(--hairline)] py-1.5 text-sm outline-none focus:border-green"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-3 py-1.5 border border-[var(--hairline)] text-[13px] hover:border-ink disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? "…" : "Téléverser"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>
      {url ? (
        // Storage URLs are external; <img> sidesteps Next/Image domain config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="mt-2 h-20 w-32 object-cover border border-[var(--hairline)]"
        />
      ) : null}
      {err ? <p className="text-red-700 text-[12px] mt-1">{err}</p> : null}
    </div>
  );
}
