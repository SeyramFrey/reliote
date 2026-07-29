import "server-only";
import { createClient } from "@/lib/supabase/server";

type ProfileRole = { role: string };

// Guards server actions and route handlers that mutate admin-only data.
// Pages under /admin are already gated by the admin layout, but server actions are
// independent POST endpoints — they must re-check the caller's role here.
// Returns the authenticated admin's user id (usable e.g. for meetings.proposed_by).
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: prof } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: ProfileRole | null };

  if (prof?.role !== "admin") throw new Error("Forbidden");

  return { userId: user.id };
}
