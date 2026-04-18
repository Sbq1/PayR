import { NextRequest } from "next/server";
import { reconcilePayment } from "@/lib/services/payment.service";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { z } from "zod/v4";

const limiter = rateLimit("payment-verify", { interval: 60_000, limit: 20 });

const schema = z.object({
  reference: z.string(),
});

/**
 * POST /api/payment/verify
 * Called by result page to verify payment status.
 * If Wompi says APPROVED but our DB says PENDING, complete the payment.
 * This is a fallback for when the webhook doesn't arrive.
 *
 * La lógica de reconciliación vive en `lib/services/payment.service.ts::reconcilePayment`
 * y es compartida con el cron de reconciliación (`/api/cron/reconcile-payments-*`).
 */
export async function POST(request: NextRequest) {
  try {
    const rl = await limiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "reference requerido" }, { status: 400 });
    }

    const outcome = await reconcilePayment(parsed.data.reference);

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
