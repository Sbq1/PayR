import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, AppError } from "@/lib/utils/errors";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { getTableQrUrl, generateQrDataUrl } from "@/lib/utils/qr";

const qrLimiter = rateLimit("qr", { interval: 60_000, limit: 20 });

async function verifyOwnership(restaurantId: string, userId: string) {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) {
    throw new AppError("Restaurante no encontrado", 404, "NOT_FOUND");
  }
  if (restaurant.owner_id !== userId) {
    throw new AppError("No autorizado", 403, "FORBIDDEN");
  }
  return restaurant;
}

/**
 * POST /api/restaurant/[restaurantId]/qr
 * Genera QR codes para todas las mesas que no tienen uno.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await qrLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    const restaurant = await verifyOwnership(restaurantId, session.user.id);

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
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

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
