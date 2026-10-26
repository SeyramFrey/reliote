// Codes d'erreur d'authentification traduits (messages auth.errors.*). Tout
// autre texte vient de Supabase tel quel (React l'échappe à l'affichage).
export const AUTH_ERROR_CODES = [
  "invalid",
  "unconfirmed",
  "exists",
  "link",
  "linkUsed",
  "expired",
  "mismatch",
  "short",
  "samePassword",
  "weak",
  "rateLimited",
  "generic",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export function isAuthErrorCode(v: string | undefined): v is AuthErrorCode {
  return !!v && (AUTH_ERROR_CODES as readonly string[]).includes(v);
}

// Codes d'erreur Supabase Auth → nos codes traduits ; autre code → message brut.
export function authErrorCodeFrom(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "same_password":
      return "samePassword";
    case "weak_password":
      return "weak";
    case "user_already_exists":
      return "exists";
    case "email_not_confirmed":
      return "unconfirmed";
    case "invalid_credentials":
      return "invalid";
    default:
      return error.message;
  }
}

// Ce qu'une page d'authentification affiche pour ?error= : un code connu, ou
// « generic ». Jamais le texte brut de l'URL — un lien piégé pourrait sinon
// faire dire n'importe quoi à la vraie page de connexion.
export function displayAuthError(raw: string | undefined): AuthErrorCode | null {
  if (!raw) return null;
  return isAuthErrorCode(raw) ? raw : "generic";
}

// Lien e-mail dont l'échange de code échoue. Avec le flux PKCE, un lien ouvert
// sur un autre appareil (ou déjà utilisé) échoue alors que l'adresse est
// confirmée : on envoie vers la connexion plutôt que de faire recommencer.
export function callbackFailurePath(locale: string, type: string | null): string {
  return type === "recovery" ? `/${locale}/auth/forgot?error=expired` : `/${locale}/auth/login?error=linkUsed`;
}
