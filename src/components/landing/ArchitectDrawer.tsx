"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ArchitectRow } from "./ArchitectIndex";

const WORK = [
  "/assets/img-courtyard-pool.jpg",
  "/assets/img-stairs-water.jpg",
  "/assets/img-redrock-pool.jpg",
  "/assets/img-museum-mist.jpg",
  "/assets/img-courtyard-pool.jpg",
  "/assets/img-stairs-water.jpg",
];

export function ArchitectDrawer({
  architect,
  onClose,
}: {
  architect: ArchitectRow | null;
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("landing.drawer");

  useEffect(() => {
    if (!architect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [architect, onClose]);

  if (!architect) return null;
  const a = architect;
  const rating = a.rating ?? 0;
  const fullName = `${a.first_name} ${a.last_name}`.trim();
  const feeDisplay =
    a.fee_currency && a.fee_amount
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: a.fee_currency,
          maximumFractionDigits: 0,
        }).format(a.fee_amount)
      : "—";

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={fullName}>
        <div
          className="drawer-hero"
          style={
            a.photo_url
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(12,22,20,0.18), rgba(12,22,20,0.55)), url(${a.photo_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!a.photo_url && <div className="silhouette" />}
          <div className="corner-tl">{a.city}</div>
          <div className="corner-br">
            <div style={{ opacity: 0.6 }}>{t("verifiedProfile")}</div>
            <div>{rating.toFixed(1)} / 5</div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="drawer-body">
          <div className="eyebrow">{a.city}</div>
          <h2 className="drawer-title">{fullName}</h2>
          <div className="drawer-sub">
            {a.city} · {t("registered")}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            {a.specialties.map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
            <span className="verified-pill">
              <span className="verified-dot" /> {t("verified")}
            </span>
          </div>

          <div className="drawer-section">
            <h4>{t("approach")}</h4>
            <p>{a.description}</p>
          </div>

          <div className="drawer-section">
            <h4>{t("atAGlance")}</h4>
            <div className="drawer-meta">
              <div className="kv">
                <span className="k">{t("experience")}</span>
                <span className="v">
                  {a.years_experience} {t("yearsSuffix")}
                </span>
              </div>
              <div className="kv">
                <span className="k">{t("rating")}</span>
                <span className="v">{rating.toFixed(1)} / 5</span>
              </div>
              <div className="kv">
                <span className="k">{t("languages")}</span>
                <span className="v">{a.languages.join(", ")}</span>
              </div>
              <div className="kv">
                <span className="k">{t("fees")}</span>
                <span className="v">{feeDisplay}</span>
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <h4>{t("selectedWork")}</h4>
            <div className="work-grid">
              {WORK.map((src, i) => (
                <div
                  key={i}
                  className="work-cell"
                  style={{ backgroundImage: `url(${src})` }}
                />
              ))}
            </div>
          </div>

          {/* Rappel explicite : pas de contact direct. Le téléphone et l'email
              personnels de l'architecte ne sont jamais exposés. */}
          <div className="drawer-section" style={{ background: "var(--paper-2)", padding: 18, margin: "0 -8px" }}>
            <h4 style={{ color: "var(--green)" }}>{t("channel.title")}</h4>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
              {t("channel.body")}
            </p>
          </div>
        </div>

        <div className="drawer-foot">
          <div>
            <div className="price">{feeDisplay}</div>
            <small>{t("feesFrom")}</small>
          </div>
          <Link
            href={`/${locale}/projets/initier`}
            className="btn btn-primary"
            onClick={onClose}
          >
            {t("requestMeeting")} <span className="btn-arrow" />
          </Link>
        </div>
      </aside>
    </>
  );
}
