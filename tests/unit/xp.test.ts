import { describe, expect, it } from "vitest";
import { computeXp, levelFromXp } from "@/lib/xp";

describe("resonance xp", () => {
  it("weights publishing, likes and comments", () => {
    expect(computeXp({ published: 2, likes: 3, comments: 4 })).toBe(250);
  });

  it("starts at level 1 with progress toward 100 XP", () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, floor: 0, ceiling: 100, toNext: 100, progress: 0 });
  });

  it("crosses level boundaries at 100·n²", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(400).level).toBe(3);
    expect(levelFromXp(250)).toMatchObject({ level: 2, floor: 100, ceiling: 400, toNext: 150 });
  });
});
