import "server-only";
import { headers } from "next/headers";
import { resolveOrigin } from "./resolveOrigin";

// Origine publique du site pour les liens envoyés par e-mail (confirmation,
// mot de passe oublié, liens des notifications). Voir resolveOrigin.
export async function appOrigin(): Promise<string> {
  const h = await headers();
  return resolveOrigin({
    siteUrl: process.env.SITE_URL,
    vercelEnv: process.env.VERCEL_ENV,
    vercelProdUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl: process.env.VERCEL_URL,
    production: process.env.NODE_ENV === "production",
    host: h.get("x-forwarded-host") ?? h.get("host"),
    proto: h.get("x-forwarded-proto"),
  });
}
