import { describe, it, expect } from "vitest";
import {
  projectReceivedEmail,
  meetingProposedEmail,
  meetingConfirmedEmail,
  meetingCancelledEmail,
  meetingDeclinedAdminEmail,
  newProjectAdminEmail,
  proposalsReadyEmail,
  clientChoseAdminEmail,
  architectApplicationReceivedEmail,
  architectStatusEmail,
  proposalsDeclinedAdminEmail,
  newArchitectAdminEmail,
  newMessageEmail,
  newMessageAdminEmail,
} from "./templates";

describe("projectReceivedEmail", () => {
  const base = {
    clientName: "Awa",
    projectType: "residential",
    projectCountry: "Sénégal",
    projectLocation: "Dakar",
    matchCount: 3,
  };

  it("is French by default and includes the details", () => {
    const { subject, html } = projectReceivedEmail("fr", base);
    expect(subject).toMatch(/reçu/i);
    expect(html).toContain("Awa");
    expect(html).toContain("Sénégal");
    expect(html).toContain("3");
    expect(html.startsWith("<!doctype html>")).toBe(true);
  });

  it("switches to English", () => {
    const { subject, html } = projectReceivedEmail("en", base);
    expect(subject).toMatch(/received/i);
    expect(html).toMatch(/Thank you/);
  });

  it("escapes HTML in user-supplied fields", () => {
    const { html } = projectReceivedEmail("fr", { ...base, clientName: "<script>x</script>" });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders a CTA only when a url is provided", () => {
    expect(projectReceivedEmail("fr", base).html).not.toContain("<a href=");
    expect(
      projectReceivedEmail("fr", { ...base, ctaUrl: "https://reliote.test/fr/dashboard/client" }).html,
    ).toContain('href="https://reliote.test/fr/dashboard/client"');
  });
});

describe("meetingProposedEmail", () => {
  const d = {
    scheduledAt: "2026-08-15T14:30:00.000Z",
    projectTimeZone: "Africa/Dakar",
    videoUrl: "https://meet.test/x",
    projectLabel: "residential · Dakar",
  };

  it("differs by recipient (client gets a confirm CTA, architect a wait note)", () => {
    const client = meetingProposedEmail("fr", "client", { ...d, ctaUrl: "https://reliote.test/fr/dashboard/client" });
    const architect = meetingProposedEmail("fr", "architect", d);
    expect(client.html).toMatch(/charte/i);
    expect(client.html).toContain("Confirmer le rendez-vous");
    expect(architect.html).toMatch(/confirmer ce créneau/i);
    expect(architect.html).not.toContain("Confirmer le rendez-vous");
  });

  it("includes the video link when present", () => {
    expect(meetingProposedEmail("en", "client", d).html).toContain('href="https://meet.test/x"');
  });
});

describe("meetingConfirmedEmail", () => {
  it("subject and reveal note per locale + recipient", () => {
    const fr = meetingConfirmedEmail("fr", "client", { scheduledAt: "2026-08-15T14:30:00.000Z", projectTimeZone: "Africa/Dakar", videoUrl: null });
    expect(fr.subject).toMatch(/confirmé/i);
    expect(fr.html).toMatch(/identité/i);
    const en = meetingConfirmedEmail("en", "architect", { scheduledAt: "2026-08-15T14:30:00.000Z", projectTimeZone: "Africa/Dakar", videoUrl: null });
    expect(en.subject).toMatch(/confirmed/i);
    expect(en.html).toMatch(/introduction is now active/i);
  });
});

// Le 26/10/2026, Dakar est à UTC+0 et Paris à UTC+1.
const slot = { scheduledAt: "2026-10-26T09:00:00.000Z", projectTimeZone: "Africa/Dakar" };

describe("meeting times are shown in the build country and in Paris", () => {
  it("proposed", () => {
    const { html } = meetingProposedEmail("fr", "client", { ...slot, projectLabel: "x" });
    expect(html).toContain("09:00");
    expect(html).toContain("10:00");
    expect(html).toMatch(/Dakar/);
    expect(html).toMatch(/Paris/);
  });
  it("confirmed", () => {
    const { html } = meetingConfirmedEmail("en", "architect", slot);
    expect(html).toContain("09:00");
    expect(html).toContain("10:00");
  });
  it("rescheduled variant says so", () => {
    expect(meetingProposedEmail("fr", "client", { ...slot, projectLabel: "x", rescheduled: true }).subject).toMatch(/nouveau créneau/i);
    expect(meetingProposedEmail("en", "client", { ...slot, projectLabel: "x", rescheduled: true }).subject).toMatch(/new time/i);
  });
});

describe("meetingCancelledEmail", () => {
  it("per locale and recipient", () => {
    expect(meetingCancelledEmail("fr", "client", { ...slot, projectLabel: "Villa" }).subject).toMatch(/annulé/i);
    expect(meetingCancelledEmail("en", "architect", { ...slot, projectLabel: "Villa" }).subject).toMatch(/cancelled/i);
  });
  it("escapes the project label", () => {
    expect(meetingCancelledEmail("fr", "client", { ...slot, projectLabel: "<b>x</b>" }).html).not.toContain("<b>x</b>");
  });
});

describe("admin notifications (French)", () => {
  const adminUrl = "https://reliote.test/fr/admin/projets/p1";
  it("meeting declined", () => {
    const m = meetingDeclinedAdminEmail({ clientName: "<b>Awa</b>", ...slot, adminUrl });
    expect(m.subject).toMatch(/décliné/i);
    expect(m.html).not.toContain("<b>Awa</b>");
    expect(m.html).toContain(`href="${adminUrl}"`);
  });
  it("new project", () => {
    const m = newProjectAdminEmail({
      clientName: "Awa",
      projectType: "residential",
      projectCountry: "Sénégal",
      projectLocation: "Dakar",
      matchCount: 4,
      adminUrl,
    });
    expect(m.subject).toMatch(/nouveau projet/i);
    expect(m.html).toContain("Sénégal");
  });
  it("client chose an architect", () => {
    const m = clientChoseAdminEmail({ clientName: "Awa", architectHandle: "A007", adminUrl });
    expect(m.subject).toMatch(/choisi/i);
    expect(m.html).toContain("A007");
  });
});

describe("proposalsReadyEmail", () => {
  it("asks the client to choose, with a CTA", () => {
    const fr = proposalsReadyEmail("fr", { count: 3, ctaUrl: "https://reliote.test/fr/dashboard/client" });
    expect(fr.subject).toMatch(/architectes/i);
    expect(fr.html).toContain("3");
    expect(fr.html).toContain('href="https://reliote.test/fr/dashboard/client"');
    expect(proposalsReadyEmail("en", { count: 2, ctaUrl: "https://x.test" }).subject).toMatch(/architects/i);
  });
});

describe("architect emails", () => {
  it("application received", () => {
    expect(architectApplicationReceivedEmail("fr", { firstName: "Kofi" }).html).toContain("Kofi");
    expect(architectApplicationReceivedEmail("en", { firstName: "Kofi" }).subject).toMatch(/application/i);
  });
  it("status: verified, rejected, paused", () => {
    expect(architectStatusEmail("fr", { firstName: "Kofi", status: "verified" }).subject).toMatch(/validé/i);
    expect(architectStatusEmail("en", { firstName: "Kofi", status: "rejected" }).subject).toMatch(/application/i);
    expect(architectStatusEmail("fr", { firstName: "Kofi", status: "paused" }).subject).toMatch(/pause/i);
  });
  it("escapes the first name", () => {
    expect(architectStatusEmail("fr", { firstName: "<i>K</i>", status: "verified" }).html).not.toContain("<i>K</i>");
  });
});

describe("proposalsDeclinedAdminEmail", () => {
  it("tells the admin the client set aside every proposal", () => {
    const m = proposalsDeclinedAdminEmail({ clientName: "<b>Awa</b>", adminUrl: "https://reliote.test/fr/admin/projets/p1" });
    expect(m.subject).toMatch(/écart/i);
    expect(m.html).not.toContain("<b>Awa</b>");
    expect(m.html).toContain('href="https://reliote.test/fr/admin/projets/p1"');
  });
});

describe("newArchitectAdminEmail", () => {
  it("announces a new application to verify", () => {
    const m = newArchitectAdminEmail({ name: "<i>Kofi</i>", country: "Ghana", adminUrl: "https://reliote.test/fr/admin/architectes/a1" });
    expect(m.subject).toMatch(/dossier architecte/i);
    expect(m.html).not.toContain("<i>Kofi</i>");
    expect(m.html).toContain("Ghana");
    expect(m.html).toContain('href="https://reliote.test/fr/admin/architectes/a1"');
  });
});

describe("project type labels in emails", () => {
  const base = { clientName: "Awa", projectType: "hospitality", projectCountry: "Sénégal", projectLocation: "Dakar", matchCount: 1 };
  it("shows a readable, translated project type", () => {
    expect(projectReceivedEmail("fr", base).html).toContain("Hôtellerie");
    expect(projectReceivedEmail("en", base).html).toContain("Hospitality");
    expect(projectReceivedEmail("fr", base).html).not.toContain(">hospitality<");
  });
});

describe("newMessageEmail", () => {
  it("is French by default, English on request, and links to the thread", () => {
    const fr = newMessageEmail("fr", { ctaUrl: "https://reliote.test/fr/dashboard/client/messages/p1" });
    expect(fr.subject).toMatch(/nouveau message/i);
    expect(fr.html).toContain('href="https://reliote.test/fr/dashboard/client/messages/p1"');
    const en = newMessageEmail("en", { ctaUrl: "https://reliote.test/en/dashboard/client/messages/p1" });
    expect(en.subject).toMatch(/new message/i);
  });
});

describe("newMessageAdminEmail", () => {
  it("names the thread (escaped) and links to it", () => {
    const m = newMessageAdminEmail({ threadLabel: "<b>Villa</b> — Awa", adminUrl: "https://reliote.test/fr/admin/messages/t1" });
    expect(m.subject).toMatch(/nouveau message/i);
    expect(m.html).not.toContain("<b>Villa</b>");
    expect(m.html).toContain("&lt;b&gt;Villa&lt;/b&gt;");
    expect(m.html).toContain('href="https://reliote.test/fr/admin/messages/t1"');
  });
});
