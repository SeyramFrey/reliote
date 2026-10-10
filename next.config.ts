import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

// En-têtes de sécurité appliqués à toutes les réponses.
// La CSP ne restreint volontairement pas encore script-src/style-src : Next.js
// injecte des scripts inline, MapLibre crée des workers blob: et CKEditor a ses
// propres besoins — une CSP de scripts stricte demande des nonces et sera posée
// à part. Les directives ci-dessous ne touchent pas au rendu et ferment déjà le
// clickjacking, l'injection de <base> et de plugins, et les formulaires détournés.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
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
