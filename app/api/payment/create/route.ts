import { NextRequest } from "next/server";
import { createPayment } from "@/lib/services/payment.service";
import { createPaymentSchema } from "@/lib/validators/payment.schema";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { corsHeaders, handlePreflight } from "@/lib/utils/cors";
import { requireCustomerSession } from "@/lib/auth/customer-session";
import {
  withIdempotency,
  getIdempotencyKey,
} from "@/lib/utils/idempotency";

const ENDPOINT = "POST /api/payment/create";

// 5 por sesión/min (plan §5.3). Rate limit DESPUÉS de auth para no
// gastar cuota ajena con Bearer inválidos.
const limiter = rateLimit("payment-create", { interval: 60_000, limit: 5 });

/**
 * POST /api/payment/create
 *
 * Auth: Bearer JWT scope `table:<tid>` emitido por /api/session/start.
 * Header obligatorio: Idempotency-Key (UUID v4 o similar 8-64 chars).
 *
 * Body (Zod createPaymentSchema):
 *   - orderId, slug, tableId
 *   - tipAmount, tipPercentage
 *   - acceptedTipDisclaimer (true si tipAmount > 0) — Ley 2300
 *   - tipDisclaimerTextVersion (default "ley-2300-v1")
 *   - customerDocument? (opcional, requerido en 5 UVT — Fase 3)
 *   - customerEmail?
 *   - expectedVersion — del bill response, para lock optimista
 *
 * Response 200: { paymentId, reference, widgetConfig, orderVersion, idempotent? }
 *
 * Errores nuevos en Fase 2:
 *   400 IDEMPOTENCY_KEY_MISSING / INVALID
 *   409 IDEMPOTENCY_CONFLICT / IN_FLIGHT
 *   409 ORDER_VERSION_MISMATCH (otro pagador ganó el lock)
 *   422 (via Zod)  — tipAmount>0 sin acceptedTipDisclaimer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const session = await requireCustomerSession(request, {
      tableId: parsed.data.tableId,
      restaurantSlug: parsed.data.slug,
    });

    const rl = await limiter.check(session.sessionId);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const idemKey = getIdempotencyKey(request);

    const idem = await withIdempotency<{
      paymentId: string;
      reference: string;
      widgetConfig: unknown;
      orderVersion: number;
    }>({
      key: idemKey,
      sessionId: session.sessionId,
      endpoint: ENDPOINT,
      requestBody: parsed.data,
    });

    if (idem.replay) {
      return Response.json(
        { ...idem.body, idempotent: true },
        { status: idem.status, headers: corsHeaders(request) }
      );
    }

    const result = await createPayment({
      ...parsed.data,
      sessionId: session.sessionId,
    });

    await idem.save(200, result);

    return Response.json(result, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS(request: Request) {
  return handlePreflight(request);
}
