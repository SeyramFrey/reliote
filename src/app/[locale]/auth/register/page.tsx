import { signUp } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";

// Full-page auth register — split prénom + nom, dark aside matching the wizard's chrome.
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { role: roleParam, error } = await searchParams;
  const role = roleParam === "architect" ? "architect" : "client";

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[420px_1fr] bg-paper">
      <aside
        className="hidden md:flex flex-col justify-between p-12"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(7,62,24,0.92), rgba(5,30,12,0.96)), url(/assets/img-stairs-water.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "var(--color-paper)",
        }}
      >
        <div className="flex items-center gap-[10px]">
          <span className="inline-grid place-items-center w-[22px] h-[22px] border border-current font-display text-[13px] leading-none pt-px">
            R
          </span>
          <span className="font-sans font-medium tracking-[0.18em] text-[13px]">RELIOTE</span>
        </div>
        <div>
          <p className="mono text-[10.5px] tracking-[0.18em] uppercase opacity-65 mb-4">
            {t("registerEyebrow")}
          </p>
          <h2 className="font-light text-4xl leading-tight max-w-[16ch]">
            {role === "architect" ? t("registerArchitectTitle") : t("registerClientTitle")}
          </h2>
          <p className="text-sm text-paper/75 mt-5 max-w-[36ch] leading-relaxed">
            {role === "architect" ? t("registerArchitectSub") : t("registerClientSub")}
          </p>
        </div>
        <div className="mono text-[10.5px] tracking-[0.16em] uppercase opacity-55">
          Paris ⇄ Abidjan
        </div>
      </aside>

      <main className="px-[var(--edge)] py-20 grid place-items-center">
        <div className="w-full max-w-[480px]">
          <p className="eyebrow">{t("registerEyebrow")}</p>
          <h1 className="font-light text-[clamp(36px,4vw,56px)] leading-[1.04] mt-4">
            {role === "architect" ? t("registerArchitectTitle") : t("registerClientTitle")}
          </h1>
          {error && (
            <p className="text-sm text-red-700 mt-6">{decodeURIComponent(error)}</p>
          )}
          <form action={signUp} className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="role" value={role} />
            <label className="block">
              <span className="eyebrow">{t("firstName")}</span>
              <input
                name="first_name"
                required
                className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
              />
            </label>
            <label className="block">
              <span className="eyebrow">{t("lastName")}</span>
              <input
                name="last_name"
                required
                className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="eyebrow">{t("email")}</span>
              <input
                name="email"
                type="email"
                required
                className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="eyebrow">{t("password")}</span>
              <input
                name="password"
                type="password"
                minLength={8}
                required
                className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green text-[16px]"
              />
            </label>
            <button className="md:col-span-2 mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 bg-green text-paper text-sm hover:bg-green-deep transition-colors">
              {t("createAccount")}
              <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
            </button>
          </form>
          <p className="mt-10 text-sm text-concrete-1">
            <a href={`/${locale}/auth/login`} className="hover:text-ink">
              {t("haveAccount")}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
