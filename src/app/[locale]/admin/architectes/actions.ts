"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

type Status = "pending" | "verified" | "rejected" | "paused";

export async function setArchitectStatus(id: string, status: Status): Promise<void> {
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("architect_profiles") as any).update({ status }).eq("id", id);
  revalidatePath("/fr/admin/architectes");
  revalidatePath("/en/admin/architectes");
  revalidatePath("/fr/architectes");
  revalidatePath("/en/architectes");
}
