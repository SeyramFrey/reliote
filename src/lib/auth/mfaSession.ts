import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { mfaStep, type MfaStep } from "./mfa";

/**
 * Niveau d'assurance de la session : lu dans le jeton d'accès. À appeler
 * après getUser(), qui vient de valider ce même jeton auprès de GoTrue.
 */
export async function sessionAal(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel ?? null;
}

/** Étape de double authentification restante pour `user` (issu de getUser()). */
export async function mfaStepFor(
  supabase: SupabaseClient,
  user: Pick<User, "factors">,
  role: string | null | undefined,
): Promise<MfaStep> {
  return mfaStep({ role, aal: await sessionAal(supabase), factors: user.factors });
}
