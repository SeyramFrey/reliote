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
};

const FROM = process.env.RESEND_FROM || "Reliote <notifications@reliote.com>";

export function adminEmail(): string | null {
  return process.env.RELIOTE_ADMIN_EMAIL || null;
}

export function siteUrl(): string | null {
  const u = process.env.SITE_URL;
  return u ? u.replace(/\/+$/, "") : null;
}

export async function sendEmail({ to, cc, subject, html }: SendArgs): Promise<void> {
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
