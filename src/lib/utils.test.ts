import { describe, it, expect } from "vitest";
import { cn } from "./utils";
describe("cn", () => {
  it("merges classes", () => { expect(cn("px-2", "px-4")).toBe("px-4"); });
  it("filters falsy", () => { expect(cn("a", false, null, undefined, "b")).toBe("a b"); });
});
