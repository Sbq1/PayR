import { getRedis } from "./rate-limit";

const LOCKOUT_TTL_SECONDS = 15 * 60;

const POLICY = {
  email: { windowSec: 10 * 60, threshold: 5 },
  ip: { windowSec: 60 * 60, threshold: 30 },
} as const;

export type LockoutKind = keyof typeof POLICY;

function lockKey(kind: LockoutKind, id: string): string {
  return `payr:auth-lockout:${kind}:${id.toLowerCase()}`;
}

function failKey(kind: LockoutKind, id: string): string {
  return `payr:auth-fail:${kind}:${id.toLowerCase()}`;
}

export interface LockoutStatus {
  locked: boolean;
  expiresAt: number | null;
}

export async function isLockedOut(
  kind: LockoutKind,
  id: string
): Promise<LockoutStatus> {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[auth-lockout] Redis no disponible — fail-closed (${kind}:${id})`
      );
      return {
        locked: true,
        expiresAt: Date.now() + LOCKOUT_TTL_SECONDS * 1000,
      };
    }
    return { locked: false, expiresAt: null };
  }

  const ttl = await redis.ttl(lockKey(kind, id));
  if (typeof ttl === "number" && ttl > 0) {
    return { locked: true, expiresAt: Date.now() + ttl * 1000 };
  }
  return { locked: false, expiresAt: null };
}

/**
 * Incrementa el contador de fallos en su ventana. Si supera el threshold,
 * setea el lockout de 15 min y retorna { locked: true, expiresAt }.
 */
export async function recordFailure(
  kind: LockoutKind,
  id: string
): Promise<LockoutStatus> {
  const redis = getRedis();
  if (!redis) return { locked: false, expiresAt: null };

  const key = failKey(kind, id);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, POLICY[kind].windowSec);
  }
  if (count >= POLICY[kind].threshold) {
    await redis.set(lockKey(kind, id), "1", { ex: LOCKOUT_TTL_SECONDS });
    return {
      locked: true,
      expiresAt: Date.now() + LOCKOUT_TTL_SECONDS * 1000,
    };
  }
  return { locked: false, expiresAt: null };
}

/** Reset del contador de fallos tras login exitoso. */
export async function resetFailures(
  kind: LockoutKind,
  id: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(failKey(kind, id));
}

export function lockoutTtlSeconds(): number {
  return LOCKOUT_TTL_SECONDS;
}
