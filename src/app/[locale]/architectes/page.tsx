import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { safeLocale } from "@/lib/auth/safeRedirect";

// L'ancien espace « Sélection » est fusionné dans l'espace porteur : les
// propositions, le choix et la révélation (au RDV confirmé) s'y trouvent.
export default async function ArchitectesPage() {
  redirect(`/${safeLocale(await getLocale())}/dashboard/client`);
}
