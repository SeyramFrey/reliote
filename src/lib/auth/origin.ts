import "server-only";
import { headers } from "next/headers";

// Origine publique du site pour les liens envoyés par e-mail (confirmation,
// mot de passe oublié). SITE_URL fait foi ; à défaut (dev, préproduction sans
// variable), on reprend l'hôte de la requête en cours.
export async function appOrigin(): Promise<string> {
  const configured = process.env.SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
