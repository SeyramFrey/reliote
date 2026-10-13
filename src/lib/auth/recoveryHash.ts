// Liens « mot de passe oublié » et invitations envoyés avec le modèle d'e-mail
// par défaut de Supabase (non modifiable sans SMTP personnalisé) : Supabase
// renvoie vers le site avec la session dans le fragment (#access_token=…),
// que seul le navigateur voit. Erreur (lien expiré ou déjà servi) :
// #error=…&error_code=otp_expired.
export type RecoveryHash =
  | { kind: "session"; accessToken: string; refreshToken: string }
  | { kind: "error" };

const PASSWORD_LINK_TYPES = ["recovery", "invite"];

export function parseRecoveryHash(hash: string): RecoveryHash | null {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  if (p.get("error_code")) return { kind: "error" };
  if (!PASSWORD_LINK_TYPES.includes(p.get("type") ?? "")) return null;
  const accessToken = p.get("access_token");
  const refreshToken = p.get("refresh_token");
  if (!accessToken || !refreshToken) return { kind: "error" };
  return { kind: "session", accessToken, refreshToken };
}
