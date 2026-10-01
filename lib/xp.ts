/** Gamified "Resonance level" derived from a member's real activity. */
export const XP_RULES = { published: 100, like: 10, comment: 5 } as const;

export function computeXp({ published, likes, comments }: { published: number; likes: number; comments: number }) {
  return published * XP_RULES.published + likes * XP_RULES.like + comments * XP_RULES.comment;
}

/** Level n starts at 100·(n−1)² XP, so early levels come quickly and later ones take longer. */
export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const floor = 100 * (level - 1) ** 2;
  const ceiling = 100 * level ** 2;
  return { level, xp, floor, ceiling, progress: (xp - floor) / (ceiling - floor), toNext: ceiling - xp };
}
