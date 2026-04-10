import { db } from "@/lib/db";
import { getPaymentAdapter } from "@/lib/adapters/payment";
import { getPosAdapter } from "@/lib/adapters/pos";
import { NotFoundError, PaymentError } from "@/lib/utils/errors";
import { randomUUID } from "crypto";
import type { WompiWebhookEvent, WompiWidgetConfig } from "@/lib/adapters/payment/types";

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

  try {
    const env = (process.env.WOMPI_ENVIRONMENT || "sandbox")
      .replace(/\\n|\n/g, "")
      .trim();
    const baseUrl =
      env === "production"
        ? "https://production.wompi.co"
        : "https://sandbox.wompi.co";

    const res = await fetch(
      `${baseUrl}/v1/transactions?reference=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${restaurant.wompi_public_key}`,
        },
        signal: AbortSignal.timeout(5_000),
      }
    );

    if (!res.ok) return null;

    const { data } = await res.json();
    if (data && data.length > 0) return data[0].status;

    return null; // No transaction found in Wompi
  } catch {
    return null; // Network error — treat as no transaction
  }
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
