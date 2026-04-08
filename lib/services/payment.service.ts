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
  tipPercentage: number;
  tipAmount: number;
  customerEmail?: string;
}): Promise<{
  paymentId: string;
  reference: string;
  widgetConfig: WompiWidgetConfig;
}> {
  const { orderId, tipPercentage, tipAmount, customerEmail } = params;

  // Transacción atómica para prevenir race conditions (doble pago)
  const { payment, totalWithTip, restaurant, tableId } = await db.$transaction(async (tx) => {
    // 1. Buscar orden con lock implícito dentro de transacción
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { restaurants: true },
    });

    if (!order) throw new NotFoundError("Orden");
    if (order.status === "PAID") throw new PaymentError("Esta orden ya fue pagada");
    if (order.status === "PAYING") throw new PaymentError("Ya hay un pago en proceso para esta orden");

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

  // 3. Verificar que el monto coincida
  if (transaction.amount_in_cents !== payment.amount_in_cents) {
    console.error(
      `Webhook: amount mismatch. Expected ${payment.amount_in_cents}, got ${transaction.amount_in_cents}`
    );
    throw new PaymentError("Monto de transaccion no coincide");
  }

  // 4. Actualizar estado del pago
  const wompiStatus = transaction.status.toUpperCase();
  const mappedStatus = mapWompiStatus(wompiStatus);

  await db.payment.update({
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

  // 5. Si aprobado: cerrar orden y mesa en POS
  if (mappedStatus === "APPROVED") {
    await db.order.update({
      where: { id: payment.order_id },
      data: { status: "PAID" },
    });

    // Cerrar mesa en POS (no-op si es demo)
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
