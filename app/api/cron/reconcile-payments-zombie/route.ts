import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyCronSecret } from "@/lib/utils/cron-auth";
import { reconcileBatch } from "@/lib/utils/reconcile-batch";

/**
 * GET /api/cron/reconcile-payments-zombie  (Vercel Cron cada 5 min)
 *
 * Ventana zombie: payments PENDING con created_at > 10min, LIMIT 100.
 * SOLO reconciliación Wompi en esta fase — retry POS queda para Fase 4.5
 * post-merge. Reusa `reconcilePayment` (idempotente con re-check en TX)
 * vía `reconcileBatch` (batches de 5 con allSettled).
 *
 * Usamos `created_at` porque el schema de payments no tiene updated_at;
 * un PENDING no se modifica hasta transicionar, así que equivale.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.$queryRaw<Array<{ reference: string }>>`
    SELECT reference
      FROM payments
     WHERE status = 'PENDING'
       AND created_at < NOW() - INTERVAL '10 minutes'
     ORDER BY created_at ASC
     LIMIT 100
  `;

  const refs = rows.map((r) => r.reference);
  const counts = await reconcileBatch(refs, "cron.reconcile_zombie");

  return Response.json({ processed: rows.length, ...counts });
}
