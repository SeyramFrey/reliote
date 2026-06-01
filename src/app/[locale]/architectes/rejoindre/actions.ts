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

  // Strip the `terms` field (not a column) before insert
  const { terms: _terms, photo_url, portfolio_url, phone, fee_from, ...rest } = parsed.data;
  const row = {
    ...rest,
    user_id: user.id,
    // Coerce empty strings to null for optional URLs
    photo_url: photo_url || null,
    portfolio_url: portfolio_url || null,
    phone: phone || null,
    fee_from: fee_from || null,
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
