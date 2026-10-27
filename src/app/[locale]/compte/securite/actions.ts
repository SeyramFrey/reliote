"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeLocale, safeRedirectPath } from "@/lib/auth/safeRedirect";
import { mfaRequired } from "@/lib/auth/mfa";
import { sessionAal } from "@/lib/auth/mfaSession";
import { dashboardPathFor } from "@/lib/auth/roles";
import { rateLimitAll } from "@/lib/security/rateLimit";

export type EnrollmentStart = { factorId: string; qrCode: string; secret: string } | { error: "generic" };
export type EnrollmentResult = { error: "code" | "rateLimited" | "generic" } | void;

async function signedInUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Nouveau facteur TOTP, non vérifié tant que le premier code n'est pas saisi.
// Les tentatives abandonnées (QR code affiché, jamais confirmé) sont retirées
// d'abord : GoTrue en limite le nombre.
export async function startEnrollment(): Promise<EnrollmentStart> {
  const { supabase, user } = await signedInUser();
  if (!user) return { error: "generic" };
  for (const f of user.factors ?? []) {
    if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "Reliote",
    // Unique par compte : l'heure distingue un second appareil du premier.
    friendlyName: `Reliote ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
  });
  if (error || !data) return { error: "generic" };
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

// Premier code : le facteur devient vérifié et la session passe en aal2.
export async function confirmEnrollment(input: {
  factorId: string;
  code: string;
  next: string;
  locale: string;
}): Promise<EnrollmentResult> {
  const locale = safeLocale(input.locale);
  const code = input.code.replace(/\s+/g, "");
  const { supabase, user } = await signedInUser();
  if (!user) return { error: "generic" };
  if (!(await rateLimitAll([[`mfa:user:${user.id}`, 10, 900]]))) return { error: "rateLimited" };
  if (!/^\d{6}$/.test(code)) return { error: "code" };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: input.factorId, code });
  if (error) return { error: "code" };

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  revalidatePath(`/${locale}/compte/securite`);
  redirect(safeRedirectPath(input.next, dashboardPathFor(prof?.role, locale)));
}

// Retrait d'un appareil. Le dernier ne part pas quand le rôle exige la double
// authentification (GoTrue exige de son côté une session aal2).
export async function removeFactor(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  const factorId = String(formData.get("factorId") ?? "");
  const back = `/${locale}/compte/securite`;
  const { supabase, user } = await signedInUser();
  if (!user) redirect(`/${locale}/auth/login?next=${encodeURIComponent(back)}`);
  if ((await sessionAal(supabase)) !== "aal2") redirect(`/${locale}/auth/2fa?next=${encodeURIComponent(back)}`);

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  const verified = (user.factors ?? []).filter((f) => f.status === "verified");
  if (mfaRequired(prof?.role) && verified.length <= 1) redirect(`${back}?error=last`);

  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  revalidatePath(back);
  redirect(error ? `${back}?error=generic` : back);
}
