import { reconcilePayment, type ReconcileOutcome } from "@/lib/services/payment.service";
import { logger } from "@/lib/utils/logger";

export interface ReconcileBatchResult {
  approved: number;
  declined: number;
  pending: number;
  errors: number;
}

/**
 * Ejecuta `reconcilePayment` en batches de 5 en paralelo con `allSettled`.
 *
 * - Balance throughput (~5× vs serial) vs pressure sobre pooler Supabase
 *   (6543) y Wompi rate limits.
 * - `allSettled` aísla fallos por fila sin abortar el batch.
 * - Usado por crons `reconcile-payments-hot` y `reconcile-payments-zombie`.
 */
export async function reconcileBatch(
  references: readonly string[],
  logTag: string,
  batchSize = 5
): Promise<ReconcileBatchResult> {
  const result: ReconcileBatchResult = { approved: 0, declined: 0, pending: 0, errors: 0 };

  for (let i = 0; i < references.length; i += batchSize) {
    const batch = references.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map((ref) => reconcilePayment(ref)));
    settled.forEach((settledResult, idx) => {
      if (settledResult.status === "fulfilled") {
        tally(result, settledResult.value);
      } else {
        result.errors++;
        logger.error(`${logTag}.row_error`, {
          reference: batch[idx],
          message: (settledResult.reason as Error)?.message ?? String(settledResult.reason),
        });
      }
    });
  }

  return result;
}

function tally(acc: ReconcileBatchResult, out: ReconcileOutcome) {
  if (out.status === "APPROVED") acc.approved++;
  else if (out.status === "DECLINED" || out.status === "VOIDED" || out.status === "ERROR") acc.declined++;
  else acc.pending++;
}
