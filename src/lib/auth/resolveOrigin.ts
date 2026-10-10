// Origine publique pour les liens envoyés par e-mail. SITE_URL fait foi. En
// production Vercel sans SITE_URL, on prend le domaine de production fourni
// par Vercel — jamais l'en-tête Host, qu'un client peut forger. Ailleurs (dev,
// préproductions), l'hôte de la requête suffit.
export function resolveOrigin(o: {
  siteUrl?: string;
  vercelEnv?: string;
  vercelProdUrl?: string;
  host?: string | null;
  proto?: string | null;
}): string {
  if (o.siteUrl) return o.siteUrl.replace(/\/+$/, "");
  if (o.vercelEnv === "production" && o.vercelProdUrl) return `https://${o.vercelProdUrl}`;
  const host = o.host ?? "localhost:3000";
  const proto = o.proto ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
