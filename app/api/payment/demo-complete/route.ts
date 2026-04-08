import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, AppError } from "@/lib/utils/errors";
import { corsHeaders } from "@/lib/utils/cors";
import { getPosAdapter } from "@/lib/adapters/pos";
import { z } from "zod/v4";

const schema = z.object({
  reference: z.string(),
  paymentMethodType: z.string(),
});

/**
 * POST /api/payment/demo-complete
 * Completes a demo payment without HMAC verification.
 * Only works when WOMPI_ENVIRONMENT=sandbox.
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in sandbox
    const env = (process.env.WOMPI_ENVIRONMENT || "").replace(/\\n|\n/g, "").trim();
    if (env !== "sandbox") {
      throw new AppError("Solo disponible en sandbox", 403, "FORBIDDEN");
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { reference, paymentMethodType } = parsed.data;

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

    if (payment.status !== "PENDING") {
      return Response.json({ received: true });
    }

    // Update payment
    await db.payment.update({
      where: { id: payment.id },
      data: {
        wompi_transaction_id: `demo-txn-${Date.now()}`,
        status: "APPROVED",
        payment_method_type: paymentMethodType,
        customer_email: "demo@test.com",
        paid_at: new Date(),
      },
    });

    // Update order to PAID
    await db.order.update({
      where: { id: payment.order_id },
      data: { status: "PAID" },
    });

    // Release table
    await db.table.update({
      where: { id: payment.orders.table_id },
      data: { status: "AVAILABLE" },
    });

    // Close in POS (no-op for demo)
    try {
      const restaurant = payment.orders.restaurants;
      if (payment.orders.siigo_invoice_id) {
        const posAdapter = getPosAdapter({
          posProvider: restaurant.pos_provider,
          siigoUsername: restaurant.siigo_username,
          siigoAccessKey: restaurant.siigo_access_key,
        });
        await posAdapter.closeTable(payment.orders.siigo_invoice_id, payment.amount_in_cents);
      }
    } catch {}

    return Response.json({ received: true, status: "APPROVED" }, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}
