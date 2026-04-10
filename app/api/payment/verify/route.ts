import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { getPosAdapter } from "@/lib/adapters/pos";
import { z } from "zod/v4";

const schema = z.object({
  reference: z.string(),
});

/**
 * POST /api/payment/verify
 * Called by result page to verify payment status.
 * If Wompi says APPROVED but our DB says PENDING, complete the payment.
 * This is a fallback for when the webhook doesn't arrive.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "reference requerido" }, { status: 400 });
    }

    const { reference } = parsed.data;

    const payment = await db.payment.findUnique({
      where: { reference },
      include: {
        orders: {
          include: { restaurants: true },
        },
      },
    });

    if (!payment) {
      return Response.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    // Already completed
    if (payment.status === "APPROVED") {
      return Response.json({ status: "APPROVED", already: true });
    }

    // Only verify PENDING payments
    if (payment.status !== "PENDING") {
      return Response.json({ status: payment.status });
    }

    const restaurant = payment.orders.restaurants;

    // Check if restaurant has real Wompi credentials
    if (
      restaurant.wompi_public_key &&
      restaurant.wompi_private_key &&
      restaurant.wompi_events_secret &&
      restaurant.wompi_integrity_secret
    ) {
      // Wompi API: search transaction by reference (only needs public key)
      const env = (process.env.WOMPI_ENVIRONMENT || "sandbox").replace(/\\n|\n/g, "").trim();
      const baseUrl = env === "production"
        ? "https://production.wompi.co"
        : "https://sandbox.wompi.co";

      const searchRes = await fetch(
        `${baseUrl}/v1/transactions?reference=${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${restaurant.wompi_public_key}`,
          },
          signal: AbortSignal.timeout(10_000),
        }
      );

      if (searchRes.ok) {
        const { data } = await searchRes.json();
        if (data && data.length > 0) {
          const txn = data[0];

          if (txn.status === "APPROVED") {
            // Validación estricta antes de marcar APPROVED:
            // - reference exact-match (no confiar en match parcial de la API)
            // - amount exact-match (prevenir price tampering / reference collision)
            // - currency COP (prevenir bypass multimoneda)
            if (txn.reference !== payment.reference) {
              console.error(
                `verify: reference mismatch ${txn.reference} vs ${payment.reference}`
              );
              return Response.json(
                { error: "Referencia inválida" },
                { status: 409 }
              );
            }
            if (txn.amount_in_cents !== payment.amount_in_cents) {
              console.error(
                `verify: amount mismatch ${txn.amount_in_cents} vs ${payment.amount_in_cents}`
              );
              return Response.json(
                { error: "Discrepancia de monto" },
                { status: 409 }
              );
            }
            if (txn.currency !== "COP") {
              console.error(`verify: invalid currency ${txn.currency}`);
              return Response.json(
                { error: "Moneda inválida" },
                { status: 409 }
              );
            }

            // Transacción atómica con re-check dentro para prevenir
            // race conditions si llegan verify y webhook simultáneos.
            const result = await db.$transaction(async (tx) => {
              const fresh = await tx.payment.findUnique({
                where: { id: payment.id },
                select: { status: true },
              });
              if (!fresh || fresh.status !== "PENDING") {
                return { applied: false, status: fresh?.status ?? null };
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

              return { applied: true, status: "APPROVED" };
            });

            if (!result.applied) {
              if (result.status === null) {
                return Response.json({ error: "Pago no encontrado" }, { status: 404 });
              }
              return Response.json({ status: result.status, already: true });
            }

            // Cerrar en POS fuera de la transacción DB.
            try {
              if (payment.orders.siigo_invoice_id) {
                const posAdapter = getPosAdapter({
                  posProvider: restaurant.pos_provider,
                  siigoUsername: restaurant.siigo_username,
                  siigoAccessKey: restaurant.siigo_access_key,
                });
                await posAdapter.closeTable(payment.orders.siigo_invoice_id, payment.amount_in_cents);
              }
            } catch (error) {
              console.error("Error closing table in POS:", error);
            }

            return Response.json({ status: "APPROVED", updated: true });
          }

          // Failed payment — update DB so retry is allowed.
          // Re-check reference para evitar actualizar un payment distinto.
          if (["DECLINED", "ERROR", "VOIDED"].includes(txn.status)) {
            if (txn.reference !== payment.reference) {
              return Response.json(
                { error: "Referencia inválida" },
                { status: 409 }
              );
            }

            await db.$transaction(async (tx) => {
              const fresh = await tx.payment.findUnique({
                where: { id: payment.id },
                select: { status: true },
              });
              if (!fresh || fresh.status !== "PENDING") return;

              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  wompi_transaction_id: txn.id,
                  status: txn.status,
                  payment_method_type: txn.payment_method_type,
                },
              });
            });

            return Response.json({ status: txn.status, updated: true });
          }

          return Response.json({ status: txn.status });
        }
      }
    }

    // No Wompi credentials or transaction not found — check if demo
    return Response.json({ status: payment.status });
  } catch (error) {
    return handleApiError(error);
  }
}
