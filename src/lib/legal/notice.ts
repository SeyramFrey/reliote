// Mention sous les formulaires (inscription, dépôt de projet, candidature
// architecte). On ne renvoie qu'aux documents réellement publiés — la policy
// de 0012 masque les brouillons — et rien du tout tant qu'aucun ne l'est.

export type LegalNoticeVariant = "both" | "cguOnly" | "privacyOnly";

export function legalNoticeVariant(published: readonly string[]): LegalNoticeVariant | null {
  const cgu = published.includes("cgu");
  const privacy = published.includes("confidentialite");
  if (cgu && privacy) return "both";
  if (cgu) return "cguOnly";
  if (privacy) return "privacyOnly";
  return null;
}
