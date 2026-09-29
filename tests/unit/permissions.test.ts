import { describe, expect, it } from "vitest";
import { canEditPost, canManageUsers, canModerate, canPublishDirectly } from "@/lib/permissions";

const activeUser = { id: "u1", role: "USER" as const, status: "ACTIVE" as const };
const moderator = { id: "m1", role: "MODERATOR" as const, status: "ACTIVE" as const };
const admin = { id: "a1", role: "ADMIN" as const, status: "ACTIVE" as const };

describe("permission checks", () => {
  it("keeps moderator and admin controls server-side", () => {
    expect(canModerate(activeUser)).toBe(false);
    expect(canModerate(moderator)).toBe(true);
    expect(canManageUsers(moderator)).toBe(false);
    expect(canManageUsers(admin)).toBe(true);
  });

  it("allows owners or moderators to edit posts", () => {
    expect(canEditPost(activeUser, { authorId: "u1" })).toBe(true);
    expect(canEditPost(activeUser, { authorId: "u2" })).toBe(false);
    expect(canEditPost(moderator, { authorId: "u2" })).toBe(true);
    expect(canPublishDirectly(activeUser)).toBe(false);
  });
});
