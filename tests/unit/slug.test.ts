import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/lib/slug";

describe("slug helpers", () => {
  it("normalizes Vietnamese and unsafe characters", () => {
    expect(slugify("Bắt đầu với CTF Web: đọc request!")).toBe("bat-dau-voi-ctf-web-doc-request");
  });

  it("appends numeric suffixes", () => {
    expect(uniqueSlug("Hello World", 3)).toBe("hello-world-3");
  });
});
