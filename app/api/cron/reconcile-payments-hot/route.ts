import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reconcilePayment } from "@/lib/services/payment.service";
import { verifyCronSecret } from "@/lib/utils/cron-auth";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/cron/reconcile-payments-hot  (Vercel Cron cada 2 min)
 *
 * Ventana caliente: payments PENDING entre 90s y 10min, LIMIT 200.
 * Reusa `reconcilePayment(reference)` — idempotente con re-check en TX.
 * Cubre el caso de webhook perdido/atrasado en la ventana corta.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.$queryRaw<Array<{ reference: string }>>`
    SELECT reference
      FROM payments
     WHERE status = 'PENDING'
       AND updated_at < NOW() - INTERVAL '90 seconds'
       AND updated_at > NOW() - INTERVAL '10 minutes'
     ORDER BY updated_at ASC
     LIMIT 200
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
      logger.error("cron.reconcile_hot.row_error", {
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
