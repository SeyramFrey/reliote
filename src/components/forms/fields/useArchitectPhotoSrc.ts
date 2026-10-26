"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ARCHITECT_PHOTO_BUCKET, architectPhotoPath } from "@/lib/storage/architectPhotoPath";

// Aperçu de sa propre photo pendant le dossier : le bucket est privé, on signe
// le chemin sous la session de l'architecte (la policy « owner read » ne lui
// ouvre que son dossier).
export function useArchitectPhotoSrc(value: string | undefined): string {
  const path = architectPhotoPath(value);
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);

  useEffect(() => {
    if (!path) return;
    let alive = true;
    createClient()
      .storage.from(ARCHITECT_PHOTO_BUCKET)
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (alive && data?.signedUrl) setSigned({ path, url: data.signedUrl });
      });
    return () => {
      alive = false;
    };
  }, [path]);

  return path && signed?.path === path ? signed.url : "";
}
