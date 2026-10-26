import { describe, it, expect } from "vitest";
import { safeUrl } from "./safeUrl";

describe("safeUrl", () => {
  it("keeps http(s) and site paths", () => {
    expect(safeUrl("https://archigenie.africa")).toBe("https://archigenie.africa");
    expect(safeUrl(" http://x.test/a?b=1 ")).toBe("http://x.test/a?b=1");
    expect(safeUrl("/assets/logo.png")).toBe("/assets/logo.png");
  });
  it("drops script, data and protocol-relative URLs", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("JaVaScRiPt:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,<script>")).toBeNull();
    expect(safeUrl("//evil.test/x")).toBeNull();
    expect(safeUrl("")).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});
