import { describe, it, expect } from "vitest";
import {
  retainedArchitectId,
  canOpenArchitectThread,
  threadWritable,
  canEditMessage,
  editableUntil,
  isSeen,
  unreadCount,
  shouldNotify,
  forwardTarget,
  needsAnonymityCheck,
  type EngagementLite,
} from "./rules";

const e = (architectId: string, status: EngagementLite["status"]): EngagementLite => ({ architectId, status });

describe("retainedArchitectId", () => {
  it("is nobody without an engagement", () => {
    expect(retainedArchitectId([])).toBeNull();
  });
  it("is the single proposed or engaged architect", () => {
    expect(retainedArchitectId([e("a1", "proposed")])).toBe("a1");
    expect(retainedArchitectId([e("a1", "engaged")])).toBe("a1");
  });
  it("is nobody while the client still has to choose between several", () => {
    expect(retainedArchitectId([e("a1", "proposed"), e("a2", "proposed")])).toBeNull();
  });
  it("is the remaining one once the others were declined", () => {
    expect(retainedArchitectId([e("a1", "proposed"), e("a2", "declined"), e("a3", "cancelled")])).toBe("a1");
  });
  it("is nobody when every engagement ended", () => {
    expect(retainedArchitectId([e("a1", "declined"), e("a2", "expired")])).toBeNull();
  });
});

describe("canOpenArchitectThread", () => {
  it("only for the retained architect", () => {
    expect(canOpenArchitectThread([e("a1", "proposed")], "a1")).toBe(true);
    expect(canOpenArchitectThread([e("a1", "proposed")], "a2")).toBe(false);
    expect(canOpenArchitectThread([e("a1", "proposed"), e("a2", "proposed")], "a1")).toBe(false);
  });
});

describe("threadWritable", () => {
  it("client and admission threads are always writable", () => {
    expect(threadWritable({ kind: "project_client", architectId: null }, [])).toBe(true);
    expect(threadWritable({ kind: "architect_admission", architectId: "a1" }, [])).toBe(true);
  });
  it("a project thread stays writable only while its architect is retained", () => {
    const t = { kind: "project_architect" as const, architectId: "a1" };
    expect(threadWritable(t, [e("a1", "engaged")])).toBe(true);
    expect(threadWritable(t, [e("a1", "declined")])).toBe(false);
    expect(threadWritable(t, [e("a1", "proposed"), e("a2", "proposed")])).toBe(false);
  });
});

describe("canEditMessage / editableUntil", () => {
  const created = "2026-10-13T10:00:00.000Z";
  const at = (ms: number) => new Date(Date.parse(created) + ms);
  const m = { authorId: "u1", createdAt: created, deletedAt: null };

  it("lets the author edit for strictly less than 5 minutes", () => {
    expect(canEditMessage(m, "u1", at(4 * 60_000 + 59_000))).toBe(true);
    expect(canEditMessage(m, "u1", at(5 * 60_000))).toBe(false);
  });
  it("refuses anyone else, a deleted message, or an unknown author", () => {
    expect(canEditMessage(m, "u2", at(1000))).toBe(false);
    expect(canEditMessage({ ...m, deletedAt: created }, "u1", at(1000))).toBe(false);
    expect(canEditMessage({ ...m, authorId: null }, "u1", at(1000))).toBe(false);
  });
  it("exposes the end of the window, or null once deleted", () => {
    expect(editableUntil(m)).toBe("2026-10-13T10:05:00.000Z");
    expect(editableUntil({ ...m, deletedAt: created })).toBeNull();
  });
});

describe("isSeen", () => {
  it("is seen once the other side read at or after the message", () => {
    expect(isSeen("2026-10-13T10:00:00Z", null)).toBe(false);
    expect(isSeen("2026-10-13T10:00:00Z", "2026-10-13T10:00:00Z")).toBe(true);
    expect(isSeen("2026-10-13T10:00:00Z", "2026-10-13T09:59:59Z")).toBe(false);
  });
});

describe("unreadCount", () => {
  const msgs = [
    { side: "admin" as const, createdAt: "2026-10-13T10:00:00Z", deleted: false },
    { side: "admin" as const, createdAt: "2026-10-13T11:00:00Z", deleted: false },
    { side: "admin" as const, createdAt: "2026-10-13T12:00:00Z", deleted: true },
    { side: "owner" as const, createdAt: "2026-10-13T13:00:00Z", deleted: false },
  ];
  it("counts the other side's live messages after my last read", () => {
    expect(unreadCount(msgs, "owner", null)).toBe(2);
    expect(unreadCount(msgs, "owner", "2026-10-13T10:30:00Z")).toBe(1);
    expect(unreadCount(msgs, "admin", null)).toBe(1);
  });
});

describe("shouldNotify", () => {
  const now = new Date("2026-10-13T12:00:00Z");
  it("notifies the first time", () => {
    expect(shouldNotify({ lastNotifiedAt: null, recipientLastReadAt: null, now })).toBe(true);
  });
  it("stays quiet within the hour if nothing was read since", () => {
    expect(shouldNotify({ lastNotifiedAt: "2026-10-13T11:30:00Z", recipientLastReadAt: "2026-10-13T11:00:00Z", now })).toBe(false);
    expect(shouldNotify({ lastNotifiedAt: "2026-10-13T11:30:00Z", recipientLastReadAt: null, now })).toBe(false);
  });
  it("notifies again after an hour", () => {
    expect(shouldNotify({ lastNotifiedAt: "2026-10-13T10:59:00Z", recipientLastReadAt: null, now })).toBe(true);
  });
  it("notifies again when the recipient caught up since the last e-mail", () => {
    expect(shouldNotify({ lastNotifiedAt: "2026-10-13T11:50:00Z", recipientLastReadAt: "2026-10-13T11:55:00Z", now })).toBe(true);
  });
});

describe("forwardTarget / needsAnonymityCheck", () => {
  it("forwards between the client and architect threads of a project only", () => {
    expect(forwardTarget("project_architect")).toBe("project_client");
    expect(forwardTarget("project_client")).toBe("project_architect");
    expect(forwardTarget("architect_admission")).toBeNull();
  });
  it("asks for a check until the meeting is confirmed (engagement engaged)", () => {
    expect(needsAnonymityCheck("engaged")).toBe(false);
    expect(needsAnonymityCheck("proposed")).toBe(true);
    expect(needsAnonymityCheck(null)).toBe(true);
  });
});
