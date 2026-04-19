import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyCronSecret } from "@/lib/utils/cron-auth";
import { reconcileBatch } from "@/lib/utils/reconcile-batch";

/**
 * GET /api/cron/reconcile-payments-hot  (Vercel Cron cada 2 min)
 *
 * Ventana caliente: payments PENDING entre 90s y 10min, LIMIT 200.
 * Reusa `reconcilePayment` (idempotente con re-check en TX) vía
 * `reconcileBatch` (batches de 5 con allSettled).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // `created_at` en vez de `updated_at`: el schema de payments no tiene
  // updated_at. Un Payment PENDING no se modifica hasta transicionar a
  // APPROVED/DECLINED (que setea paid_at), así que created_at es proxy
  // directo de "hace cuánto está PENDING".
  const rows = await db.$queryRaw<Array<{ reference: string }>>`
    SELECT reference
      FROM payments
     WHERE status = 'PENDING'
       AND created_at < NOW() - INTERVAL '90 seconds'
       AND created_at > NOW() - INTERVAL '10 minutes'
     ORDER BY created_at ASC
     LIMIT 200
  `;

  const refs = rows.map((r) => r.reference);
  const counts = await reconcileBatch(refs, "cron.reconcile_hot");

  return Response.json({ processed: rows.length, ...counts });
}
