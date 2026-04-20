import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyCronSecret } from "@/lib/utils/cron-auth";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/cron/dead-letter-payments  (Vercel Cron cada 30 min)
 *
 * Última línea de defensa: payments PENDING con más de 6h de antigüedad
 * se marcan como ERROR con razón "dead_letter_6h".
 *
 * Rationale:
 * - reconcile-hot corre cada 2min y zombie cada 5min durante las primeras
 *   horas. Si a las 6h un payment sigue PENDING, Wompi no lo tiene o hay
 *   inconsistencia permanente.
 * - Dejarlo PENDING indefinido infla métricas y oculta pagos realmente
 *   fallidos bajo el ruido de zombies.
 * - ERROR es terminal → dashboard puede mostrar "pago no completado" y
 *   el restaurante sabe que tiene que cobrar por otro medio.
 *
 * NO elimina el registro (forensics, compliance, reclamos del cliente).
 * Emite logger.error por cada uno → Sentry alerta si hay volumen raro.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.$queryRaw<
    Array<{ id: string; reference: string; order_id: string; amount_in_cents: number }>
  >`
    SELECT id, reference, order_id, amount_in_cents
      FROM payments
     WHERE status = 'PENDING'
       AND created_at < NOW() - INTERVAL '6 hours'
     ORDER BY created_at ASC
     LIMIT 50
  `;

  if (rows.length === 0) {
    return Response.json({ processed: 0 });
  }

  let failed = 0;
  for (const row of rows) {
    try {
      // UPDATE condicional: solo si sigue PENDING (evita sobrescribir si
      // un reconcile llegó entre el SELECT y este UPDATE).
      const result = await db.$executeRaw`
        UPDATE payments
           SET status = 'ERROR',
               wompi_response = COALESCE(wompi_response, '{}'::jsonb)
                 || jsonb_build_object(
                      'dead_letter', true,
                      'dead_letter_at', NOW()::text,
                      'dead_letter_reason', 'pending_more_than_6h'
                    )
         WHERE id = ${row.id}
           AND status = 'PENDING'
      `;
      if (result > 0) {
        failed++;
        logger.error("payment.dead_letter", {
          paymentId: row.id,
          reference: row.reference,
          orderId: row.order_id,
          amountInCents: row.amount_in_cents,
          reason: "pending_more_than_6h",
        });
      }
    } catch (err) {
      logger.error("payment.dead_letter.failed", {
        paymentId: row.id,
        reference: row.reference,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return Response.json({ processed: rows.length, failed });
}
