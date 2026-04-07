/**
 * Rate limiter en memoria con ventana deslizante.
 * Cada instancia serverless tiene su propio estado — suficiente para
 * prevenir brute force básico sin necesidad de Redis.
 */

interface RateLimitConfig {
  interval: number; // Ventana en ms
  limit: number;    // Max requests por ventana
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function rateLimit(name: string, config: RateLimitConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  // Cleanup cada 60s para evitar memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000).unref?.();

  return {
    check(key: string): { success: boolean; remaining: number; resetAt: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + config.interval });
        return { success: true, remaining: config.limit - 1, resetAt: now + config.interval };
      }

      entry.count++;

      if (entry.count > config.limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
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
