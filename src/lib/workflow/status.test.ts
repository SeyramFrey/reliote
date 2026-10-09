import { describe, it, expect } from "vitest";
import { projectStatusAfter, type ProjectStatus } from "./status";

const ctx = (current: ProjectStatus, activeMeetings = 0, activeProposals = 0) => ({
  current,
  activeMeetings,
  activeProposals,
});

describe("projectStatusAfter", () => {
  it("closed is terminal", () => {
    for (const e of ["matched", "proposed", "meeting_scheduled", "meeting_confirmed", "meeting_cancelled", "meeting_completed", "rematched"] as const) {
      expect(projectStatusAfter(e, ctx("closed"))).toBe("closed");
    }
  });

  it("matching moves a new project to matched only", () => {
    expect(projectStatusAfter("matched", ctx("new"))).toBe("matched");
    expect(projectStatusAfter("rematched", ctx("matched"))).toBe("matched");
    expect(projectStatusAfter("rematched", ctx("meeting_confirmed"))).toBe("meeting_confirmed");
    expect(projectStatusAfter("rematched", ctx("selected"))).toBe("selected");
  });

  it("a proposal selects the project without going backwards", () => {
    expect(projectStatusAfter("proposed", ctx("matched"))).toBe("selected");
    expect(projectStatusAfter("proposed", ctx("new"))).toBe("selected");
    expect(projectStatusAfter("proposed", ctx("meeting_proposed"))).toBe("meeting_proposed");
  });

  it("scheduling and confirming a meeting", () => {
    expect(projectStatusAfter("meeting_scheduled", ctx("selected"))).toBe("meeting_proposed");
    expect(projectStatusAfter("meeting_scheduled", ctx("meeting_confirmed"))).toBe("meeting_confirmed");
    expect(projectStatusAfter("meeting_confirmed", ctx("meeting_proposed"))).toBe("meeting_confirmed");
    expect(projectStatusAfter("meeting_confirmed", ctx("in_review"))).toBe("in_review");
  });

  it("a cancelled or declined meeting falls back to an actionable state", () => {
    expect(projectStatusAfter("meeting_cancelled", ctx("meeting_confirmed", 0, 1))).toBe("selected");
    expect(projectStatusAfter("meeting_declined", ctx("meeting_proposed", 0, 2))).toBe("selected");
    expect(projectStatusAfter("meeting_cancelled", ctx("meeting_proposed", 0, 0))).toBe("matched");
  });

  it("keeps the status while another meeting is still active", () => {
    expect(projectStatusAfter("meeting_cancelled", ctx("meeting_proposed", 1, 1))).toBe("meeting_proposed");
  });

  it("a cancellation after the review starts does not reopen the project", () => {
    expect(projectStatusAfter("meeting_cancelled", ctx("in_review", 0, 1))).toBe("in_review");
  });

  it("completion and closing", () => {
    expect(projectStatusAfter("meeting_completed", ctx("meeting_confirmed"))).toBe("in_review");
    expect(projectStatusAfter("closed", ctx("in_review"))).toBe("closed");
    expect(projectStatusAfter("closed", ctx("matched"))).toBe("closed");
  });

  it("withdrawing the last proposal sends the project back to matched", () => {
    expect(projectStatusAfter("proposal_withdrawn", ctx("selected", 0, 0))).toBe("matched");
    expect(projectStatusAfter("proposal_withdrawn", ctx("selected", 0, 1))).toBe("selected");
    expect(projectStatusAfter("proposal_withdrawn", ctx("meeting_confirmed", 1, 1))).toBe("meeting_confirmed");
  });
});
