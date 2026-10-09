import "server-only";
import { formatMeetingTime } from "@/lib/time/meetingTime";

// Templates e-mail transactionnels bilingues (fr/en), HTML inline (compatibilité
// clients mail). Ton éditorial Reliote : papier, encre, laiton, mono en eyebrow.
// Chaque fonction renvoie { subject, html } prêt pour sendEmail().
// Les e-mails destinés à l'admin restent en français.

export type Loc = "fr" | "en";
const L = (loc: string): Loc => (loc === "en" ? "en" : "fr");
const pick = (loc: Loc, fr: string, en: string) => (loc === "en" ? en : fr);

function esc(s: string): string {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

type Slot = { scheduledAt: string; projectTimeZone: string };

function when(d: Slot, loc: Loc): string {
  try {
    return esc(formatMeetingTime(d.scheduledAt, { locale: loc, projectTimeZone: d.projectTimeZone }));
  } catch {
    return esc(d.scheduledAt);
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

function videoRow(loc: Loc, url?: string | null): [string, string][] {
  return url
    ? [[pick(loc, "Lien visio", "Video link"), `<a href="${esc(url)}" style="color:#2e6f4e;">${esc(url)}</a>`]]
    : [];
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

const p = (html: string) => `<p style="margin:0 0 4px;">${html}</p>`;
const pAfter = (html: string) => `<p style="margin:16px 0 0;">${html}</p>`;

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
    p(pick(loc, "Votre projet est enregistré. Nos équipes identifient les architectes les plus pertinents pour votre chantier en Afrique.", "Your project is registered. Our team is identifying the most relevant architects for your build in Africa.")) +
    detailBox(rows) +
    pAfter(pick(loc, "Nous revenons vers vous sous 48 heures ouvrées.", "We'll get back to you within two business days.")) +
    (d.ctaUrl ? cta(d.ctaUrl, pick(loc, "Voir mes projets", "View my projects")) : "");
  return { subject, html: shell({ eyebrow, title, body }) };
}

// ── 2. Proposition (ou replanification) de RDV (→ porteur / architecte) ─────
export function meetingProposedEmail(
  loc0: string,
  recipient: "client" | "architect",
  d: Slot & {
    videoUrl?: string | null;
    projectLabel: string;
    ctaUrl?: string | null;
    rescheduled?: boolean;
  },
) {
  const loc = L(loc0);
  const subject = d.rescheduled
    ? pick(loc, "Nouveau créneau pour votre rendez-vous — Reliote", "A new time for your meeting — Reliote")
    : pick(loc, "Proposition de rendez-vous — Reliote", "A meeting has been proposed — Reliote");
  const eyebrow = pick(loc, "Rendez-vous", "Meeting");
  const title = d.rescheduled
    ? pick(loc, "Votre rendez-vous a été déplacé.", "Your meeting has been moved.")
    : pick(loc, "Un rendez-vous vous est proposé.", "A meeting has been proposed.");
  const rows: [string, string][] = [
    [pick(loc, "Date", "Date"), when(d, loc)],
    ...videoRow(loc, d.videoUrl),
    [pick(loc, "Projet", "Project"), esc(d.projectLabel)],
  ];

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
    p(pick(loc, "Reliote vous propose le créneau suivant :", "Reliote proposes the following slot:")) +
    detailBox(rows) +
    pAfter(action) +
    (recipient === "client" && d.ctaUrl ? cta(d.ctaUrl, pick(loc, "Confirmer le rendez-vous", "Confirm the meeting")) : "");
  return { subject, html: shell({ eyebrow, title, body }) };
}

// ── 3. Confirmation de RDV (→ porteur / architecte) ──────────────────────────
export function meetingConfirmedEmail(
  loc0: string,
  recipient: "client" | "architect",
  d: Slot & { videoUrl?: string | null; ctaUrl?: string | null },
) {
  const loc = L(loc0);
  const subject = pick(loc, "Rendez-vous confirmé — Reliote", "Meeting confirmed — Reliote");
  const eyebrow = pick(loc, "Confirmation", "Confirmation");
  const title = pick(loc, "Votre rendez-vous est confirmé.", "Your meeting is confirmed.");
  const rows: [string, string][] = [[pick(loc, "Date", "Date"), when(d, loc)], ...videoRow(loc, d.videoUrl)];
  const note =
    recipient === "client"
      ? pick(loc, "L'identité de votre architecte est désormais visible dans votre espace Reliote.", "Your architect's identity is now visible in your Reliote dashboard.")
      : pick(loc, "Le porteur a confirmé et accepté la charte. La mise en relation est active.", "The client has confirmed and accepted the charter. The introduction is now active.");
  const body =
    p(pick(loc, "Le rendez-vous est confirmé pour :", "The meeting is confirmed for:")) +
    detailBox(rows) +
    (d.ctaUrl ? cta(d.ctaUrl, pick(loc, "Ouvrir mon espace", "Open my dashboard")) : "");
  return { subject, html: shell({ eyebrow, title, body, note }) };
}

// ── 4. Annulation de RDV (→ porteur / architecte) ────────────────────────────
export function meetingCancelledEmail(
  loc0: string,
  recipient: "client" | "architect",
  d: Slot & { projectLabel: string },
) {
  const loc = L(loc0);
  const subject = pick(loc, "Rendez-vous annulé — Reliote", "Meeting cancelled — Reliote");
  const title = pick(loc, "Ce rendez-vous est annulé.", "This meeting has been cancelled.");
  const rows: [string, string][] = [
    [pick(loc, "Date prévue", "Planned for"), when(d, loc)],
    [pick(loc, "Projet", "Project"), esc(d.projectLabel)],
  ];
  const next =
    recipient === "client"
      ? pick(loc, "Reliote revient vers vous rapidement pour la suite de votre projet.", "Reliote will be in touch shortly about the next steps for your project.")
      : pick(loc, "Aucune action n'est attendue de votre part.", "No action is needed on your side.");
  const body = detailBox(rows) + pAfter(next);
  return { subject, html: shell({ eyebrow: pick(loc, "Rendez-vous", "Meeting"), title, body }) };
}

// ── 5. Le porteur a décliné un RDV (→ admin) ─────────────────────────────────
export function meetingDeclinedAdminEmail(d: Slot & { clientName: string; adminUrl: string }) {
  const body =
    p(`${esc(d.clientName)} a décliné le créneau proposé.`) +
    detailBox([["Créneau", when(d, "fr")]]) +
    cta(d.adminUrl, "Ouvrir la fiche projet");
  return {
    subject: "RDV décliné par le porteur — Reliote",
    html: shell({ eyebrow: "Admin · Rendez-vous", title: "Un rendez-vous a été décliné.", body }),
  };
}

// ── 6. Nouveau projet déposé (→ admin) ───────────────────────────────────────
export function newProjectAdminEmail(d: {
  clientName: string;
  projectType: string;
  projectCountry: string;
  projectLocation: string;
  matchCount: number;
  adminUrl: string;
}) {
  const body =
    detailBox([
      ["Porteur", esc(d.clientName)],
      ["Type", esc(d.projectType)],
      ["Pays du chantier", esc(d.projectCountry)],
      ["Localité", esc(d.projectLocation)],
      ["Correspondances", String(d.matchCount)],
    ]) + cta(d.adminUrl, "Ouvrir la fiche projet");
  return {
    subject: "Nouveau projet déposé — Reliote",
    html: shell({ eyebrow: "Admin · Projets", title: "Un nouveau projet attend une sélection.", body }),
  };
}

// ── 7. Plusieurs architectes proposés : à vous de choisir (→ porteur) ───────
export function proposalsReadyEmail(loc0: string, d: { count: number; ctaUrl: string }) {
  const loc = L(loc0);
  const body =
    p(
      pick(
        loc,
        `Reliote a sélectionné ${d.count} architectes pour votre projet. Leurs profils sont présentés de façon anonyme : choisissez celui avec qui vous souhaitez un premier rendez-vous.`,
        `Reliote has shortlisted ${d.count} architects for your project. Their profiles are shown anonymously: choose the one you'd like a first meeting with.`,
      ),
    ) + cta(d.ctaUrl, pick(loc, "Voir les architectes proposés", "See the shortlisted architects"));
  return {
    subject: pick(loc, "Vos architectes sont sélectionnés — Reliote", "Your architects are shortlisted — Reliote"),
    html: shell({
      eyebrow: pick(loc, "Sélection", "Shortlist"),
      title: pick(loc, "À vous de choisir.", "Your choice."),
      body,
    }),
  };
}

// ── 8. Le porteur a choisi un architecte (→ admin) ───────────────────────────
export function clientChoseAdminEmail(d: { clientName: string; architectHandle: string; adminUrl: string }) {
  const body =
    p(`${esc(d.clientName)} a choisi l'architecte ${esc(d.architectHandle)}. Il reste à planifier le rendez-vous.`) +
    cta(d.adminUrl, "Planifier le rendez-vous");
  return {
    subject: "Le porteur a choisi son architecte — Reliote",
    html: shell({ eyebrow: "Admin · Sélection", title: "Un architecte a été choisi.", body }),
  };
}

// ── 9. Candidature architecte reçue (→ architecte) ───────────────────────────
export function architectApplicationReceivedEmail(loc0: string, d: { firstName: string }) {
  const loc = L(loc0);
  const body = p(
    pick(
      loc,
      "Votre dossier est bien reçu. Notre équipe vérifie votre diplôme et votre inscription à l'ordre ; vous serez informé·e dès que votre profil sera validé.",
      "Your application has been received. Our team is checking your degree and professional registration; you'll be notified as soon as your profile is approved.",
    ),
  );
  return {
    subject: pick(loc, "Votre dossier est en cours de vérification — Reliote", "Your application is under review — Reliote"),
    html: shell({
      eyebrow: pick(loc, "Candidature", "Application"),
      title: pick(loc, `Merci, ${esc(d.firstName)}.`, `Thank you, ${esc(d.firstName)}.`),
      body,
    }),
  };
}

// ── 10. Changement de statut du dossier architecte (→ architecte) ────────────
export function architectStatusEmail(
  loc0: string,
  d: { firstName: string; status: "verified" | "rejected" | "paused"; ctaUrl?: string | null },
) {
  const loc = L(loc0);
  const copy = {
    verified: {
      subject: pick(loc, "Votre profil est validé — Reliote", "Your profile is approved — Reliote"),
      title: pick(loc, "Bienvenue dans la sélection.", "Welcome to the selection."),
      text: pick(loc, "Votre profil est validé. Vous pourrez désormais être proposé·e à des porteurs de projet.", "Your profile is approved. You can now be proposed to project owners."),
    },
    rejected: {
      subject: pick(loc, "Votre dossier n'a pas été retenu — Reliote", "About your application — Reliote"),
      title: pick(loc, "Votre dossier n'a pas été retenu.", "Your application was not accepted."),
      text: pick(loc, "Les éléments transmis ne nous ont pas permis de valider votre profil. Vous pouvez nous écrire pour en savoir plus.", "We could not approve your profile from the information provided. You can write to us to find out more."),
    },
    paused: {
      subject: pick(loc, "Votre profil est en pause — Reliote", "Your profile is paused — Reliote"),
      title: pick(loc, "Votre profil est en pause.", "Your profile is paused."),
      text: pick(loc, "Votre profil n'est temporairement plus proposé aux porteurs de projet.", "Your profile is temporarily no longer proposed to project owners."),
    },
  }[d.status];
  const body =
    p(`${pick(loc, "Bonjour", "Hello")} ${esc(d.firstName)},`) +
    pAfter(copy.text) +
    (d.ctaUrl ? cta(d.ctaUrl, pick(loc, "Ouvrir mon espace", "Open my dashboard")) : "");
  return {
    subject: copy.subject,
    html: shell({ eyebrow: pick(loc, "Votre dossier", "Your application"), title: copy.title, body }),
  };
}

// ── 11. Le porteur a écarté toutes les propositions (→ admin) ────────────────
export function proposalsDeclinedAdminEmail(d: { clientName: string; adminUrl: string }) {
  const body =
    p(`${esc(d.clientName)} a écarté les architectes proposés. Une nouvelle sélection est nécessaire.`) +
    cta(d.adminUrl, "Ouvrir la fiche projet");
  return {
    subject: "Propositions écartées par le porteur — Reliote",
    html: shell({ eyebrow: "Admin · Sélection", title: "Aucune proposition retenue.", body }),
  };
}
