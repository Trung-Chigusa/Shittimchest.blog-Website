import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("password hashing", () => {
  it("hashes and verifies passwords without storing plain text", async () => {
    const hash = await hashPassword("StrongPass1!");
    expect(hash).not.toContain("StrongPass1!");
    await expect(verifyPassword("StrongPass1!", hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass1!", hash)).resolves.toBe(false);
  });
});
