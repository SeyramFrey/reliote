import type { Locale } from "@/lib/i18n/config";

// Espace d'arrivée de chaque rôle.
export function dashboardPathFor(role: string | null | undefined, locale: Locale): string {
  if (role === "admin") return `/${locale}/admin`;
  if (role === "architect") return `/${locale}/dashboard/architecte`;
  return `/${locale}/dashboard/client`;
}
