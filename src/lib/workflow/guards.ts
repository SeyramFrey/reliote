// Règles d'autorisation métier partagées par les pages et les actions
// serveur : l'interface cache les boutons, les actions revérifient.

// Le porteur ne voit la présélection anonyme que quand l'admin le lui a
// demandé, qu'il y a vraiment un choix (≥ 2) et qu'aucun RDV n'est ouvert.
export function shortlistVisible(o: { choiceRequested: boolean; proposedCount: number; hasOpenMeeting: boolean }): boolean {
  return o.choiceRequested && o.proposedCount >= 2 && !o.hasOpenMeeting;
}

type Guard = { projectStatus: string; architectStatus: string | null | undefined };

export function canPropose(g: Guard): boolean {
  return g.projectStatus !== "closed" && g.architectStatus === "verified";
}

export function canSchedule(g: Guard): boolean {
  return g.projectStatus !== "closed" && g.architectStatus === "verified";
}
