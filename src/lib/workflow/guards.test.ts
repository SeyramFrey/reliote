import { describe, it, expect } from "vitest";
import { shortlistVisible, canPropose, canSchedule } from "./guards";

describe("shortlistVisible", () => {
  it("needs the admin's request, two proposals and no open meeting", () => {
    expect(shortlistVisible({ choiceRequested: true, proposedCount: 2, hasOpenMeeting: false })).toBe(true);
    expect(shortlistVisible({ choiceRequested: false, proposedCount: 3, hasOpenMeeting: false })).toBe(false);
    expect(shortlistVisible({ choiceRequested: true, proposedCount: 1, hasOpenMeeting: false })).toBe(false);
    expect(shortlistVisible({ choiceRequested: true, proposedCount: 2, hasOpenMeeting: true })).toBe(false);
  });
});

describe("server-side guards", () => {
  it("no proposal on a closed project or for an unverified architect", () => {
    expect(canPropose({ projectStatus: "matched", architectStatus: "verified" })).toBe(true);
    expect(canPropose({ projectStatus: "closed", architectStatus: "verified" })).toBe(false);
    expect(canPropose({ projectStatus: "matched", architectStatus: "paused" })).toBe(false);
  });
  it("no meeting on a closed project or with an architect no longer verified", () => {
    expect(canSchedule({ projectStatus: "selected", architectStatus: "verified" })).toBe(true);
    expect(canSchedule({ projectStatus: "closed", architectStatus: "verified" })).toBe(false);
    expect(canSchedule({ projectStatus: "selected", architectStatus: "paused" })).toBe(false);
  });
});
