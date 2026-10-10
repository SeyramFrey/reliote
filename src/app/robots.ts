import type { MetadataRoute } from "next";
import { buildRobots, siteUrl } from "@/lib/seo/site";

// Calculé à la requête : SITE_URL et l'environnement sont ceux du serveur qui
// répond, pas ceux de la machine de build (image Docker construite sans
// SITE_URL). Les préproductions Vercel ne sont jamais indexées.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const indexable = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";
  return buildRobots(siteUrl(), indexable);
}
