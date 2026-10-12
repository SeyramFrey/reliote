// Règles métier de la messagerie, pures et testées. Les actions serveur les
// appliquent ; la RLS (0017) ne fait que restreindre la lecture.

export type ThreadKind = "project_client" | "project_architect" | "architect_admission";
export type Side = "admin" | "owner";
export type EngagementStatus = "proposed" | "engaged" | "declined" | "cancelled" | "expired";
export type EngagementLite = { architectId: string; status: EngagementStatus };

export const EDIT_WINDOW_MS = 5 * 60 * 1000;
const NOTIFY_INTERVAL_MS = 60 * 60 * 1000;

const ACTIVE: readonly EngagementStatus[] = ["proposed", "engaged"];

// L'architecte retenu est le seul engagement encore actif du projet : après le
// choix du porteur les autres sont écartés, et une proposition unique est
// retenue d'office. Tant que plusieurs sont actifs, personne ne l'est.
export function retainedArchitectId(engagements: EngagementLite[]): string | null {
  const active = engagements.filter((e) => ACTIVE.includes(e.status));
  return active.length === 1 ? active[0].architectId : null;
}

export function canOpenArchitectThread(engagements: EngagementLite[], architectId: string): boolean {
  return retainedArchitectId(engagements) === architectId;
}

export function threadWritable(
  t: { kind: ThreadKind; architectId: string | null },
  engagements: EngagementLite[],
): boolean {
  if (t.kind !== "project_architect") return true;
  return t.architectId !== null && retainedArchitectId(engagements) === t.architectId;
}

export function canEditMessage(
  m: { authorId: string | null; createdAt: string; deletedAt: string | null },
  viewerId: string,
  now: Date,
): boolean {
  if (!m.authorId || m.authorId !== viewerId || m.deletedAt) return false;
  return now.getTime() - Date.parse(m.createdAt) < EDIT_WINDOW_MS;
}

export function editableUntil(m: { createdAt: string; deletedAt: string | null }): string | null {
  if (m.deletedAt) return null;
  return new Date(Date.parse(m.createdAt) + EDIT_WINDOW_MS).toISOString();
}

export function isSeen(createdAt: string, otherSideLastRead: string | null): boolean {
  return !!otherSideLastRead && Date.parse(otherSideLastRead) >= Date.parse(createdAt);
}

// Un e-mail par heure au plus — sauf si le destinataire a lu le fil depuis le
// dernier e-mail : le message suivant mérite alors une nouvelle alerte.
export function shouldNotify(p: { lastNotifiedAt: string | null; recipientLastReadAt: string | null; now: Date }): boolean {
  if (!p.lastNotifiedAt) return true;
  const last = Date.parse(p.lastNotifiedAt);
  if (p.now.getTime() - last >= NOTIFY_INTERVAL_MS) return true;
  return !!p.recipientLastReadAt && Date.parse(p.recipientLastReadAt) > last;
}

export function forwardTarget(kind: ThreadKind): ThreadKind | null {
  if (kind === "project_architect") return "project_client";
  if (kind === "project_client") return "project_architect";
  return null;
}

// Avant le RDV confirmé (engagement « engaged »), un document peut trahir une
// identité ou des coordonnées : l'admin doit cocher qu'il l'a vérifié.
export function needsAnonymityCheck(retainedStatus: EngagementStatus | null): boolean {
  return retainedStatus !== "engaged";
}

// N'écrire l'accusé de lecture que s'il change quelque chose : chaque écriture
// émet un événement temps réel qui recharge le fil (sinon boucle sans fin).
export function needsReadUpdate(currentLastRead: string | null, latestOtherSideAt: string | null): boolean {
  if (!currentLastRead) return true;
  return !!latestOtherSideAt && Date.parse(latestOtherSideAt) > Date.parse(currentLastRead);
}
