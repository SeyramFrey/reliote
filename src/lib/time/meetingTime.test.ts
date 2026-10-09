import { describe, it, expect } from "vitest";
import {
  zonedWallTimeToUtc,
  formatMeetingTime,
  countryTimeZone,
  TIMEZONE_CHOICES,
} from "./meetingTime";

describe("zonedWallTimeToUtc", () => {
  it("converts Paris summer time (UTC+2)", () => {
    expect(zonedWallTimeToUtc("2026-10-20T10:00", "Europe/Paris").toISOString()).toBe(
      "2026-10-20T08:00:00.000Z",
    );
  });
  it("converts Paris winter time across the DST change (UTC+1)", () => {
    expect(zonedWallTimeToUtc("2026-10-26T10:00", "Europe/Paris").toISOString()).toBe(
      "2026-10-26T09:00:00.000Z",
    );
  });
  it("converts a UTC+0 African zone", () => {
    expect(zonedWallTimeToUtc("2026-10-26T10:00", "Africa/Abidjan").toISOString()).toBe(
      "2026-10-26T10:00:00.000Z",
    );
  });
  it("converts a UTC+3 African zone", () => {
    expect(zonedWallTimeToUtc("2026-10-26T10:00", "Africa/Nairobi").toISOString()).toBe(
      "2026-10-26T07:00:00.000Z",
    );
  });
  it("rejects malformed input", () => {
    expect(() => zonedWallTimeToUtc("26/10/2026 10h", "Europe/Paris")).toThrow();
  });
});

describe("formatMeetingTime", () => {
  it("shows project-country time and Paris time when they differ", () => {
    const s = formatMeetingTime("2026-10-26T09:00:00.000Z", {
      locale: "fr",
      projectTimeZone: "Africa/Dakar",
    });
    expect(s).toContain("09:00");
    expect(s).toContain("10:00");
    expect(s).toMatch(/Dakar/);
    expect(s).toMatch(/Paris/);
  });
  it("shows a single time when both zones agree", () => {
    // Johannesburg is UTC+2 all year, like Paris in summer.
    const same = formatMeetingTime("2026-07-01T08:00:00.000Z", {
      locale: "en",
      projectTimeZone: "Africa/Johannesburg",
    });
    expect(same.match(/10:00/g)?.length).toBe(1);
    expect(same).toMatch(/Paris/);
    expect(same).toMatch(/Johannesburg/);
  });
});

describe("country time zones", () => {
  it("maps known countries and falls back", () => {
    expect(countryTimeZone("Sénégal")).toBe("Africa/Dakar");
    expect(countryTimeZone("Kenya")).toBe("Africa/Nairobi");
    expect(countryTimeZone("Atlantide")).toBe("Africa/Abidjan");
  });
  it("lists Paris first", () => {
    expect(TIMEZONE_CHOICES[0].value).toBe("Europe/Paris");
  });
});
