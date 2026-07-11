import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SectionHead } from "./SectionHead";

// Replaces the public architect index. Renders aggregate proof (counts +
// averages + coverage) without ever exposing a single architect row to the
// browser. The SERVICE_ROLE_KEY used by createServiceClient is server-only
// (env var not in NEXT_PUBLIC_*) and bypasses the RLS that, since migration
// 0007, blocks anonymous + unmatched-client reads of architect_profiles.
//
// Static numbers (1 / 6 admission rate, 365 days mediation, 8-step brief) live
// in i18n because they're product promises, not derived data.

type Architect = {
  rating: number | null;
  years_experience: number;
  city: string;
  diploma: string | null;
  specialties: string[];
};

const TRUST_ICONS = ["✓", "★", "⊕", "≡"];

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export async function MethodProof() {
  const locale = await getLocale();
  const t = await getTranslations("landing.method");
  const architectsT = await getTranslations("landing.architects");
  const trust = architectsT.raw("trust") as { strong: string; sub: string }[];

  const service = createServiceClient();
  const { data, count } = (await service
    .from("architect_profiles")
    .select("rating, years_experience, city, diploma, specialties", {
      count: "exact",
    })
    .eq("status", "verified")) as { data: Architect[] | null; count: number | null };

  const rows = data ?? [];
  const total = count ?? 0;
  const ratings = rows.map((r) => r.rating).filter((r): r is number => r !== null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, v) => s + v, 0) / ratings.length
      : 0;
  const medianYears = median(rows.map((r) => r.years_experience));
  const cities = [...new Set(rows.map((r) => r.city))].sort();
  const diplomas = [
    ...new Set(rows.map((r) => r.diploma).filter((d): d is string => !!d)),
  ].sort();
  const specialties = [...new Set(rows.flatMap((r) => r.specialties))].sort();

  return (
    <section className="sect archi-block" id="architectes">
      <SectionHead
        num={t("eyebrow")}
        titlePre={t("titlePre")}
        titleItalic={t("titleItalic")}
        titleRest={t("titleRest")}
        kicker={t("kicker")}
      />

      <div className="trust-band">
        {trust.map((it, i) => (
          <div key={i} className="ti">
            <span className="ic">{TRUST_ICONS[i]}</span>
            <span>
              <strong>{it.strong}</strong>
              <br />
              <span>{it.sub}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="stat-strip" style={{ marginTop: 32 }}>
        <div className="stat-grid">
          <div className="stat-cell">
            <div className="stat-num">{total}</div>
            <div className="stat-label">{t("stats.verified")}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">
              {avgRating.toFixed(1)}
              <small> / 5</small>
            </div>
            <div className="stat-label">{t("stats.rating")}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">
              {medianYears}
              <small> {architectsT("yrs")}</small>
            </div>
            <div className="stat-label">{t("stats.yearsMedian")}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">1 / 6</div>
            <div className="stat-label">{t("stats.admission")}</div>
          </div>
        </div>
      </div>

      <div
        className="page-edge"
        style={{
          marginTop: 48,
          display: "grid",
          gap: 22,
          maxWidth: "1080px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <ChipRow label={t("coverage.diplomas")} items={diplomas} />
        <ChipRow label={t("coverage.specialties")} items={specialties} />
        <ChipRow label={t("coverage.cities")} items={cities} />
      </div>

      <div
        className="page-edge"
        style={{
          marginTop: 56,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <p
          className="serif-i"
          style={{
            fontSize: "clamp(20px, 2vw, 26px)",
            color: "var(--ink-2)",
            maxWidth: "44ch",
            margin: 0,
            lineHeight: 1.35,
          }}
        >
          {t("ctaLead")}
        </p>
        <Link
          href={`/${locale}/projets/initier`}
          className="btn btn-primary"
          style={{ marginTop: 6 }}
        >
          {t("cta")} <span className="btn-arrow" />
        </Link>
      </div>
    </section>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(180px, 220px) 1fr",
        gap: 24,
        alignItems: "baseline",
        borderTop: "1px solid var(--hairline-soft)",
        paddingTop: 18,
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--concrete-2)",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map((it) => (
          <span key={it} className="tag">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
