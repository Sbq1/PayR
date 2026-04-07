import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
  interval: number; // Ventana en ms
  limit: number; // Max requests por ventana
}

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

export function rateLimit(name: string, config: RateLimitConfig) {
  return {
    async check(
      key: string
    ): Promise<{ success: boolean; remaining: number; resetAt: number }> {
      const client = getRedis();
      if (!client) {
        return { success: true, remaining: config.limit, resetAt: 0 };
      }

      if (!limiters.has(name)) {
        const windowSec = Math.max(1, Math.ceil(config.interval / 1000));
        limiters.set(
          name,
          new Ratelimit({
            redis: client,
            limiter: Ratelimit.slidingWindow(config.limit, `${windowSec} s`),
            prefix: `payr:rl:${name}`,
          })
        );
      }

      const result = await limiters.get(name)!.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    },
  };
}

/** Extrae IP del request de Next.js */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

/** Respuesta 429 estándar */
export function rateLimitResponse(resetAt: number) {
  return Response.json(
    { error: "Demasiadas solicitudes. Intenta más tarde." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}
