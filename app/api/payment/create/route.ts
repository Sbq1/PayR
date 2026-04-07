import { NextRequest } from "next/server";
import { createPayment } from "@/lib/services/payment.service";
import { createPaymentSchema } from "@/lib/validators/payment.schema";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { corsHeaders, handlePreflight } from "@/lib/utils/cors";

const limiter = rateLimit("payment-create", { interval: 60_000, limit: 10 }); // 10/min

/**
 * POST /api/payment/create
 *
 * Crea una transaccion de pago y retorna la config del widget Wompi.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success, resetAt } = limiter.check(ip);
    if (!success) return rateLimitResponse(resetAt);

    const body = await request.json();

    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createPayment(parsed.data);

    return Response.json(result, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS(request: Request) {
  return handlePreflight(request);
}
