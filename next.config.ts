import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // "standalone" only when we build our own Docker image (self-hosted / VPS).
  // On Vercel it must NOT be set — Vercel controls its own build output and
  // "standalone" makes every route return 404 in production.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Supabase Storage — photos uploadées par les architectes (bucket architect-photos).
      // Matche n'importe quel projet Supabase Cloud (*.supabase.co) + self-hosted local.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "http",  hostname: "localhost",    port: "54321", pathname: "/storage/v1/object/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
