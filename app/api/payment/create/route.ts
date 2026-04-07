import { NextRequest } from "next/server";
import { createPayment } from "@/lib/services/payment.service";
import { createPaymentSchema } from "@/lib/validators/payment.schema";
import { handleApiError } from "@/lib/utils/errors";

/**
 * POST /api/payment/create
 *
 * Crea una transaccion de pago y retorna la config del widget Wompi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createPayment(parsed.data);

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
