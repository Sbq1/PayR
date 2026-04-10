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
 *
 * Cierra un pago de restaurante en modo DEMO (restaurante sin credenciales
 * Wompi configuradas). NO depende de WOMPI_ENVIRONMENT: el gate es por
 * restaurante del payment, no por variable de entorno. Esto evita que un
 * misconfig de env var permita bypassear pagos reales.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Gate principal: solo restaurantes en modo DEMO pueden usar este endpoint.
    // Un restaurante está en demo si NO tiene las 4 credenciales Wompi.
    // Cualquier restaurante con Wompi real queda protegido incluso si
    // WOMPI_ENVIRONMENT=sandbox por error de configuración.
    const restaurant = payment.orders.restaurants;
    const hasRealWompi = !!(
      restaurant.wompi_public_key &&
      restaurant.wompi_private_key &&
      restaurant.wompi_events_secret &&
      restaurant.wompi_integrity_secret
    );
    if (hasRealWompi) {
      throw new AppError(
        "Demo checkout no disponible: el restaurante tiene Wompi configurado",
        403,
        "FORBIDDEN"
      );
    }

    // Idempotencia: si ya fue procesado, retornar 200 sin re-aplicar.
    if (payment.status !== "PENDING") {
      return Response.json(
        { received: true, status: payment.status },
        { headers: corsHeaders(request) }
      );
    }

    // Transacción atómica: los 3 updates en una sola TX con re-check dentro
    // para prevenir race conditions si llega otro demo-complete en paralelo.
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
          wompi_transaction_id: `demo-txn-${Date.now()}`,
          status: "APPROVED",
          payment_method_type: paymentMethodType,
          customer_email: "demo@test.com",
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

    if (!result.applied) {
      return Response.json(
        { received: true, status: "ALREADY_PROCESSED" },
        { headers: corsHeaders(request) }
      );
    }

    // Cierre en POS fuera de la transacción DB (no-op en demo).
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

    return Response.json({ received: true, status: "APPROVED" }, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}
