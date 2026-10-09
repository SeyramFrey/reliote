// Interprète la réponse de supabase.auth.signUp.
//
// Supabase ne signale pas toujours un e-mail déjà inscrit par une erreur : pour
// ne pas révéler quels e-mails existent, il renvoie un faux utilisateur sans
// identité (`identities: []`) et aucune session. On le reconnaît ici.
export type SignUpOutcome =
  | { kind: "signed_in"; userId: string }
  | { kind: "needs_confirmation"; userId: string }
  | { kind: "already_registered" }
  | { kind: "error"; message: string };

type SignUpResponse = {
  data: {
    user: { id: string; identities?: unknown[] | null } | null;
    session: unknown | null;
  };
  error: { message: string; code?: string } | null;
};

export function signUpOutcome(res: SignUpResponse): SignUpOutcome {
  if (res.error) {
    return res.error.code === "user_already_exists"
      ? { kind: "already_registered" }
      : { kind: "error", message: res.error.message };
  }
  const user = res.data.user;
  if (!user) return { kind: "error", message: "Sign-up returned no user" };
  if (Array.isArray(user.identities) && user.identities.length === 0) {
    return { kind: "already_registered" };
  }
  return res.data.session
    ? { kind: "signed_in", userId: user.id }
    : { kind: "needs_confirmation", userId: user.id };
}
