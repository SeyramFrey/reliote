import "server-only";

// Templates e-mail transactionnels bilingues (fr/en), HTML inline (compatibilité
// clients mail). Ton éditorial Reliote : papier, encre, laiton, mono en eyebrow.
// Chaque fonction renvoie { subject, html } prêt pour sendEmail().

export type Loc = "fr" | "en";
const L = (loc: string): Loc => (loc === "en" ? "en" : "fr");
const pick = (loc: Loc, fr: string, en: string) => (loc === "en" ? en : fr);

function esc(s: string): string {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function fmtDate(iso: string, loc: Loc): string {
  try {
    return new Date(iso).toLocaleString(loc === "en" ? "en-GB" : "fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function detailBox(rows: [string, string][]): string {
  const trs = rows
    .map(
      ([k, v]) =>
        `<tr>` +
        `<td style="padding:9px 0;border-bottom:1px solid #e2ddd2;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8577;width:40%;vertical-align:top;">${k}</td>` +
        `<td style="padding:9px 0;border-bottom:1px solid #e2ddd2;font-size:14px;color:#1a1a17;">${v}</td>` +
        `</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;border-collapse:collapse;">${trs}</table>`;
}

function cta(url: string, label: string): string {
  return `<div style="margin-top:26px;"><a href="${esc(url)}" style="display:inline-block;background:#1a1a17;color:#f5f3ee;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;padding:12px 22px;">${esc(label)}</a></div>`;
}

function shell(opts: {
  eyebrow: string;
  title: string;
  body: string;
  note?: string;
}): string {
  return (
    `<!doctype html><html><body style="margin:0;background:#e9e6df;padding:32px 0;font-family:Georgia,'Times New Roman',serif;color:#1a1a17;-webkit-font-smoothing:antialiased;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">` +
    `<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#f5f3ee;border:1px solid #d8d3c8;">` +
    `<tr><td style="padding:26px 36px;border-bottom:1px solid #d8d3c8;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#8a8577;">RELIOTE</td></tr>` +
    `<tr><td style="padding:36px 36px 40px;">` +
    `<div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#b89968;margin-bottom:18px;">${opts.eyebrow}</div>` +
    `<h1 style="margin:0 0 20px;font-weight:400;font-size:26px;line-height:1.25;color:#1a1a17;">${opts.title}</h1>` +
    `<div style="font-size:15px;line-height:1.6;color:#3a3730;">${opts.body}</div>` +
    (opts.note
      ? `<div style="margin-top:24px;padding-top:18px;border-top:1px solid #d8d3c8;font-size:12.5px;line-height:1.5;color:#8a8577;">${opts.note}</div>`
      : "") +
    `</td></tr>` +
    `<tr><td style="padding:20px 36px;border-top:1px solid #d8d3c8;font-family:'Courier New',monospace;font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:#8a8577;">Reliote — Afrique ⇄ Monde</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}

// ── 1. Accusé de réception du projet (→ porteur) ─────────────────────────────
export function projectReceivedEmail(
  loc0: string,
  d: {
    clientName: string;
    projectType: string;
    projectCountry: string;
    projectLocation: string;
    matchCount: number;
    ctaUrl?: string | null;
  },
) {
  const loc = L(loc0);
  const subject = pick(loc, "Votre projet est bien reçu — Reliote", "We've received your project — Reliote");
  const eyebrow = pick(loc, "Accusé de réception", "Project received");
  const title = pick(loc, `Merci, ${esc(d.clientName)}.`, `Thank you, ${esc(d.clientName)}.`);
  const rows: [string, string][] = [
    [pick(loc, "Type", "Type"), esc(d.projectType)],
    [pick(loc, "Pays du chantier", "Build country"), esc(d.projectCountry)],
    [pick(loc, "Localité", "Locality"), esc(d.projectLocation)],
    [pick(loc, "Correspondances", "Matches"), String(d.matchCount)],
  ];
  const body =
    `<p style="margin:0 0 4px;">${pick(loc, "Votre projet est enregistré. Nos équipes identifient les architectes les plus pertinents pour votre chantier en Afrique.", "Your project is registered. Our team is identifying the most relevant architects for your build in Africa.")}</p>` +
    detailBox(rows) +
    `<p style="margin:16px 0 0;">${pick(loc, "Nous revenons vers vous sous 48 heures ouvrées.", "We'll get back to you within two business days.")}</p>` +
    (d.ctaUrl ? cta(d.ctaUrl, pick(loc, "Voir mes projets", "View my projects")) : "");
  return { subject, html: shell({ eyebrow, title, body }) };
}

// ── 2. Proposition de RDV (→ porteur / architecte) ───────────────────────────
export function meetingProposedEmail(
  loc0: string,
  recipient: "client" | "architect",
  d: { scheduledAt: string; videoUrl?: string | null; projectLabel: string; ctaUrl?: string | null },
) {
  const loc = L(loc0);
  const subject = pick(loc, "Proposition de rendez-vous — Reliote", "A meeting has been proposed — Reliote");
  const eyebrow = pick(loc, "Rendez-vous", "Meeting");
  const title = pick(loc, "Un rendez-vous vous est proposé.", "A meeting has been proposed.");
  const rows: [string, string][] = [[pick(loc, "Date", "Date"), fmtDate(d.scheduledAt, loc)]];
  if (d.videoUrl)
    rows.push([
      pick(loc, "Lien visio", "Video link"),
      `<a href="${esc(d.videoUrl)}" style="color:#2e6f4e;">${esc(d.videoUrl)}</a>`,
    ]);
  rows.push([pick(loc, "Projet", "Project"), esc(d.projectLabel)]);

  const action =
    recipient === "client"
      ? pick(
          loc,
          "Connectez-vous à votre espace pour confirmer le rendez-vous et accepter la charte de non-contournement — l'identité de l'architecte vous sera alors révélée.",
          "Sign in to your dashboard to confirm the meeting and accept the non-circumvention charter — the architect's identity will then be revealed.",
        )
      : pick(
          loc,
          "Le porteur de projet doit confirmer ce créneau. Vous serez notifié·e dès la confirmation.",
          "The client still needs to confirm this slot. You'll be notified as soon as it's confirmed.",
        );

  const body =
    `<p style="margin:0 0 4px;">${pick(loc, "Reliote vous propose le créneau suivant :", "Reliote proposes the following slot:")}</p>` +
    detailBox(rows) +
    `<p style="margin:16px 0 0;">${action}</p>` +
    (recipient === "client" && d.ctaUrl ? cta(d.ctaUrl, pick(loc, "Confirmer le rendez-vous", "Confirm the meeting")) : "");
  return { subject, html: shell({ eyebrow, title, body }) };
}

// ── 3. Confirmation de RDV (→ porteur / architecte / admin) ──────────────────
export function meetingConfirmedEmail(
  loc0: string,
  recipient: "client" | "architect",
  d: { scheduledAt: string; videoUrl?: string | null },
) {
  const loc = L(loc0);
  const subject = pick(loc, "Rendez-vous confirmé — Reliote", "Meeting confirmed — Reliote");
  const eyebrow = pick(loc, "Confirmation", "Confirmation");
  const title = pick(loc, "Votre rendez-vous est confirmé.", "Your meeting is confirmed.");
  const rows: [string, string][] = [[pick(loc, "Date", "Date"), fmtDate(d.scheduledAt, loc)]];
  if (d.videoUrl)
    rows.push([
      pick(loc, "Lien visio", "Video link"),
      `<a href="${esc(d.videoUrl)}" style="color:#2e6f4e;">${esc(d.videoUrl)}</a>`,
    ]);
  const note =
    recipient === "client"
      ? pick(loc, "L'identité de votre architecte est désormais visible dans votre espace Reliote.", "Your architect's identity is now visible in your Reliote dashboard.")
      : pick(loc, "Le porteur a confirmé et accepté la charte. La mise en relation est active.", "The client has confirmed and accepted the charter. The introduction is now active.");
  const body =
    `<p style="margin:0 0 4px;">${pick(loc, "Le rendez-vous est confirmé pour :", "The meeting is confirmed for:")}</p>` +
    detailBox(rows);
  return { subject, html: shell({ eyebrow, title, body, note }) };
}
