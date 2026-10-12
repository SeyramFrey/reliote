import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { canViewThread, currentViewer } from "@/lib/messaging/data";
import { MESSAGE_BUCKET } from "@/lib/messaging/files";

// Téléchargement d'une pièce jointe : droits vérifiés à chaque clic, puis
// redirection vers une URL signée de 5 minutes en téléchargement forcé (jamais
// d'affichage inline d'un fichier envoyé par un tiers).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notFound = () => new NextResponse("Not found", { status: 404 });
  const viewer = await currentViewer();
  if (!viewer) return notFound();

  const s = createServiceClient();
  const { data: att } = await s
    .from("message_attachments")
    .select("thread_id, storage_path, file_name, removed_at")
    .eq("id", id)
    .maybeSingle();
  if (!att || att.removed_at) return notFound();
  if (!(await canViewThread(viewer, att.thread_id))) return notFound();

  const { data, error } = await s.storage
    .from(MESSAGE_BUCKET)
    .createSignedUrl(att.storage_path, 300, { download: att.file_name });
  if (error || !data) return notFound();
  return NextResponse.redirect(data.signedUrl, { status: 302, headers: { "Cache-Control": "no-store" } });
}
