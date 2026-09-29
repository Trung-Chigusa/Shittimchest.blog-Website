import { describe, expect, it } from "vitest";
import { generateOtpCode, hashOtp, verifyOtpHash } from "@/lib/otp";

describe("OTP helpers", () => {
  it("generates six digit OTP codes", () => {
    expect(generateOtpCode()).toMatch(/^\d{6}$/);
  });

  it("hashes OTP values with email and purpose context", async () => {
    const hash = await hashOtp("user@example.com", "REGISTER", "123456");
    expect(hash).not.toContain("123456");
    await expect(verifyOtpHash("user@example.com", "REGISTER", "123456", hash)).resolves.toBe(true);
    await expect(verifyOtpHash("user@example.com", "RESET_PASSWORD", "123456", hash)).resolves.toBe(false);
  });
});
