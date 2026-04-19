import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reconcilePayment } from "@/lib/services/payment.service";
import { verifyCronSecret } from "@/lib/utils/cron-auth";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/cron/reconcile-payments-zombie  (Vercel Cron cada 5 min)
 *
 * Ventana zombie: payments PENDING con updated_at > 10min, LIMIT 100.
 * SOLO reconciliación Wompi en esta fase — retry POS queda para Fase 4.5
 * post-merge. Reusa `reconcilePayment` (idempotente con re-check en TX).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.$queryRaw<Array<{ reference: string }>>`
    SELECT reference
      FROM payments
     WHERE status = 'PENDING'
       AND updated_at < NOW() - INTERVAL '10 minutes'
     ORDER BY updated_at ASC
     LIMIT 100
  `;

  let approved = 0;
  let declined = 0;
  let pending = 0;
  let errors = 0;

  for (const { reference } of rows) {
    try {
      const out = await reconcilePayment(reference);
      if (out.status === "APPROVED") approved++;
      else if (out.status === "DECLINED" || out.status === "VOIDED" || out.status === "ERROR") declined++;
      else pending++;
    } catch (err) {
      errors++;
      logger.error("cron.reconcile_zombie.row_error", {
        reference,
        message: (err as Error).message,
      });
    }
  }

  return Response.json({
    processed: rows.length,
    approved,
    declined,
    pending,
    errors,
  });
}
