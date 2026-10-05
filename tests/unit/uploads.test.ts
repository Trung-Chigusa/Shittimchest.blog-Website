import { describe, expect, it } from "vitest";
import { extensionForMime, matchesSignature, parseStoredName } from "@/lib/uploads";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const php = new TextEncoder().encode("<?php echo 1; ?>");

describe("upload validation", () => {
  it("maps allowed mime types to extensions", () => {
    expect(extensionForMime("image/png")).toBe("png");
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/svg+xml")).toBeNull();
    expect(extensionForMime("text/html")).toBeNull();
  });

  it("accepts real image signatures", () => {
    expect(matchesSignature(png, "png")).toBe(true);
    expect(matchesSignature(jpg, "jpg")).toBe(true);
    expect(matchesSignature(webp, "webp")).toBe(true);
  });

  it("rejects content that does not match the claimed type", () => {
    expect(matchesSignature(php, "png")).toBe(false);
    expect(matchesSignature(png, "jpg")).toBe(false);
    expect(matchesSignature(jpg, "webp")).toBe(false);
  });

  it("only serves server-generated file names", () => {
    expect(parseStoredName("bd7675bc-f82d-4120-af98-f786419ab900.png")).toBe("png");
    expect(parseStoredName("../../etc/passwd")).toBeNull();
    expect(parseStoredName("bd7675bc-f82d-4120-af98-f786419ab900.php")).toBeNull();
    expect(parseStoredName("avatar.png")).toBeNull();
    expect(parseStoredName(".gitkeep")).toBeNull();
  });
});
