import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppError, handleApiError } from "@/lib/utils/errors";
import {
  rateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/utils/rate-limit";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { canUseFeature, type PlanTier } from "@/lib/utils/plan-gate";
import {
  generatePrintablePdf,
  type PrintableOpts,
} from "@/lib/services/pdf.service";
import type { QrFrameStyle } from "@/lib/services/qr.service";
import type { QrErrorCorrection } from "@/lib/utils/qr";

const limiter = rateLimit("qr-printable", { interval: 60_000, limit: 20 });

function sanitizeSlug(slug: string): string {
  const cleaned = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return cleaned || "restaurant";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; tableId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await limiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId, tableId } = await params;
    const restaurant = await verifyOwnership(restaurantId, session.user.id);

    const tier = restaurant.subscription_plans.tier as PlanTier;
    if (!canUseFeature(tier, "qrPrintableTemplate")) {
      throw new AppError(
        "La plantilla imprimible requiere plan ENTERPRISE",
        403,
        "feature_not_in_plan",
      );
    }

    const table = await db.table.findFirst({
      where: {
        id: tableId,
        restaurant_id: restaurantId,
        is_active: true,
      },
      include: { qr_codes: true },
    });

    if (!table) {
      throw new AppError("Mesa no encontrada", 404, "NOT_FOUND");
    }
    if (!table.qr_codes) {
      throw new AppError(
        "La mesa no tiene un QR generado",
        404,
        "qr_not_generated",
      );
    }

    const opts: PrintableOpts = {
      qrUrl: table.qr_codes.url,
      frameStyle: restaurant.qr_frame_style as QrFrameStyle,
      tableNumber: table.table_number,
      tableLabel: table.label,
      restaurantName: restaurant.name,
      slug: restaurant.slug,
      primaryColor: restaurant.primary_color,
      secondaryColor: restaurant.secondary_color,
      logoBuffer: restaurant.qr_logo_data ? Buffer.from(restaurant.qr_logo_data) : null,
      logoMime: restaurant.qr_logo_mime,
      qrDark: restaurant.qr_dark_color,
      qrLight: restaurant.qr_light_color,
      qrEc: restaurant.qr_error_correction as QrErrorCorrection,
    };

    const pdf = await generatePrintablePdf(opts);
    const filename = `printable-${sanitizeSlug(restaurant.slug)}-mesa-${table.table_number}.pdf`;

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
