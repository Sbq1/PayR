import { NextRequest } from "next/server";
import { getBillForTable } from "@/lib/services/bill.service";
import { getBillQuerySchema } from "@/lib/validators/bill.schema";
import { handleApiError } from "@/lib/utils/errors";

/**
 * GET /api/bill?slug=mi-restaurante&tableId=abc123
 *
 * Retorna la cuenta abierta de una mesa consultando el POS.
 * Endpoint publico — no requiere autenticacion (lo usa el cliente desde el QR).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const parsed = getBillQuerySchema.safeParse({
      slug: searchParams.get("slug"),
      tableId: searchParams.get("tableId"),
    });

    if (!parsed.success) {
      return Response.json(
        { error: "Parametros invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { slug, tableId } = parsed.data;
    const bill = await getBillForTable(slug, tableId);

    return Response.json(bill);
  } catch (error) {
    return handleApiError(error);
  }
}
