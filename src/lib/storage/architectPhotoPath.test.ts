import { describe, it, expect } from "vitest";
import { architectPhotoOwner, architectPhotoPath, isArchitectPhotoPath } from "./architectPhotoPath";

const uid = "3f2b8c1e-1a2b-4c3d-8e9f-0123456789ab";
const file = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

describe("architect photo paths", () => {
  it("accepts {user}/{uuid}.{ext} only", () => {
    expect(isArchitectPhotoPath(`${uid}/${file}.jpg`)).toBe(true);
    expect(isArchitectPhotoPath(`${uid}/${file}.svg`)).toBe(false);
    expect(isArchitectPhotoPath(`${uid}/../x/${file}.jpg`)).toBe(false);
    expect(isArchitectPhotoPath(`javascript:alert(1)`)).toBe(false);
    expect(isArchitectPhotoPath(`https://evil.test/${uid}/${file}.jpg`)).toBe(false);
  });
  it("reads the owner folder", () => {
    expect(architectPhotoOwner(`${uid}/${file}.png`)).toBe(uid);
    expect(architectPhotoOwner("nope")).toBeNull();
  });
  it("maps legacy public URLs to their object path", () => {
    expect(
      architectPhotoPath(`https://x.supabase.co/storage/v1/object/public/architect-photos/${uid}/${file}.webp`),
    ).toBe(`${uid}/${file}.webp`);
    expect(architectPhotoPath("https://images.unsplash.com/photo-1?w=500")).toBeNull();
    expect(architectPhotoPath(null)).toBeNull();
  });
});
