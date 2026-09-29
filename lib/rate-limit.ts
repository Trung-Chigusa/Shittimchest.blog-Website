import { ApiError } from "@/lib/api-response";

type Bucket = {
  count: number;
  resetAt: number;
};

type Lock = {
  count: number;
  blockedUntil?: number;
};

const buckets = new Map<string, Bucket>();
const loginLocks = new Map<string, Lock>();

export function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  current.count += 1;
  const retryAfter = Math.ceil((current.resetAt - now) / 1000);
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfter,
  };
}

export function assertRateLimit(key: string, limit: number, windowSeconds: number) {
  const result = checkRateLimit(key, limit, windowSeconds);
  if (!result.allowed) {
    throw new ApiError("RATE_LIMITED", `Too many requests. Try again in ${result.retryAfter}s.`, 429);
  }
  return result;
}

export function assertLoginNotLocked(key: string) {
  const lock = loginLocks.get(key);
  if (lock?.blockedUntil && lock.blockedUntil > Date.now()) {
    throw new ApiError("RATE_LIMITED", "Too many failed login attempts. Please wait and try again.", 429);
  }
}

export function recordLoginFailure(key: string) {
  const lock = loginLocks.get(key) ?? { count: 0 };
  lock.count += 1;
  if (lock.count >= 5) {
    lock.blockedUntil = Date.now() + 15 * 60_000;
  }
  loginLocks.set(key, lock);
}

export function clearLoginFailures(key: string) {
  loginLocks.delete(key);
}
