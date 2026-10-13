// Lien « mot de passe oublié » au format token_hash (modèle d'e-mail Supabase
// « Reset Password », voir supabase/templates/recovery.html). Contrairement au
// flux PKCE du callback, il marche quel que soit l'appareil ou le navigateur
// qui ouvre l'e-mail. On ne transmet à Supabase qu'un hash hexadécimal.
export function recoveryTokenFrom(
  tokenHash: string | null | undefined,
  type: string | null | undefined,
): string | null {
  if (type !== "recovery" || !tokenHash) return null;
  return /^[0-9a-f]{16,128}$/i.test(tokenHash) ? tokenHash : null;
}
