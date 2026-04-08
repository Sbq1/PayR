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
        `${baseUrl}/v1/transactions?reference=${reference}`,
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
            // Complete the payment
            await db.payment.update({
              where: { id: payment.id },
              data: {
                wompi_transaction_id: txn.id,
                status: "APPROVED",
                payment_method_type: txn.payment_method_type,
                customer_email: txn.customer_email || payment.customer_email,
                paid_at: new Date(),
              },
            });

            await db.order.update({
              where: { id: payment.order_id },
              data: { status: "PAID" },
            });

            await db.table.update({
              where: { id: payment.orders.table_id },
              data: { status: "AVAILABLE" },
            });

            // Close in POS
            try {
              if (payment.orders.siigo_invoice_id) {
                const posAdapter = getPosAdapter({
                  posProvider: restaurant.pos_provider,
                  siigoUsername: restaurant.siigo_username,
                  siigoAccessKey: restaurant.siigo_access_key,
                });
                await posAdapter.closeTable(payment.orders.siigo_invoice_id, payment.amount_in_cents);
              }
            } catch {}

            return Response.json({ status: "APPROVED", updated: true });
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
