import { describe, it, expect } from "vitest";
import {
  projectReceivedEmail,
  meetingProposedEmail,
  meetingConfirmedEmail,
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
  const d = { scheduledAt: "2026-08-15T14:30:00.000Z", videoUrl: "https://meet.test/x", projectLabel: "residential · Dakar" };

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
    const fr = meetingConfirmedEmail("fr", "client", { scheduledAt: "2026-08-15T14:30:00.000Z", videoUrl: null });
    expect(fr.subject).toMatch(/confirmé/i);
    expect(fr.html).toMatch(/identité/i);
    const en = meetingConfirmedEmail("en", "architect", { scheduledAt: "2026-08-15T14:30:00.000Z", videoUrl: null });
    expect(en.subject).toMatch(/confirmed/i);
    expect(en.html).toMatch(/introduction is now active/i);
  });
});
