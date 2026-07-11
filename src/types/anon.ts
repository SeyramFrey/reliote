// Niveau 2 — colonnes anonymisables exposées par la vue `architect_profiles_anon`.
// Aucune colonne sensible : ni nom, ni ville précise, ni téléphone, ni email,
// ni photo, ni structure, ni N° d'agrément, ni montant d'honoraires.
//
// Côté front, on n'importe JAMAIS ArchitectRow tant que l'engagement n'est pas
// accepté — c'est cette typage qui fait office de garde-fou statique.
export type ArchitectAnonRow = {
  id: string;
  anon_handle: string;
  years_bracket: "< 5 ans" | "5 — 10 ans" | "10 — 15 ans" | "15 ans et +";
  specialties: string[];
  project_types: string[];
  languages: string[];
  diploma: string | null;
  rating: number | null;
  region: string;
  availability: "available" | "busy" | "unavailable";
  status: "pending" | "verified" | "rejected" | "paused";
};

// Engagement client→architecte. La présence de status='engaged' débloque le
// passage Niveau 2 → Niveau 3 dans l'UI (et dans la RLS).
export type ClientEngagement = {
  id: string;
  project_id: string;
  architect_id: string;
  status: "proposed" | "engaged" | "declined" | "cancelled" | "expired";
  charter_version: string | null;
  charter_accepted: boolean;
  proposed_at: string;
  engaged_at: string | null;
};

export type EngagementRelay = {
  engagement_id: string;
  client_relay: string;
  architect_relay: string;
  created_at: string;
};

export const CURRENT_CHARTER_VERSION = "v1";
