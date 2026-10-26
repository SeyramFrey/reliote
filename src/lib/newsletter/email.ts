// Règles pures de la newsletter, testées à part (subscriptions.ts touche la base).

/** Adresse normalisée, ou null si elle n'a pas la forme d'un e-mail. */
export function normalizeEmail(raw: unknown): string | null {
  const email = String(raw ?? "").trim().toLowerCase();
  if (email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export type SubscriberStatus = "pending" | "subscribed" | "unsubscribed";

/**
 * Ce que devient une inscription selon l'état existant de l'adresse.
 *  - déjà abonnée : rien ne change, aucun e-mail ;
 *  - adresse dont le propriétaire est déjà vérifié (compte connecté) : abonnée
 *    directement ;
 *  - sinon : en attente, avec un nouvel e-mail de confirmation (double opt-in).
 */
export function nextSubscription(
  current: SubscriberStatus | null,
  verified: boolean,
): { status: SubscriberStatus; sendConfirmation: boolean } {
  if (current === "subscribed") return { status: "subscribed", sendConfirmation: false };
  if (verified) return { status: "subscribed", sendConfirmation: false };
  return { status: "pending", sendConfirmation: true };
}
