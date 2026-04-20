import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyCronSecret } from "@/lib/utils/cron-auth";

/**
 * GET /api/cron/expire-sessions  (Vercel Cron cada 5 min)
 *
 * Barrido en una sola TX:
 *  1) Libera locks de orders PAYING stale (guard: no existe payment APPROVED).
 *  2) Revoca sessions vencidas (revoked_at NULL AND expires_at < NOW()).
 *  3) Purga idempotency_keys vencidas.
 *  4) GC processed_webhooks > 180 días.
 *
 * Una sola transacción para consistencia del barrido; si algo falla, nada
 * cambia y el próximo tick reintenta.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Callback-form para poder configurar `timeout: 30s` — cubre barrido
  // grande de webhooks >180d tras GC backlog. Default de Prisma (5s)
  // podría quedar corto en primer tick o picos.
  const [locksReleased, sessionsRevoked, idempotencyPurged, webhooksPurged] =
    await db.$transaction(
      async (tx) => {
        // Orphans con locks NULL (data legacy del piloto viejo) nunca caen
        // en `lock_expires_at < NOW()` y la orden queda PAYING para siempre
        // — el checkout entra en loop "la cuenta cambió" porque cada intento
        // de lockear bumpea version. Guard de edad con updated_at protege
        // cualquier pago en curso (<30min) contra liberación prematura.
        //
        // Guard de payments terminales incluye PARTIALLY_REFUNDED y REFUNDED:
        // un payment que fue aprobado y después devuelto (total o parcial)
        // NO debe tratarse como "sin pagar" — el dinero pasó por el sistema
        // y el order debería reflejar ese flow, no ser liberado a PENDING.
        const locks = await tx.$executeRaw`
          UPDATE orders
             SET status = 'PENDING',
                 version = version + 1,
                 locked_at = NULL,
                 lock_expires_at = NULL,
                 locked_by_session_id = NULL
           WHERE status = 'PAYING'
             AND (
               lock_expires_at < NOW()
               OR (lock_expires_at IS NULL AND updated_at < NOW() - INTERVAL '30 minutes')
             )
             AND NOT EXISTS (
               SELECT 1 FROM payments
                WHERE payments.order_id = orders.id
                  AND payments.status IN ('APPROVED', 'PARTIALLY_REFUNDED', 'REFUNDED')
             )
        `;
        const sessions = await tx.$executeRaw`
          UPDATE sessions
             SET revoked_at = NOW()
           WHERE revoked_at IS NULL
             AND expires_at < NOW()
        `;
        const idem = await tx.$executeRaw`
          DELETE FROM idempotency_keys
           WHERE expires_at < NOW()
        `;
        const webhooks = await tx.$executeRaw`
          DELETE FROM processed_webhooks
           WHERE received_at < NOW() - INTERVAL '180 days'
        `;
        return [locks, sessions, idem, webhooks] as const;
      },
      { timeout: 30_000 }
    );

  return Response.json({
    locksReleased,
    sessionsRevoked,
    idempotencyPurged,
    webhooksPurged,
  });
}
