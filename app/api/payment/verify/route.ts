import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reconcilePayment } from "@/lib/services/payment.service";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { requireCustomerSession } from "@/lib/auth/customer-session";
import { z } from "zod/v4";

// 60/sesión/min — alto porque el cliente pollea cada ~3s durante 2min
// post-redirect Wompi (cubre webhook perdidos sin esperar al cron).
const limiter = rateLimit("payment-verify", { interval: 60_000, limit: 60 });

const schema = z.object({
  reference: z.string().min(1).max(120),
});

/**
 * POST /api/payment/verify
 *
 * Polling del cliente post-redirect Wompi. Si Wompi dice APPROVED pero
 * el webhook se perdió, este endpoint aplica el estado final.
 *
 * Auth: Bearer JWT emitido por /api/session/start. Acepta scopes
 * 'table:{tid}' (pre-pago) y 'receipt:{paymentId}' (post-pago).
 *
 * Ownership: la reference debe pertenecer a un payment cuya order.table_id
 * coincida con session.tableId — bloquea IDOR (leer status de pagos ajenos).
 *
 * La lógica de reconciliación vive en `payment.service.ts::reconcilePayment`
 * y es compartida con los crons de reconciliación (fase 4).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireCustomerSession(request);

    const rl = await limiter.check(session.sessionId);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "reference requerido" },
        { status: 400 }
      );
    }

    const { reference } = parsed.data;

    // Ownership check previo al reconcile. Evita que un sessionId de
    // mesa X use `reference` de mesa Y para espiar estado de pago ajeno.
    const owns = await db.payment.findUnique({
      where: { reference },
      select: {
        orders: { select: { table_id: true, restaurant_id: true } },
      },
    });

    if (!owns) {
      return Response.json({ error: "Pago no encontrado" }, { status: 404 });
    }
    if (
      owns.orders.table_id !== session.tableId ||
      owns.orders.restaurant_id !== session.restaurantId
    ) {
      return Response.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    const outcome = await reconcilePayment(reference);

    switch (outcome.status) {
      case "NOT_FOUND":
        return Response.json({ error: "Pago no encontrado" }, { status: 404 });

      case "MISMATCH":
        return Response.json(
          { error: `Discrepancia en ${outcome.field}` },
          { status: 409 }
        );

      case "APPROVED":
        if (outcome.alreadyFinal) {
          return Response.json({ status: "APPROVED", already: true });
        }
        return Response.json({
          status: "APPROVED",
          updated: outcome.applied,
        });

      case "DECLINED":
      case "VOIDED":
      case "ERROR":
        return Response.json({
          status: outcome.status,
          ...(outcome.applied ? { updated: true } : {}),
        });

      case "PENDING":
      default:
        return Response.json({ status: "PENDING" });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
