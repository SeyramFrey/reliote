"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseRecoveryHash } from "@/lib/auth/recoveryHash";

// Monté dans le layout : un lien « mot de passe oublié » ou une invitation peut
// atterrir sur n'importe quelle page (repli sur la Site URL de Supabase). On
// ouvre la session de récupération puis on mène au choix du mot de passe.
export function RecoveryHashHandler({ locale }: { locale: string }) {
  useEffect(() => {
    const link = parseRecoveryHash(window.location.hash);
    if (!link) return;
    // Les jetons ne doivent pas rester dans l'historique.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    const expired = `/${locale}/auth/forgot?error=expired`;
    if (link.kind === "error") {
      window.location.replace(expired);
      return;
    }
    createClient()
      .auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken })
      .then(({ error }) => window.location.replace(error ? expired : `/${locale}/auth/reset`));
  }, [locale]);
  return null;
}
