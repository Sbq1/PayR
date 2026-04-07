import { NextRequest } from "next/server";
import { handlePaymentWebhook } from "@/lib/services/payment.service";
import { PaymentError } from "@/lib/utils/errors";
import { corsHeaders, handlePreflight } from "@/lib/utils/cors";
import { logger } from "@/lib/utils/logger";
import type { WompiWebhookEvent } from "@/lib/adapters/payment/types";

/**
 * POST /api/payment/webhook
 *
 * Recibe webhooks de Wompi cuando una transacción cambia de estado.
 * - HMAC inválido → 401 (Wompi reintentará, lo cual es correcto)
 * - Payment no encontrado → 200 (evitar reintentos inútiles)
 * - Error de procesamiento → 200 (ya se intentó)
 */
export async function POST(request: NextRequest) {
  try {
    const event: WompiWebhookEvent = await request.json();

    if (event.event !== "transaction.updated") {
      return Response.json({ received: true });
    }

    await handlePaymentWebhook(event);

    return Response.json({ received: true }, { headers: corsHeaders(request) });
  } catch (error) {
    // HMAC inválido → 401 para que Wompi reintente (puede ser timing issue)
    if (error instanceof PaymentError && error.message.includes("Firma")) {
      logger.error("webhook.hmac_failure", { message: (error as Error).message });
      return Response.json({ error: "invalid_signature" }, { status: 401 });
    }

    // Otros errores → 200 para evitar reintentos infinitos
    logger.error("webhook.processing_error", { message: (error as Error).message });
    return Response.json({ received: true, error: "processing_error" });
  }
}
