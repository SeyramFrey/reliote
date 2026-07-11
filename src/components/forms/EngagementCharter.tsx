"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { submitEngagement } from "@/app/[locale]/architectes/engager/actions";

// Modal de charte de non-contournement (côté client).
// Affiche les 7 articles de la charte v1, demande une coche explicite, et
// déclenche le server action qui crée l'engagement → débloque la révélation
// Niveau 3 via la RLS.
export function EngagementCharter({
  projectId,
  architectId,
  architectHandle,
  open,
  onClose,
  onAccepted,
}: {
  projectId: string;
  architectId: string;
  architectHandle: string;
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const t = useTranslations("landing.charter");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setChecked(false);
      setErr(null);
      setSubmitting(false);
    }
  }, [open]);

  async function accept() {
    setSubmitting(true);
    setErr(null);
    const res = await submitEngagement(projectId, architectId);
    if ("error" in res) {
      setErr(res.error);
      setSubmitting(false);
      return;
    }
    onAccepted();
  }

  if (!open) return null;

  const articles = t.raw("client.articles") as { t: string; b: string }[];

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ gridTemplateColumns: "1fr" }}
      >
        <div className="modal-body" style={{ minHeight: "60vh" }}>
          <div className="modal-head">
            <div className="crumb">
              {t("eyebrow")} · {architectHandle}
            </div>
            <button className="modal-close" onClick={onClose}>
              {t("close")}
            </button>
          </div>
          <h3 className="modal-q">
            {t("client.titlePre")}
            <em>{t("client.titleItalic")}</em>
            {t("client.titleRest")}
          </h3>
          <p className="modal-help">{t("client.intro")}</p>

          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: "8px 0 24px",
              display: "grid",
              gap: 14,
            }}
          >
            {articles.map((a, i) => (
              <li
                key={a.t}
                style={{
                  borderTop: "1px solid var(--hairline-soft)",
                  paddingTop: 12,
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
                      fontSize: 13.5,
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

          <label
            style={{
              display: "flex",
              gap: 12,
              alignItems: "start",
              cursor: "pointer",
              padding: "16px 0",
              borderTop: "1px solid var(--hairline)",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span style={{ fontSize: 14, color: "var(--ink-2)" }}>
              {t("client.consent")}
            </span>
          </label>
          {err && (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {err}
            </p>
          )}

          <div className="modal-foot">
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--concrete-2)",
              }}
            >
              {t("version")}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                disabled={submitting}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={accept}
                className="btn btn-primary"
                disabled={!checked || submitting}
                style={{ opacity: checked && !submitting ? 1 : 0.4 }}
              >
                {submitting ? "…" : t("accept")} <span className="btn-arrow" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
