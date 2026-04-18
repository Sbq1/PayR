import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createRefund } from "@/lib/services/refund.service";
import { createRefundSchema } from "@/lib/validators/refund.schema";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import {
  withIdempotency,
  getIdempotencyKey,
} from "@/lib/utils/idempotency";

const ENDPOINT = "POST /api/payment/refund";

// 20 por staff user/min. Defensa contra scripts accidentales que
// generen miles de refunds por un bug en UI.
const limiter = rateLimit("payment-refund", { interval: 60_000, limit: 20 });

/**
 * POST /api/payment/refund — skeleton v1 (Fase 2.6)
 *
 * Auth: staff session (cookie sc-session) del owner/manager del
 * restaurante al que pertenece el payment. Rol granular vendrá cuando
 * User.role exista (actualmente un user = un restaurant por
 * restaurants.owner_id, así que ownership del restaurante = autorización).
 *
 * Header obligatorio: Idempotency-Key (bloquea doble click del modal).
 *
 * Body: { paymentId, amountInCents, reason }
 *
 * v1: crea row refunds con status=PENDING + actualiza
 * payments.refunded_amount + propaga order.status. No ejecuta Wompi ni
 * Siigo — un humano cierra el caso en los paneles externos y toca la
 * row manualmente hasta que Fase post-piloto automatice.
 *
 * Errores:
 *   400 validación / IDEMPOTENCY_KEY_MISSING / INVALID
 *   401 staff no autenticado
 *   403 FORBIDDEN (payment de otro restaurante)
 *   404 pago no encontrado
 *   409 PAYMENT_NOT_REFUNDABLE / REFUND_EXCEEDS_PAYMENT /
 *       REFUND_DUPLICATE / IDEMPOTENCY_CONFLICT / IN_FLIGHT
 *   429 / 503
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }
    if (!session.user.restaurantId) {
      return Response.json(
        { error: "Usuario sin restaurante asignado" },
        { status: 403 }
      );
    }

    const rl = await limiter.check(session.user.id);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const parsed = createRefundSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const idemKey = getIdempotencyKey(request);

    // Scopeamos el idempotency por userId (no sessionId) porque aquí
    // el staff es el actor; el mismo usuario desde 2 tabs no debería
    // duplicar un refund.
    const idem = await withIdempotency<{
      id: string;
      status: "PENDING";
      paymentId: string;
      amountInCents: number;
      createdAt: string;
    }>({
      key: idemKey,
      sessionId: session.user.id, // scope por user, no por session efímera
      endpoint: ENDPOINT,
      requestBody: parsed.data,
    });

    if (idem.replay) {
      return Response.json(
        { ...idem.body, idempotent: true },
        { status: idem.status }
      );
    }

    const result = await createRefund({
      ...parsed.data,
      initiatedBy: session.user.id,
      restaurantId: session.user.restaurantId,
      idempotencyKey: idemKey,
    });

    const serialized = {
      ...result,
      createdAt: result.createdAt.toISOString(),
    };

    await idem.save(200, serialized);

    return Response.json(serialized, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
