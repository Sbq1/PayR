import { NextRequest } from "next/server";
import { startSession } from "@/lib/services/session.service";
import { startSessionSchema } from "@/lib/validators/session.schema";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { corsHeaders, handlePreflight } from "@/lib/utils/cors";

// 20 requests por IP por minuto. Fail-closed (si Redis cae, rechaza).
// Protege contra scraping de mesas y brute-forcing de qrToken.
const limiter = rateLimit("session-start", { interval: 60_000, limit: 20 });

/**
 * POST /api/session/start
 *
 * Primer request del comensal tras escanear el QR. Valida el HMAC del QR
 * contra la versión actual y emite un JWT efímero (HS256, TTL 2h) cuyo
 * hash se persiste en `sessions` para revocación server-side.
 *
 * Body: { slug, tableId, qrToken, qrVersion }
 * Response 200: { sessionId, token, expiresAt, restaurant, table }
 *
 * Errores:
 *  400 → validación Zod
 *  401 QR_INVALID → firma/versión QR inválida
 *  403 RESTAURANT_INACTIVE → restaurante pausado
 *  404 TABLE_NOT_FOUND → mesa no existe o no pertenece al slug
 *  429 → rate limit IP
 *  503 → Redis unavailable (fail-closed)
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await limiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const parsed = startSessionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const result = await startSession({
      ...parsed.data,
      userAgent,
      ip,
    });

    return Response.json(result, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS(request: Request) {
  return handlePreflight(request);
}
