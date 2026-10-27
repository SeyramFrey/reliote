import { createServiceClient } from "@/lib/supabase/service";
import { resetUserMfa } from "@/lib/auth/adminMfaActions";

// Fiche admin : état de la double authentification d'un compte, et sa
// réinitialisation quand la personne a perdu son appareil.
export async function AccountMfa({ userId, returnTo }: { userId: string | null; returnTo: string }) {
  if (!userId) return null;
  const { data } = await createServiceClient().auth.admin.mfa.listFactors({ userId });
  const count = (data?.factors ?? []).filter((f) => f.status === "verified").length;
  return (
    <section className="mt-8 border-t border-[var(--hairline)] pt-6">
      <p className="eyebrow">Double authentification</p>
      <p className="mt-2 text-sm text-concrete-1">
        {count === 0 ? "Pas encore activée." : `Active — ${count} appareil${count > 1 ? "s" : ""}.`}
      </p>
      {count > 0 && (
        <form action={resetUserMfa} className="mt-3">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink">
            Réinitialiser (appareil perdu, identité vérifiée)
          </button>
        </form>
      )}
    </section>
  );
}
