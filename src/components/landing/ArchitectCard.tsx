"use client";
import { useTranslations } from "next-intl";
import type { ArchitectRow } from "./ArchitectIndex";

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "" : "empty"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ArchitectCard({
  a,
  index,
  total,
  onOpen,
}: {
  a: ArchitectRow;
  index: number;
  total: number;
  onOpen: () => void;
}) {
  const t = useTranslations("landing.architects");
  const available = a.availability === "available";
  const rating = a.rating ?? 0;
  const fullName = `${a.first_name} ${a.last_name}`.trim();
  const studioLine = [a.structure, a.city].filter(Boolean).join(" · ");
  const fromLabel =
    a.fee_currency && a.fee_amount
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: a.fee_currency,
          maximumFractionDigits: 0,
        }).format(a.fee_amount)
      : null;
  const portrait = a.photo_url
    ? `url(${a.photo_url}), linear-gradient(180deg, var(--concrete-4), var(--concrete-3))`
    : "linear-gradient(180deg, var(--concrete-4), var(--concrete-3))";

  return (
    <button className="archi-card" onClick={onOpen}>
      <div className="archi-portrait">
        <div className="archi-portrait-img" style={{ backgroundImage: portrait }} />
        <div className="badge-row">
          <span className="idx-mark">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className={`avail-pill ${available ? "live" : "busy"}`}>
            <span className="ad" />
            {available ? t("available") : t("booked")}
          </span>
        </div>
        <div className="bottom-tape">
          <span className="rating-row">
            <Stars value={rating} />
            <span>{rating.toFixed(1)}</span>
          </span>
          <span>
            {a.years_experience} {t("yrs")}
          </span>
        </div>
      </div>
      <div>
        <div className="archi-meta-row">
          <div>
            <h3 className="archi-name">{fullName}</h3>
            <div className="archi-studio">{studioLine || "—"}</div>
          </div>
          <span className="verified-pill">
            <span className="verified-dot" />
            {t("verified")}
          </span>
        </div>
        <div className="archi-tags" style={{ marginTop: 10 }}>
          {a.specialties.map((s) => (
            <span key={s} className="tag">
              {s}
            </span>
          ))}
          <span className="lang-chips">
            {a.languages.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </span>
        </div>
      </div>
      <div className="archi-row-bottom">
        <span>
          {fromLabel ? `${t("from")} ${fromLabel}` : "—"}
        </span>
        <span className="archi-cta">{t("view")}</span>
      </div>
    </button>
  );
}
