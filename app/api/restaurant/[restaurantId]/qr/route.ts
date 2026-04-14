import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { getTableQrUrl, generateQrDataUrl, generateQrWithLogo } from "@/lib/utils/qr";
import { canUseFeature, type PlanTier } from "@/lib/utils/plan-gate";

const qrLimiter = rateLimit("qr", { interval: 60_000, limit: 20 });
const qrListLimiter = rateLimit("qr-list", { interval: 60_000, limit: 20 });

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

    const rl = await qrLimiter.check(`user:${session.user.id}`);
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

    const rl = await qrListLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    const restaurant = await verifyOwnership(restaurantId, session.user.id);

    const tables = await db.table.findMany({
      where: { restaurant_id: restaurantId, is_active: true },
      include: { qr_codes: true },
      orderBy: { table_number: "asc" },
    });

    const tier = restaurant.subscription_plans.tier as PlanTier;
    const logoEnabled =
      canUseFeature(tier, "qrLogoEmbedded") &&
      restaurant.qr_logo_data != null &&
      restaurant.qr_logo_mime != null;

    const qrOptions = {
      dark: restaurant.qr_dark_color,
      light: restaurant.qr_light_color,
      errorCorrection: restaurant.qr_error_correction as "L" | "M" | "Q" | "H",
    };

    const logoInput = logoEnabled
      ? {
          buffer: Buffer.from(restaurant.qr_logo_data!),
          mime: restaurant.qr_logo_mime!,
        }
      : null;

    const qrCodes = await Promise.all(
      tables.map(async (table) => {
        const qr = table.qr_codes;
        if (!qr) return { tableId: table.id, tableNumber: table.table_number, label: table.label, qr: null };

        const dataUrl = logoInput
          ? await generateQrWithLogo(qr.url, qrOptions, logoInput)
          : await generateQrDataUrl(qr.url, qrOptions);
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
