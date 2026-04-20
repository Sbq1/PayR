import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/utils/errors";

// Skeleton v1: crea el row de refund en estado PENDING + ajusta
// payment.refunded_amount + propaga order.status cuando corresponde.
// NO ejecuta Wompi ni Siigo — un humano procesa la nota crédito en
// los paneles de ambos proveedores y actualiza wompi_refund_id /
// siigo_credit_note_id manualmente.
//
// 3 capas anti-race simétricas al lock optimista del Order:
//   (1) Idempotency-Key HTTP → bloquea doble submit del dashboard
//   (2) UNIQUE INDEX (payment, amount, reason_hash, date) → dedupe
//       semántico entre managers distintos del mismo restaurante
//   (3) Lock atómico sobre payments.refunded_amount con guard
//       refunded_amount + $x <= amount_in_cents (SQL crudo porque
//       Prisma no soporta ese comparator en updateMany)

export interface CreateRefundParams {
  paymentId: string;
  amountInCents: number;
  reason: string;
  initiatedBy: string;
  /** restaurantId del staff autenticado — ownership barrier */
  restaurantId: string;
  /** idempotency_key único, persistido en la row */
  idempotencyKey: string;
}

export interface CreateRefundResult {
  id: string;
  status: "PENDING";
  paymentId: string;
  amountInCents: number;
  createdAt: Date;
}

export async function createRefund(
  params: CreateRefundParams
): Promise<CreateRefundResult> {
  const reasonHash = sha256Hex(params.reason.trim());

  // Ownership check previo. Si el payment no existe o no pertenece al
  // restaurante del staff, 404/403 antes de tocar nada.
  const payment = await db.payment.findUnique({
    where: { id: params.paymentId },
    select: {
      id: true,
      status: true,
      amount_in_cents: true,
      refunded_amount: true,
      order_id: true,
      orders: { select: { restaurant_id: true, status: true } },
    },
  });
  if (!payment) throw new NotFoundError("Pago");
  if (payment.orders.restaurant_id !== params.restaurantId) {
    throw new AppError("Acceso denegado", 403, "FORBIDDEN");
  }

  // Payment debe estar APPROVED o PARTIALLY_REFUNDED. Nunca refund
  // sobre PENDING / DECLINED / VOIDED / ERROR (no hay dinero).
  if (
    payment.status !== "APPROVED" &&
    payment.status !== "PARTIALLY_REFUNDED"
  ) {
    throw new AppError(
      "El pago no está en estado refundable",
      409,
      "PAYMENT_NOT_REFUNDABLE"
    );
  }

  return db.$transaction(async (tx) => {
    // Lock atómico: incrementa refunded_amount + decide nuevo status
    // con CASE, solo si no excede. count=0 → 409.
    const count = await tx.$executeRaw<number>`
      UPDATE "payments"
         SET "refunded_amount" = "refunded_amount" + ${params.amountInCents},
             "status" = CASE
               WHEN "refunded_amount" + ${params.amountInCents} >= "amount_in_cents"
                 THEN 'REFUNDED'::payment_status
               ELSE 'PARTIALLY_REFUNDED'::payment_status
             END
       WHERE "id" = ${params.paymentId}
         AND "status" IN ('APPROVED', 'PARTIALLY_REFUNDED')
         AND "refunded_amount" + ${params.amountInCents} <= "amount_in_cents"
    `;

    if (count === 0) {
      throw new AppError(
        "El monto del reembolso excede el saldo del pago",
        409,
        "REFUND_EXCEEDS_PAYMENT"
      );
    }

    // Insertar la row del refund. El UNIQUE (idempotency_key) + UNIQUE
    // compuesto (payment, amount, reason_hash, date) pueden violar; en
    // ese caso Prisma lanza P2002 que mapeamos a 409.
    let refund;
    try {
      refund = await tx.refund.create({
        data: {
          payment_id: params.paymentId,
          amount_in_cents: params.amountInCents,
          reason: params.reason.trim(),
          reason_hash: reasonHash,
          idempotency_key: params.idempotencyKey,
          initiated_by: params.initiatedBy,
          status: "PENDING",
        },
        select: {
          id: true,
          status: true,
          payment_id: true,
          amount_in_cents: true,
          created_at: true,
        },
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        throw new AppError(
          "Refund duplicado (mismo pago + monto + motivo hoy)",
          409,
          "REFUND_DUPLICATE"
        );
      }
      throw err;
    }

    // Sincronizar order.status: post-refund el estado del order debe
    // ser función pura de sus payments, independiente del snapshot
    // previo. Esto cubre:
    //   - Order en PAID → PARTIALLY_REFUNDED / REFUNDED (caso normal)
    //   - Order ya en PARTIALLY_REFUNDED de un refund anterior
    //   - Order en estado inconsistente (histórico de piloto viejo —
    //     orphan PAYING que quedó stuck antes del fix de locks NULL).
    //     Sin este sync, un refund sobre un payment cuyo order nunca
    //     llegó a PAID deja el order con status incoherente para
    //     siempre, invisible a cualquier dashboard query.
    //
    // Guard CANCELLED: no sobrescribir órdenes canceladas manualmente
    // — eso requiere intervención humana para entender qué pasó.
    //
    // v2 manejará escenarios con múltiples payments APPROVED (orden
    // pagada con 2 métodos distintos p.ej.).
    const anyApproved = await tx.payment.findFirst({
      where: { order_id: payment.order_id, status: "APPROVED" },
      select: { id: true },
    });
    const anyRefunded = await tx.payment.findFirst({
      where: {
        order_id: payment.order_id,
        status: { in: ["PARTIALLY_REFUNDED", "REFUNDED"] },
      },
      select: { id: true },
    });
    const currentOrder = await tx.order.findUnique({
      where: { id: payment.order_id },
      select: { status: true },
    });
    if (
      !anyApproved &&
      anyRefunded &&
      currentOrder?.status !== "CANCELLED" &&
      currentOrder?.status !== "REFUNDED"
    ) {
      const anyPartial = await tx.payment.findFirst({
        where: {
          order_id: payment.order_id,
          status: "PARTIALLY_REFUNDED",
        },
        select: { id: true },
      });
      await tx.order.update({
        where: { id: payment.order_id },
        data: {
          status: anyPartial ? "PARTIALLY_REFUNDED" : "REFUNDED",
          version: { increment: 1 },
        },
      });
    }

    return {
      id: refund.id,
      status: "PENDING" as const,
      paymentId: refund.payment_id,
      amountInCents: refund.amount_in_cents,
      createdAt: refund.created_at,
    };
  });
}

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
