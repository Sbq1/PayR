import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handlePaymentWebhook } from "@/lib/services/payment.service";
import { PaymentError } from "@/lib/utils/errors";
import { corsHeaders } from "@/lib/utils/cors";
import { logger } from "@/lib/utils/logger";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import type { WompiWebhookEvent } from "@/lib/adapters/payment/types";

const REPLAY_WINDOW_SECONDS = 300; // 5 min
const TRANSACTION_UPDATED = "transaction.updated";

// Rate limit global: protege el CPU del check HMAC ante flood malicioso.
// 300/min = 5/s, holgado para ráfagas legítimas de Wompi.
const webhookLimiter = rateLimit("wompi-webhook-global", {
  interval: 60_000,
  limit: 300,
});

/**
 * POST /api/payment/webhook
 *
 * Recibe webhooks de Wompi cuando una transacción cambia de estado.
 * - HMAC inválido → 401 (Wompi reintentará)
 * - Timestamp fuera de la ventana de 5min → 400 (replay protection)
 * - Evento ya procesado → 200 idempotente (sin re-ejecutar)
 * - Payment no encontrado → 200 (evitar reintentos inútiles)
 * - Error de procesamiento → 200
 */
export async function POST(request: NextRequest) {
  // Rate limit global ANTES de parsear JSON y validar HMAC para proteger CPU.
  const rl = await webhookLimiter.check("global");
  if (!rl.success) {
    logger.error("webhook.rate_limited", { resetAt: rl.resetAt });
    return rateLimitResponse(rl.resetAt);
  }

  try {
    const event: WompiWebhookEvent = await request.json();

    if (event.event !== TRANSACTION_UPDATED) {
      return Response.json({ received: true });
    }

    // Replay protection: Wompi envía `timestamp` en segundos Unix.
    // Si el evento tiene más de REPLAY_WINDOW_SECONDS → rechazar.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const eventTs = Number(event.timestamp);
    if (!Number.isFinite(eventTs)) {
      logger.error("webhook.invalid_timestamp", { timestamp: event.timestamp });
      return Response.json({ error: "invalid_timestamp" }, { status: 400 });
    }
    const drift = Math.abs(nowSeconds - eventTs);
    if (drift > REPLAY_WINDOW_SECONDS) {
      logger.error("webhook.replay_rejected", {
        driftSeconds: drift,
        eventTs,
        nowSeconds,
      });
      return Response.json({ error: "replay_rejected" }, { status: 400 });
    }

    // Idempotency key: Wompi no envía event_id dedicado, pero la tupla
    // (transaction.id, status) es única por transición de estado.
    const txn = event.data.transaction;
    const eventId = `${txn.id}:${txn.status}`;

    // Intento de INSERT atómico con ON CONFLICT DO NOTHING.
    // Usamos executeRaw porque Prisma no expone ON CONFLICT en create().
    const inserted = await db.$executeRaw`
      INSERT INTO processed_webhooks (event_id, event_type, received_at)
      VALUES (${eventId}, ${event.event}, NOW())
      ON CONFLICT (event_id) DO NOTHING
    `;

    if (inserted === 0) {
      // Ya procesado — respuesta idempotente.
      logger.info("webhook.duplicate_ignored", { eventId });
      return Response.json(
        { received: true, idempotent: true },
        { headers: corsHeaders(request) },
      );
    }

    try {
      await handlePaymentWebhook(event);
      await db.$executeRaw`
        UPDATE processed_webhooks
           SET processed_at = NOW()
         WHERE event_id = ${eventId}
      `;
    } catch (err) {
      // Si HMAC inválido o mismatch de referencia, borramos el row para
      // permitir reintento legítimo de Wompi después de configurar bien.
      if (err instanceof PaymentError) {
        await db.$executeRaw`
          DELETE FROM processed_webhooks WHERE event_id = ${eventId}
        `;
      }
      throw err;
    }

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
