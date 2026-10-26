import "server-only";

// Client e-mail minimal au-dessus de l'API REST Resend (aucune dépendance npm).
//
// Règles :
//  - Sans RESEND_API_KEY → no-op silencieux (dev / avant provisioning). L'app ne casse pas.
//  - Un échec d'envoi ne remonte JAMAIS : les e-mails sont best-effort et ne doivent
//    pas faire échouer la server action métier (création de projet, RDV, etc.).

type SendArgs = {
  to: string | string[];
  cc?: string | string[] | null;
  subject: string;
  html: string;
  /** En-têtes additionnels (ex. List-Unsubscribe pour la newsletter). */
  headers?: Record<string, string>;
};

const FROM = process.env.RESEND_FROM || "Reliote <notifications@reliote.com>";

export function adminEmail(): string | null {
  return process.env.RELIOTE_ADMIN_EMAIL || null;
}

export function siteUrl(): string | null {
  const u = process.env.SITE_URL;
  return u ? u.replace(/\/+$/, "") : null;
}

export async function sendEmail({ to, cc, subject, html, headers }: SendArgs): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  if (!key) {
    console.info(`[email] RESEND_API_KEY absent — « ${subject} » non envoyé (no-op).`);
    return;
  }

  const ccList = (cc == null ? [] : Array.isArray(cc) ? cc : [cc]).filter(Boolean);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: recipients,
        ...(ccList.length ? { cc: ccList } : {}),
        subject,
        html,
        ...(headers ? { headers } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[email] Resend a répondu ${res.status} pour « ${subject} » : ${text}`);
    }
  } catch (e) {
    console.error(`[email] Envoi Resend en erreur pour « ${subject} » :`, e);
  }
}

export type BatchEmail = { to: string; subject: string; html: string; headers?: Record<string, string> };

/** Taille maximale d'un lot accepté par l'API batch de Resend. */
export const BATCH_SIZE = 100;

/**
 * Envoi groupé (newsletter) : un e-mail par destinataire, chacun avec son lien
 * de désinscription. Renvoie le nombre d'e-mails acceptés par Resend. Comme
 * sendEmail, ne lève jamais : un lot refusé est journalisé et compté à zéro.
 */
export async function sendBatch(emails: BatchEmail[]): Promise<number> {
  const key = process.env.RESEND_API_KEY;
  if (emails.length === 0) return 0;
  if (!key) {
    console.info(`[email] RESEND_API_KEY absent — lot de ${emails.length} e-mail(s) non envoyé (no-op).`);
    return 0;
  }

  let sent = 0;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          chunk.map((e) => ({
            from: FROM,
            to: [e.to],
            subject: e.subject,
            html: e.html,
            ...(e.headers ? { headers: e.headers } : {}),
          })),
        ),
      });
      if (res.ok) sent += chunk.length;
      else {
        const text = await res.text().catch(() => "");
        console.error(`[email] Resend batch a répondu ${res.status} : ${text}`);
      }
    } catch (e) {
      console.error("[email] Envoi Resend batch en erreur :", e);
    }
  }
  return sent;
}
