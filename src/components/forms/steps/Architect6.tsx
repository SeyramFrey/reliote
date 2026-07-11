"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

type CharterArticle = { t: string; b: string };

function formatFee(currency?: "EUR" | "XOF", amount?: number) {
  if (!currency || !amount) return "—";
  return new Intl.NumberFormat(currency === "EUR" ? "fr-FR" : "fr-CI", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Architect6() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const t = useTranslations("wizardArchitect");
  const v = useWatch();
  const fullName = [v.first_name, v.last_name].filter(Boolean).join(" ") || "—";

  const rows: [string, string][] = [
    [t("fields.full_name"), fullName],
    [t("fields.email"), v.email ?? "—"],
    [t("fields.phone"), v.phone ?? "—"],
    [t("fields.country"), v.country ?? "—"],
    [t("fields.city"), v.city ?? "—"],
    [t("fields.structure"), v.structure || "—"],
    [t("fields.ordre_number"), v.ordre_number || "—"],
    [t("fields.diploma"), v.diploma || "—"],
    [t("fields.specialties"), (v.specialties ?? []).join(" · ") || "—"],
    [t("fields.languages"), (v.languages ?? []).join(" · ") || "—"],
    [
      t("fields.project_types"),
      (v.project_types ?? []).join(" · ") || "—",
    ],
    [
      t("fields.years_experience"),
      v.years_experience ? `${v.years_experience} ${t("yearsSuffix")}` : "—",
    ],
    [
      t("fields.availability"),
      v.availability ? t(`availability.${v.availability}`) : "—",
    ],
    [t("fields.fee"), formatFee(v.fee_currency, v.fee_amount)],
  ];

  const charterT = useTranslations("landing.charter");
  const charterArticles = charterT.raw("architect.articles") as CharterArticle[];

  return (
    <div className="space-y-8">
      {v.photo_url && (
        <div className="flex items-center gap-5 border border-[var(--hairline-soft)] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={v.photo_url}
            alt=""
            className="w-20 h-24 object-cover"
            style={{ aspectRatio: "4 / 5" }}
          />
          <div>
            <div className="font-display text-2xl leading-tight">{fullName}</div>
            <div className="text-sm text-concrete-2 mt-1">
              {v.structure ?? ""} {v.structure && v.city ? "·" : ""} {v.city ?? ""}
            </div>
          </div>
        </div>
      )}
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 border-t border-[var(--hairline)]">
        {rows.map(([k, val]) => (
          <div
            key={k}
            className="flex justify-between gap-4 py-3 border-b border-[var(--hairline-soft)]"
          >
            <dt className="eyebrow shrink-0 max-w-[55%]">{k}</dt>
            <dd className="text-sm text-right break-words max-w-[60%]">{val}</dd>
          </div>
        ))}
      </dl>
      {/* Charte de non-contournement architecte — v1. Bloc déroulant l'intégralité
          des 7 articles. L'acceptation est signalée par la même case `terms` que
          la confirmation d'exactitude des informations : on cumule explicitement
          les deux engagements dans un seul consentement, comme dit dans le label. */}
      <div
        className="border"
        style={{
          borderColor: "var(--hairline)",
          background: "var(--paper-2)",
          padding: "20px 24px",
        }}
      >
        <p className="eyebrow">{charterT("eyebrow")}</p>
        <h3 className="font-light text-2xl mt-2 leading-tight max-w-[34ch]">
          {charterT("architect.titlePre")}
          <em className="serif-i">{charterT("architect.titleItalic")}</em>
          {charterT("architect.titleRest")}
        </h3>
        <p className="text-concrete-1 mt-4 text-sm max-w-[60ch]">
          {charterT("architect.intro")}
        </p>
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: "20px 0 4px",
            display: "grid",
            gap: 12,
          }}
        >
          {charterArticles.map((a, i) => (
            <li
              key={a.t}
              style={{
                borderTop: "1px solid var(--hairline-soft)",
                paddingTop: 10,
                display: "grid",
                gridTemplateColumns: "28px 1fr",
                gap: 12,
                alignItems: "start",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--concrete-2)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong style={{ fontWeight: 500 }}>{a.t}</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "var(--concrete-1)",
                    lineHeight: 1.55,
                  }}
                >
                  {a.b}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p
          className="mono"
          style={{
            marginTop: 18,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--concrete-2)",
          }}
        >
          {charterT("version")}
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" {...register("terms")} className="mt-1" />
        <span className="text-sm text-concrete-1">{t("fields.terms")}</span>
      </label>
      {errors.terms && (
        <span className="text-xs text-red-700 block">
          {String(errors.terms.message)}
        </span>
      )}
    </div>
  );
}
