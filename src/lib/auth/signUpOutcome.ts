// Interprète la réponse de supabase.auth.signUp.
//
// Supabase ne signale pas toujours un e-mail déjà inscrit par une erreur : pour
// ne pas révéler quels e-mails existent, il renvoie un faux utilisateur sans
// identité (`identities: []`) et aucune session. On le reconnaît ici.
export type SignUpOutcome =
  | { kind: "signed_in"; userId: string }
  | { kind: "needs_confirmation"; userId: string }
  | { kind: "already_registered" }
  | { kind: "error"; message: string; code?: string };

type SignUpResponse = {
  data: {
    user: { id: string; identities?: unknown[] | null; created_at?: string } | null;
    session: unknown | null;
  };
  error: { message: string; code?: string } | null;
};

// Un compte existant mais jamais confirmé revient lui aussi « sans session » :
// on le distingue d'un compte tout juste créé par sa date de création.
const FRESH_ACCOUNT_MS = 60_000;

export function signUpOutcome(res: SignUpResponse, now: Date = new Date()): SignUpOutcome {
  if (res.error) {
    return res.error.code === "user_already_exists"
      ? { kind: "already_registered" }
      : { kind: "error", message: res.error.message, code: res.error.code };
  }
  const user = res.data.user;
  if (!user) return { kind: "error", message: "Sign-up returned no user" };
  if (Array.isArray(user.identities) && user.identities.length === 0) {
    return { kind: "already_registered" };
  }
  if (res.data.session) return { kind: "signed_in", userId: user.id };
  if (user.created_at && now.getTime() - new Date(user.created_at).getTime() > FRESH_ACCOUNT_MS) {
    return { kind: "already_registered" };
  }
  return { kind: "needs_confirmation", userId: user.id };
}
