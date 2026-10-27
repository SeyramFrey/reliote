// Double authentification (TOTP, Supabase Auth MFA) — règle par rôle.
//
// Obligatoire pour l'admin et les porteurs de projet, facultative pour les
// architectes. Un compte qui a activé un facteur doit toujours le présenter,
// même si son rôle ne l'exige pas.
//
// Même règle côté base : private.mfa_satisfied() (migration 0024). Les deux
// listes doivent rester identiques.

export const MFA_REQUIRED_ROLES: readonly string[] = ["admin", "client"];

/** Ce qu'il reste à faire pour atteindre l'espace du compte. */
export type MfaStep = "ok" | "enroll" | "challenge";

type Factor = { status: string; factor_type?: string };

export function mfaRequired(role: string | null | undefined): boolean {
  // Sans profil lisible, l'app traite le compte comme un porteur (dashboardPathFor).
  return MFA_REQUIRED_ROLES.includes(role ?? "client");
}

export function hasVerifiedFactor(factors: readonly Factor[] | null | undefined): boolean {
  return (factors ?? []).some((f) => f.status === "verified");
}

/**
 * `aal` : niveau de la session (jeton validé), `factors` : facteurs du compte
 * tels que renvoyés par getUser() — jamais ceux du cookie, que l'utilisateur
 * peut réécrire.
 */
export function mfaStep({
  role,
  aal,
  factors,
}: {
  role: string | null | undefined;
  aal: string | null | undefined;
  factors: readonly Factor[] | null | undefined;
}): MfaStep {
  if (aal === "aal2") return "ok";
  if (hasVerifiedFactor(factors)) return "challenge";
  return mfaRequired(role) ? "enroll" : "ok";
}

/** Page où envoyer le compte pour terminer l'étape, en gardant sa destination. */
export function mfaPath(step: Exclude<MfaStep, "ok">, locale: string, next: string): string {
  const base = step === "challenge" ? `/${locale}/auth/2fa` : `/${locale}/compte/securite`;
  return `${base}?next=${encodeURIComponent(next)}`;
}
