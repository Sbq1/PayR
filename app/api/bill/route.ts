import { NextRequest } from "next/server";
import { getBillForTable } from "@/lib/services/bill.service";
import { getBillQuerySchema } from "@/lib/validators/bill.schema";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { corsHeaders, handlePreflight } from "@/lib/utils/cors";
import { requireCustomerSession } from "@/lib/auth/customer-session";

// 60 requests por sesión/min. Rate limit por sessionId (no IP) porque
// un solo comensal puede pollear legítimamente durante 2min post-redirect.
const limiter = rateLimit("bill", { interval: 60_000, limit: 60 });

/**
 * GET /api/bill?slug=...&tableId=...
 *
 * Retorna la cuenta abierta de una mesa.
 *
 * Requiere JWT efímero emitido por POST /api/session/start:
 *   Authorization: Bearer <jwt>
 *
 * Defense in depth:
 * - requireCustomerSession valida firma + DB (no revocada, no expirada)
 *   + restaurant.is_active + consistencia claims vs DB.
 * - El narrow { tableId, restaurantSlug } fuerza IDOR check: el JWT
 *   debe corresponder exactamente a la mesa y slug del query.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const parsed = getBillQuerySchema.safeParse({
      slug: searchParams.get("slug"),
      tableId: searchParams.get("tableId"),
    });

    if (!parsed.success) {
      return Response.json(
        { error: "Parametros invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { slug, tableId } = parsed.data;

    // Auth + IDOR en un solo paso. Lanza 401/403 con código semántico.
    const session = await requireCustomerSession(request, {
      tableId,
      restaurantSlug: slug,
    });

    // Rate limit por sesión (después de auth para que tokens inválidos
    // no gasten cuota ajena).
    const rl = await limiter.check(session.sessionId);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const bill = await getBillForTable(slug, tableId);

    return Response.json(bill, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS(request: Request) {
  return handlePreflight(request);
}
