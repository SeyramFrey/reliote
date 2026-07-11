"use client";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

// Drag-and-drop photo uploader → Supabase Storage `architect-photos` bucket.
// Path convention: {user_id}/{uuid}.{ext} (the RLS policy in 0006 keys off the leading folder).
// On success, sets the `photo_url` form field to the bucket's public URL.

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function PhotoUploadField({ userId }: { userId: string }) {
  const { setValue, watch } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const photoUrl = (watch("photo_url") as string | undefined) || "";

  // Cleanup the object URL when the component unmounts (in case the user navigated away
  // before the upload settled).
  useEffect(() => () => setErr(null), []);

  async function handleFile(file: File) {
    setErr(null);
    if (!ACCEPTED.includes(file.type)) {
      setErr(t("photoErrors.type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr(t("photoErrors.size"));
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("architect-photos")
        .upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("architect-photos").getPublicUrl(path);
      setValue("photo_url", data.publicUrl, { shouldDirty: true, shouldValidate: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("photoErrors.unknown"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="block">
      <span className="eyebrow">{t("fields.photo")}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => fileInput.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
        className={`mt-2 grid grid-cols-[120px_1fr] gap-5 items-center border border-dashed p-4 cursor-pointer transition-colors ${
          dragOver ? "border-green bg-green/5" : "border-[var(--hairline)] hover:border-ink"
        }`}
      >
        <div className="aspect-[4/5] bg-paper-2 relative overflow-hidden">
          {photoUrl && (
            // Storage URLs are external; using <img> sidesteps the Next/Image domain config.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-water/50 mono text-[10px] tracking-[0.18em] uppercase text-paper">
              {t("photoUploading")}
            </div>
          )}
        </div>
        <div className="text-sm">
          <p className="font-medium">{t("photoCTA")}</p>
          <p className="text-concrete-2 mt-1 text-[12.5px] leading-snug">{t("photoHint")}</p>
          {err && <p className="text-red-700 text-[12.5px] mt-2">{err}</p>}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );
}
