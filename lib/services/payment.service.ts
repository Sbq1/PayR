import { db } from "@/lib/db";
import { getPaymentAdapter } from "@/lib/adapters/payment";
import { getPosAdapter } from "@/lib/adapters/pos";
import { NotFoundError, PaymentError } from "@/lib/utils/errors";
import type { WompiWebhookEvent, WompiWidgetConfig } from "@/lib/adapters/payment/types";

type WompiTransaction = WompiWebhookEvent["data"]["transaction"];

/**
 * Crea un pago para una orden:
 * 1. Busca orden + restaurante
 * 2. Actualiza tip y total
 * 3. Genera referencia unica
 * 4. Crea registro Payment en BD
 * 5. Retorna config del widget Wompi
 */
export async function createPayment(params: {
  orderId: string;
  slug: string;
  tableId: string;
  tipPercentage: number;
  tipAmount: number;
  customerEmail?: string;
}): Promise<{
  paymentId: string;
  reference: string;
  widgetConfig: WompiWidgetConfig;
}> {
  const {
    orderId,
    slug: claimedSlug,
    tableId: claimedTableId,
    tipPercentage,
    tipAmount,
    customerEmail,
  } = params;

  // Transacción atómica para prevenir race conditions (doble pago)
  const { payment, totalWithTip, restaurant, tableId } = await db.$transaction(async (tx) => {
    // 1. Buscar orden con lock implícito dentro de transacción
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { restaurants: true },
    });

    if (!order) throw new NotFoundError("Orden");

    // Ownership check: la orden debe pertenecer al slug+tableId declarado.
    // Sin esto, un atacante con cualquier orderId puede inflar tip/total
    // de órdenes ajenas.
    if (order.restaurants.slug !== claimedSlug) {
      throw new NotFoundError("Orden");
    }
    if (order.table_id !== claimedTableId) {
      throw new NotFoundError("Orden");
    }

    // Validación de tipAmount contra subtotal real de la orden.
    // Prevenir manipulación: tip no puede exceder el subtotal de la orden
    // (100% de propina es el máximo razonable).
    if (tipAmount > order.subtotal) {
      throw new PaymentError("Monto de propina excede el máximo permitido");
    }

    if (order.status === "PAID") throw new PaymentError("Esta orden ya fue pagada");
    if (order.status === "CANCELLED") throw new PaymentError("Esta orden fue cancelada");

    // If PAYING, check if previous payment can be retried
    if (order.status === "PAYING") {
      const lastPayment = await tx.payment.findFirst({
        where: { order_id: orderId, status: "PENDING" },
        orderBy: { created_at: "desc" },
      });

      if (lastPayment) {
        // Check with Wompi if the transaction actually exists/succeeded
        const wompiStatus = await checkWompiTransactionStatus(
          order.restaurants,
          lastPayment.reference
        );

        if (wompiStatus === "APPROVED") {
          throw new PaymentError("Esta orden ya fue pagada");
        }

        if (wompiStatus === "PENDING") {
          // Transaction genuinely in progress in Wompi — block retry
          throw new PaymentError("Ya hay un pago en proceso para esta orden");
        }

        // Transaction failed, was voided, or never created — allow retry
        await tx.payment.update({
          where: { id: lastPayment.id },
          data: { status: mapWompiStatus(wompiStatus || "ERROR") },
        });
      }
    }

    const rest = order.restaurants;
    const total = order.subtotal + order.tax + tipAmount;

    // 2. Actualizar orden a PAYING
    await tx.order.update({
      where: { id: orderId },
      data: {
        tip_percentage: tipPercentage,
        tip_amount: tipAmount,
        total,
        status: "PAYING",
      },
    });

    // 3. Crear registro de pago con referencia única
    const reference = `SC-${orderId.slice(-8)}-${Date.now()}`;
    const pmt = await tx.payment.create({
      data: {
        order_id: orderId,
        reference,
        amount_in_cents: total,
        currency: "COP",
        status: "PENDING",
        customer_email: customerEmail || null,
      },
    });

    // 4. Mark table as paying
    await tx.table.update({
      where: { id: order.table_id },
      data: { status: "PAYING" },
    });

    return { payment: pmt, totalWithTip: total, restaurant: rest, tableId: order.table_id };
  });

  const reference = payment.reference;

  // 5. Obtener config del widget Wompi (o demo)
  const adapter = getPaymentAdapter({
    posProvider: restaurant.pos_provider,
    wompiPublicKey: restaurant.wompi_public_key,
    wompiPrivateKey: restaurant.wompi_private_key,
    wompiEventsSecret: restaurant.wompi_events_secret,
    wompiIntegritySecret: restaurant.wompi_integrity_secret,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl = `${appUrl}/${restaurant.slug}/${tableId}/result?ref=${reference}`;

  const widgetConfig = await adapter.createTransaction({
    amountInCents: totalWithTip,
    reference,
    redirectUrl,
    customerEmail,
  });

  return {
    paymentId: payment.id,
    reference,
    widgetConfig,
  };
}

/**
 * Procesa un webhook de Wompi:
 * 1. Busca el pago por referencia
 * 2. Valida firma HMAC
 * 3. Actualiza estado del pago
 * 4. Si APPROVED: marca orden como PAID y cierra mesa en POS
 */
export async function handlePaymentWebhook(
  event: WompiWebhookEvent
): Promise<void> {
  const { transaction } = event.data;

  // 1. Buscar pago por referencia
  const payment = await db.payment.findUnique({
    where: { reference: transaction.reference },
    include: {
      orders: {
        include: { restaurants: true },
      },
    },
  });

  if (!payment) {
    console.warn(`Webhook: payment not found for ref ${transaction.reference}`);
    return; // Retornamos 200 para que Wompi no reintente
  }

  // Idempotencia: si ya esta en estado final, ignorar
  if (["APPROVED", "DECLINED", "VOIDED"].includes(payment.status)) {
    return;
  }

  const restaurant = payment.orders.restaurants;

  // 2. Validar firma HMAC
  const adapter = getPaymentAdapter({
    posProvider: restaurant.pos_provider,
    wompiPublicKey: restaurant.wompi_public_key,
    wompiPrivateKey: restaurant.wompi_private_key,
    wompiEventsSecret: restaurant.wompi_events_secret,
    wompiIntegritySecret: restaurant.wompi_integrity_secret,
  });

  const isValid = adapter.verifyWebhookSignature(event);

  if (!isValid) {
    console.error(`Webhook: invalid signature for ref ${transaction.reference}`);
    throw new PaymentError("Firma de webhook invalida");
  }

  // 3. Verificar reference exact-match (defensa contra colisiones parciales)
  if (transaction.reference !== payment.reference) {
    console.error(
      `Webhook: reference mismatch. Expected ${payment.reference}, got ${transaction.reference}`
    );
    throw new PaymentError("Referencia de transaccion no coincide");
  }

  // 4. Verificar que el monto coincida
  if (transaction.amount_in_cents !== payment.amount_in_cents) {
    console.error(
      `Webhook: amount mismatch. Expected ${payment.amount_in_cents}, got ${transaction.amount_in_cents}`
    );
    throw new PaymentError("Monto de transaccion no coincide");
  }

  // 5. Verificar moneda (prevenir bypass multimoneda)
  if (transaction.currency !== "COP") {
    console.error(`Webhook: invalid currency ${transaction.currency}`);
    throw new PaymentError("Moneda de transaccion no permitida");
  }

  // 6. Actualizar estado del pago atómicamente con re-check dentro de la TX
  //    para prevenir race condition con /api/payment/verify corriendo en paralelo.
  const wompiStatus = transaction.status.toUpperCase();
  const mappedStatus = mapWompiStatus(wompiStatus);

  const applied = await db.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });
    // Si otro thread ya llevó este payment a estado final, no re-aplicamos.
    if (!fresh || ["APPROVED", "DECLINED", "VOIDED"].includes(fresh.status)) {
      return false;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        wompi_transaction_id: transaction.id,
        status: mappedStatus,
        payment_method_type: transaction.payment_method_type,
        customer_email: transaction.customer_email || payment.customer_email,
        wompi_response: JSON.parse(JSON.stringify(transaction)),
        paid_at: mappedStatus === "APPROVED" ? new Date() : null,
      },
    });

    if (mappedStatus === "APPROVED") {
      await tx.order.update({
        where: { id: payment.order_id },
        data: { status: "PAID" },
      });

      await tx.table.update({
        where: { id: payment.orders.table_id },
        data: { status: "AVAILABLE" },
      });
    }

    return true;
  });

  if (!applied) return; // otra TX ya llevó el payment a estado final

  // 7. Cierre en POS fuera de la transacción DB (no-op si es demo)
  if (mappedStatus === "APPROVED") {
    try {
      const order = payment.orders;
      if (order.siigo_invoice_id) {
        const posAdapter = getPosAdapter({
          posProvider: restaurant.pos_provider,
          siigoUsername: restaurant.siigo_username,
          siigoAccessKey: restaurant.siigo_access_key,
        });
        await posAdapter.closeTable(
          order.siigo_invoice_id,
          payment.amount_in_cents
        );
      }
    } catch (error) {
      // Log pero no falla — el pago ya fue exitoso
      console.error("Error closing table in POS:", error);
    }
  }
}

/**
 * Consulta Wompi API para verificar el status real de una transacción.
 * Retorna el status de Wompi, o null si no existe transacción.
 */
async function checkWompiTransactionStatus(
  restaurant: { wompi_public_key: string | null },
  reference: string
): Promise<string | null> {
  if (!restaurant.wompi_public_key) return null;
  const txn = await fetchWompiTransactionByReference(
    restaurant.wompi_public_key,
    reference,
    5_000
  );
  return txn?.status ?? null;
}

/**
 * Consulta Wompi API y retorna el objeto transaction completo si existe.
 * Compartido entre `checkWompiTransactionStatus` (retry en createPayment) y
 * `reconcilePayment` (verify + cron de reconciliación).
 */
async function fetchWompiTransactionByReference(
  publicKey: string,
  reference: string,
  timeoutMs = 10_000
): Promise<WompiTransaction | null> {
  const env = (process.env.WOMPI_ENVIRONMENT || "sandbox")
    .replace(/\\n|\n/g, "")
    .trim();
  const baseUrl =
    env === "production"
      ? "https://production.wompi.co"
      : "https://sandbox.wompi.co";

  try {
    const res = await fetch(
      `${baseUrl}/v1/transactions?reference=${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${publicKey}` },
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    if (!res.ok) return null;
    const { data } = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as WompiTransaction;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resultado de reconciliar un payment con Wompi.
 * El caller decide cómo mapear a HTTP status / métrica.
 */
export type ReconcileOutcome =
  | { status: "APPROVED"; applied: boolean; alreadyFinal?: boolean }
  | { status: "DECLINED" | "VOIDED" | "ERROR"; applied: boolean }
  | { status: "PENDING" }
  | { status: "NOT_FOUND" }
  | { status: "MISMATCH"; field: "reference" | "amount" | "currency" };

/**
 * Reconcilia un payment con Wompi por reference.
 *
 * Consulta Wompi API, valida reference/amount/currency exactos, y aplica
 * la transición de estado de forma atómica con re-check dentro de la TX
 * para prevenir race conditions con el webhook concurrente.
 *
 * Idempotente: si el payment ya está en estado final, retorna `alreadyFinal`.
 *
 * Usado por:
 * - `/api/payment/verify` (polling del cliente tras redirect Wompi)
 * - `/api/cron/reconcile-payments-*` (reconciliación server-side)
 */
export async function reconcilePayment(
  reference: string
): Promise<ReconcileOutcome> {
  const payment = await db.payment.findUnique({
    where: { reference },
    include: {
      orders: { include: { restaurants: true } },
    },
  });

  if (!payment) return { status: "NOT_FOUND" };

  if (payment.status === "APPROVED") {
    return { status: "APPROVED", applied: false, alreadyFinal: true };
  }
  if (
    payment.status === "DECLINED" ||
    payment.status === "VOIDED" ||
    payment.status === "ERROR"
  ) {
    return { status: payment.status, applied: false };
  }
  if (payment.status !== "PENDING") {
    return { status: "PENDING" };
  }

  const restaurant = payment.orders.restaurants;

  // Sin credenciales Wompi completas (modo demo) → nada que reconciliar.
  if (
    !restaurant.wompi_public_key ||
    !restaurant.wompi_private_key ||
    !restaurant.wompi_events_secret ||
    !restaurant.wompi_integrity_secret
  ) {
    return { status: "PENDING" };
  }

  const txn = await fetchWompiTransactionByReference(
    restaurant.wompi_public_key,
    reference
  );

  if (!txn) return { status: "PENDING" };

  // Validación estricta antes de aplicar transición.
  if (txn.reference !== payment.reference) {
    return { status: "MISMATCH", field: "reference" };
  }
  if (txn.amount_in_cents !== payment.amount_in_cents) {
    return { status: "MISMATCH", field: "amount" };
  }
  if (txn.currency !== "COP") {
    return { status: "MISMATCH", field: "currency" };
  }

  if (txn.status === "APPROVED") {
    const result = await db.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      if (!fresh || fresh.status !== "PENDING") {
        return { applied: false };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          wompi_transaction_id: txn.id,
          status: "APPROVED",
          payment_method_type: txn.payment_method_type,
          customer_email: txn.customer_email || payment.customer_email,
          paid_at: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payment.order_id },
        data: { status: "PAID" },
      });

      await tx.table.update({
        where: { id: payment.orders.table_id },
        data: { status: "AVAILABLE" },
      });

      return { applied: true };
    });

    // Cerrar en POS fuera de la TX DB (I/O externo, no transaccional).
    if (result.applied && payment.orders.siigo_invoice_id) {
      try {
        const posAdapter = getPosAdapter({
          posProvider: restaurant.pos_provider,
          siigoUsername: restaurant.siigo_username,
          siigoAccessKey: restaurant.siigo_access_key,
        });
        await posAdapter.closeTable(
          payment.orders.siigo_invoice_id,
          payment.amount_in_cents
        );
      } catch (error) {
        console.error("Error closing table in POS:", error);
      }
    }

    return { status: "APPROVED", applied: result.applied };
  }

  if (
    txn.status === "DECLINED" ||
    txn.status === "VOIDED" ||
    txn.status === "ERROR"
  ) {
    // Narrow el string del API externo al literal union aceptado por Prisma.
    const finalStatus: "DECLINED" | "VOIDED" | "ERROR" = txn.status;

    const applied = await db.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      if (!fresh || fresh.status !== "PENDING") return false;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          wompi_transaction_id: txn.id,
          status: finalStatus,
          payment_method_type: txn.payment_method_type,
        },
      });
      return true;
    });

    return { status: finalStatus, applied };
  }

  // Wompi todavía en PENDING u otro estado no final.
  return { status: "PENDING" };
}

function mapWompiStatus(
  wompiStatus: string
): "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" {
  switch (wompiStatus) {
    case "APPROVED":
      return "APPROVED";
    case "DECLINED":
      return "DECLINED";
    case "VOIDED":
      return "VOIDED";
    case "ERROR":
      return "ERROR";
    default:
      return "PENDING";
  }
}
