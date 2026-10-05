import { describe, expect, it } from "vitest";
import { loginSchema, postInputSchema, registerSchema } from "@/lib/validators";

describe("Zod validators", () => {
  it("accepts a strong registration payload", () => {
    expect(
      registerSchema.safeParse({
        displayName: "Denia",
        email: "Denia@Example.com",
        password: "StrongPass1!",
        confirmPassword: "StrongPass1!",
        otpCode: "123456",
      }).success,
    ).toBe(true);
  });

  it("rejects weak passwords and invalid login emails", () => {
    expect(
      registerSchema.safeParse({
        displayName: "D",
        email: "bad",
        password: "short",
        confirmPassword: "nope",
        otpCode: "abc",
      }).success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: "bad", password: "", remember: false }).success).toBe(false);
  });

  it("rejects traversal-like slugs and too many tags", () => {
    const result = postInputSchema.safeParse({
      title: "Valid cyber note",
      slug: "../../admin",
      excerpt: "short",
      content: "body",
      categoryId: "cat",
      tags: Array.from({ length: 11 }, (_, index) => `tag${index}`),
      language: "vi",
      difficulty: "BEGINNER",
      topicType: "NOTE",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
  });

  it("accepts URL, upload and bundled covers but not arbitrary local paths", () => {
    const withCover = (coverImage: string) =>
      postInputSchema.safeParse({
        title: "Valid cyber note",
        excerpt: "short",
        content: "body",
        categoryId: "cat",
        coverImage,
      }).success;

    expect(withCover("https://example.com/cover.png")).toBe(true);
    expect(withCover("/uploads/bd7675bc-f82d-4120-af98-f786419ab900.png")).toBe(true);
    expect(withCover("/images/covers/web101-01-sqli.svg")).toBe(true);
    expect(withCover("")).toBe(true);
    expect(withCover("/etc/passwd")).toBe(false);
    expect(withCover("/images/<script>")).toBe(false);
  });
});
