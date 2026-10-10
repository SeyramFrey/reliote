"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/[locale]/auth/actions";

// État de connexion lu côté navigateur. `null` tant qu'il n'est pas connu :
// rien n'est rendu avant, pour ne pas afficher « Se connecter » une fraction
// de seconde à quelqu'un de connecté.
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const supabase = createClient();
    // Simple indication d'interface : la session locale suffit (getUser ferait
    // un aller-retour réseau à chaque page). Les accès réels sont vérifiés
    // côté serveur.
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(!!session?.user),
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return signedIn;
}

const textLink = "text-[13px] opacity-80 hover:opacity-100 transition-opacity";

// Écrans ≥ sm : liens texte à côté du sélecteur de langue.
export function NavAccount({ signedIn }: { signedIn: boolean | null }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  if (signedIn === null) return null;
  if (!signedIn) {
    return (
      <Link href={`/${locale}/auth/login`} className={textLink}>
        {t("signIn")}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3.5">
      <Link href={`/${locale}/dashboard`} className={textLink}>
        {t("mySpace")}
      </Link>
      <form action={signOut.bind(null, locale)}>
        <button className={textLink}>{t("signOut")}</button>
      </form>
    </div>
  );
}

// Mobile, connecté : « Mon espace » prend la place du bouton principal, plus
// une icône de déconnexion — la barre n'a pas la largeur pour trois liens.
export function NavAccountMobile() {
  const locale = useLocale();
  const t = useTranslations("nav");
  return (
    <div className="flex items-center gap-2.5">
      <Link
        href={`/${locale}/dashboard`}
        className="inline-flex items-center px-4 py-3 bg-green text-paper text-[13px] font-medium hover:bg-green-deep transition-colors"
      >
        {t("mySpace")}
      </Link>
      <form action={signOut.bind(null, locale)}>
        <button aria-label={t("signOut")} title={t("signOut")} className="p-2 opacity-80 hover:opacity-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
          </svg>
        </button>
      </form>
    </div>
  );
}
