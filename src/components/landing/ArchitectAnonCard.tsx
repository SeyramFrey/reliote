"use client";
import { useTranslations } from "next-intl";
import type { ArchitectAnonRow } from "@/types/anon";

// Carte Niveau 2 — strictement anonyme.
// Aucune photo, aucun nom, aucune ville précise, aucun montant. Le client voit
// le handle ("A047"), le bracket d'expérience, la région large, les spécialités,
// le diplôme, la note. Bouton "Voir l'identité" ouvre la charte.
//
// Quand la charte est acceptée, le composant parent remplace cette carte par
// ArchitectCard (Niveau 3 — identité complète).
export function ArchitectAnonCard({
  a,
  index,
  total,
  onEngage,
}: {
  a: ArchitectAnonRow;
  index: number;
  total: number;
  onEngage: (architectId: string) => void;
}) {
  const t = useTranslations("landing.anon");
  const tlArch = useTranslations("landing.architects");
  const available = a.availability === "available";
  const rating = a.rating ?? 0;

  return (
    <article
      className="archi-card"
      style={{ cursor: "default" }}
      aria-label={`${t("handle")} ${a.anon_handle}`}
    >
      {/* "Portrait" abstrait : aucune image. Juste un bloc minéral avec le handle. */}
      <div className="archi-portrait" style={{ background: "var(--ink-2)" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "var(--paper)",
            opacity: 0.92,
          }}
        >
          <span
            className="serif-i"
            style={{ fontSize: "clamp(40px, 5vw, 64px)", letterSpacing: "-0.02em" }}
          >
            {a.anon_handle}
          </span>
        </div>
        <div className="badge-row">
          <span className="idx-mark">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className={`avail-pill ${available ? "live" : "busy"}`}>
            <span className="ad" />
            {available ? tlArch("available") : tlArch("booked")}
          </span>
        </div>
        <div className="bottom-tape">
          <span>
            {a.years_bracket} · {a.region}
          </span>
          <span>★ {rating.toFixed(1)}</span>
        </div>
      </div>

      <div>
        <div className="archi-meta-row">
          <div>
            <h3 className="archi-name" style={{ fontFamily: "var(--f-mono)" }}>
              {t("handle")} {a.anon_handle}
            </h3>
            <div className="archi-studio">{a.region}</div>
          </div>
          <span className="verified-pill">
            <span className="verified-dot" />
            {tlArch("verified")}
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

        {a.diploma && (
          <div
            className="mono"
            style={{
              marginTop: 12,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--concrete-2)",
            }}
          >
            {t("diploma")} · {a.diploma}
          </div>
        )}
      </div>

      <div className="archi-row-bottom" style={{ alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--concrete-2)" }}>
          {t("hidden")}
        </span>
        <button
          type="button"
          onClick={() => onEngage(a.id)}
          className="archi-cta"
          style={{
            border: "1px solid var(--ink)",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          {t("reveal")}
        </button>
      </div>
    </article>
  );
}
