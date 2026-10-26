// Origine publique pour les liens envoyés par e-mail. SITE_URL fait foi. Sur
// Vercel sans SITE_URL, on prend le domaine fourni par Vercel (production, ou
// l'URL du déploiement en préproduction) — jamais l'en-tête Host, qu'un client
// peut forger. Un serveur de production hors Vercel (VPS) sans SITE_URL est une
// erreur de configuration : on refuse plutôt que d'envoyer des liens vers
// l'hôte annoncé par la requête. Seul le dev local lit l'hôte de la requête.
export function resolveOrigin(o: {
  siteUrl?: string;
  vercelEnv?: string;
  vercelProdUrl?: string;
  vercelUrl?: string;
  production?: boolean;
  host?: string | null;
  proto?: string | null;
}): string {
  if (o.siteUrl) return o.siteUrl.replace(/\/+$/, "");
  if (o.vercelEnv === "production" && o.vercelProdUrl) return `https://${o.vercelProdUrl}`;
  if (o.vercelEnv && o.vercelUrl) return `https://${o.vercelUrl}`;
  if (o.production) throw new Error("SITE_URL doit être défini en production.");
  const host = o.host ?? "localhost:3000";
  const proto = o.proto ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
