// Codes d'erreur d'authentification traduits (messages auth.errors.*). Tout
// autre texte vient de Supabase tel quel (React l'échappe à l'affichage).
export const AUTH_ERROR_CODES = [
  "invalid",
  "unconfirmed",
  "exists",
  "link",
  "expired",
  "mismatch",
  "short",
  "samePassword",
  "weak",
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
