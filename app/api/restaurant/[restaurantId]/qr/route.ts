import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { getTableQrUrl, generateQrDataUrl } from "@/lib/utils/qr";

/**
 * POST /api/restaurant/[restaurantId]/qr
 * Genera QR codes para todas las mesas que no tienen uno.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { restaurantId } = await params;

    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return Response.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    // Mesas sin QR
    const tablesWithoutQr = await db.table.findMany({
      where: {
        restaurant_id: restaurantId,
        is_active: true,
        qr_codes: null,
      },
    });

    const created = [];

    for (const table of tablesWithoutQr) {
      const url = getTableQrUrl(restaurant.slug, table.id);

      const qr = await db.qrCode.create({
        data: {
          table_id: table.id,
          url,
        },
      });

      created.push({ tableId: table.id, tableNumber: table.table_number, url, qrId: qr.id });
    }

    return Response.json({
      generated: created.length,
      qrCodes: created,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/restaurant/[restaurantId]/qr
 * Retorna todos los QR codes con su imagen data URL.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { restaurantId } = await params;

    const tables = await db.table.findMany({
      where: { restaurant_id: restaurantId, is_active: true },
      include: { qr_codes: true },
      orderBy: { table_number: "asc" },
    });

    const qrCodes = await Promise.all(
      tables.map(async (table) => {
        const qr = table.qr_codes;
        if (!qr) return { tableId: table.id, tableNumber: table.table_number, label: table.label, qr: null };

        const dataUrl = await generateQrDataUrl(qr.url);
        return {
          tableId: table.id,
          tableNumber: table.table_number,
          label: table.label,
          qr: {
            id: qr.id,
            url: qr.url,
            dataUrl,
          },
        };
      })
    );

    return Response.json(qrCodes);
  } catch (error) {
    return handleApiError(error);
  }
}
