import { NextRequest } from "next/server";
import { handlePaymentWebhook } from "@/lib/services/payment.service";
import type { WompiWebhookEvent } from "@/lib/adapters/payment/types";

/**
 * POST /api/payment/webhook
 *
 * Recibe webhooks de Wompi cuando una transaccion cambia de estado.
 * DEBE retornar 200 siempre — si no, Wompi reintenta (30min, 3h, 24h).
 * La validacion HMAC ocurre dentro del service.
 */
export async function POST(request: NextRequest) {
  try {
    const event: WompiWebhookEvent = await request.json();

    // Solo procesamos transaction.updated
    if (event.event !== "transaction.updated") {
      return Response.json({ received: true });
    }

    await handlePaymentWebhook(event);

    return Response.json({ received: true });
  } catch (error) {
    // Siempre retornamos 200 para evitar reintentos infinitos de Wompi
    console.error("Webhook error:", error);
    return Response.json({ received: true, error: "processing_error" });
  }
}
