import { describe, it, expect } from "vitest";
import { toFeaturedContent, type FeaturedRow } from "./featured";

const row: FeaturedRow = {
  title_fr: "Villa des rives",
  title_en: "Riverside villa",
  location: "Bingerville",
  coordinates: "5.34°N / 3.98°W",
  slides: [{ image: "/a.jpg", caption_fr: "Cour", caption_en: "Courtyard" }],
  stats: [{ n: 480, suf: " m²", l_fr: "Surface", l_en: "Floor area" }],
  hotspots: [{ x: 10, y: 20, title_fr: "Béton", title_en: "Concrete", body_fr: "b", body_en: "b-en" }],
  quote_fr: "« Bien. »",
  quote_en: "“Good.”",
  cite: "Client — 2025",
  rows: [{ label_fr: "Site", label_en: "Site", value_fr: "Côte d'Ivoire", value_en: "Ivory Coast" }],
};

describe("toFeaturedContent", () => {
  it("returns null when no case study is published", () => {
    expect(toFeaturedContent(null, "fr")).toBeNull();
  });

  it("localises a published row", () => {
    expect(toFeaturedContent(row, "en")).toEqual({
      title: "Riverside villa",
      location: "Bingerville",
      coordinates: "5.34°N / 3.98°W",
      slides: [{ image: "/a.jpg", caption: "Courtyard" }],
      stats: [{ n: 480, suf: " m²", l: "Floor area" }],
      hotspots: [{ x: 10, y: 20, t: "Concrete", b: "b-en" }],
      quote: "“Good.”",
      cite: "Client — 2025",
      rows: [{ k: "Site", v: "Ivory Coast" }],
    });
  });

  it("drops slides without an image, so the slideshow never shows a blank frame", () => {
    const c = toFeaturedContent({ ...row, slides: [{ caption_fr: "x" }, { image: "/b.jpg" }] }, "fr");
    expect(c?.slides).toEqual([{ image: "/b.jpg", caption: "" }]);
  });

  it("returns null when the row has no usable slide (nothing to show)", () => {
    expect(toFeaturedContent({ ...row, slides: [] }, "fr")).toBeNull();
  });

  it("tolerates malformed JSON columns", () => {
    const c = toFeaturedContent({ ...row, stats: "oops", hotspots: null, rows: {} }, "fr");
    expect(c?.stats).toEqual([]);
    expect(c?.hotspots).toEqual([]);
    expect(c?.rows).toEqual([]);
  });
});
