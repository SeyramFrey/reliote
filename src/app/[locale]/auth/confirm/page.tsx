import { confirmRecovery } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { recoveryTokenFrom } from "@/lib/auth/recoveryToken";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "reset" });
}

// Arrivée depuis le lien « mot de passe oublié » (modèle d'e-mail token_hash).
// Le jeton n'est échangé qu'au clic : les scanners de liens des messageries
// ouvrent l'URL en GET et le consommeraient sinon.
export default async function ConfirmRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { token_hash, type } = await searchParams;
  const tokenHash = recoveryTokenFrom(token_hash, type);
  if (!tokenHash) redirect(`/${locale}/auth/forgot?error=expired`);
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("resetEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{t("resetTitle")}</h1>
      <p className="mt-4 text-concrete-1">{t("confirmRecoveryHint")}</p>
      <form action={confirmRecovery} className="mt-10">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="token_hash" value={tokenHash} />
        <button className="inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">
          {t("confirmRecovery")}
        </button>
      </form>
    </main>
  );
}
