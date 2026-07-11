"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { architectSchema, type ArchitectInput } from "@/lib/validation/architect.schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function submitArchitect(input: ArchitectInput) {
  const parsed = architectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Disallow duplicate profile rows for the same user (one architect profile per user account)
  const service = createServiceClient();
  const { data: existing } = await service
    .from("architect_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle() as { data: { id: string } | null };
  if (existing) {
    return { error: "Vous avez déjà un dossier architecte en cours. Reliote vous a contacté(e) sous 48h." };
  }

  // Strip non-column fields (`terms`, `phone_country`) and coerce empty strings to null
  // for optional URL/text columns. The phone_country code is informational only — the
  // E.164 `phone` value already carries the country prefix.
  const {
    terms: _terms,
    phone_country: _phone_country,
    photo_url,
    portfolio_url,
    phone,
    structure,
    ordre_number,
    diploma,
    fee_currency,
    fee_amount,
    ...rest
  } = parsed.data;

  const row = {
    ...rest,
    user_id: user.id,
    photo_url: photo_url || null,
    portfolio_url: portfolio_url || null,
    phone: phone || null,
    structure: structure || null,
    ordre_number: ordre_number || null,
    diploma: diploma || null,
    fee_currency: fee_currency ?? null,
    fee_amount: fee_amount ?? null,
    // Charte de non-contournement v1 — l'architecte l'a acceptée en cochant
    // la case `terms` au step 6 (la case cumule confirmation des infos +
    // acceptation de la charte). On horodate côté serveur, pas côté client.
    charter_version: "v1",
    charter_signed_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service.from("architect_profiles") as any).insert(row);
  if (error) return { error: error.message };

  revalidatePath("/fr/architectes");
  revalidatePath("/en/architectes");
  revalidatePath("/fr/admin/architectes");
  revalidatePath("/en/admin/architectes");

  const locale = (await cookies()).get("NEXT_LOCALE")?.value || "fr";
  redirect(`/${locale}/architectes/rejoindre/merci`);
}
