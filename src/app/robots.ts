import type { MetadataRoute } from "next";
import { buildRobots, siteUrl } from "@/lib/seo/site";

// Les préproductions Vercel ne doivent jamais être indexées.
export default function robots(): MetadataRoute.Robots {
  const indexable = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";
  return buildRobots(siteUrl(), indexable);
}
