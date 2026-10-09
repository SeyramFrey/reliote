// Libellés français des statuts (interface admin, francophone).

export const PROJECT_STATUS_FR: Record<string, string> = {
  new: "Nouveau",
  matched: "Correspondances prêtes",
  selected: "Architecte(s) proposé(s)",
  meeting_proposed: "RDV proposé",
  meeting_confirmed: "RDV confirmé",
  in_review: "En revue",
  closed: "Clôturé",
};

export const MEETING_STATUS_FR: Record<string, string> = {
  proposed: "Proposé",
  confirmed: "Confirmé",
  declined: "Décliné",
  rescheduled: "Replanifié — à reconfirmer",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const ENGAGEMENT_STATUS_FR: Record<string, string> = {
  proposed: "Proposé",
  engaged: "Engagé — identités révélées",
  declined: "Décliné par le porteur",
  cancelled: "Retiré",
  expired: "Expiré",
};
