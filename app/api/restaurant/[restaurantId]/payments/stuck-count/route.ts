import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";

const stuckCountLimiter = rateLimit("dashboard-stuck-count", {
  interval: 60_000,
  limit: 120,
});

const STUCK_WINDOW_MS = 10 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await stuckCountLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const stuckBefore = new Date(Date.now() - STUCK_WINDOW_MS);

    const count = await db.payment.count({
      where: {
        orders: { restaurant_id: restaurantId },
        status: "PENDING",
        created_at: { lt: stuckBefore },
      },
    });

    return Response.json(
      { count },
      {
        headers: {
          "Cache-Control": "private, max-age=15",
        },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
