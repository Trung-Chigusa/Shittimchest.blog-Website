import { describe, expect, it } from "vitest";
import { stripDangerousText } from "@/lib/security";

describe("security hardening checks", () => {
  it("strips obvious XSS payloads from plain text fields", () => {
    const payload = `<script>alert(1)</script><img src=x onerror="alert(1)">javascript:alert(1)`;
    const cleaned = stripDangerousText(payload);
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("onerror");
    expect(cleaned).not.toContain("javascript:");
  });
});
