import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { baseCsp, cspEnv } from "./src/lib/security/csp";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const securityHeaders = [
  // Les pages reçoivent en plus la CSP à nonce du proxy (src/lib/security/csp.ts).
  { key: "Content-Security-Policy", value: baseCsp(cspEnv()) },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // 404 des URL hors /fr et /en : le layout racine est sous [locale], il n'y a
  // donc pas de layout commun pour composer une 404 classique.
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // "standalone" only when we build our own Docker image (self-hosted / VPS).
  // On Vercel it must NOT be set — Vercel controls its own build output and
  // "standalone" makes every route return 404 in production.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  images: {
    // L'optimiseur ne sert que les images du site (public/) : une URL distante
    // autorisée ici le transformerait en proxy de fichiers arbitraires, décodés
    // par sharp sur le serveur. Les images de Storage sont rendues en <img>.
    remotePatterns: [],
    dangerouslyAllowSVG: false,
  },
};

export default withNextIntl(nextConfig);
