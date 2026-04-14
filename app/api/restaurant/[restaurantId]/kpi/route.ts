import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getKpiDashboard } from "@/lib/services/kpi.service";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import type { KpiPeriod } from "@/types/kpi";

const kpiLimiter = rateLimit("kpi", { interval: 60_000, limit: 30 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await kpiLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const period = (request.nextUrl.searchParams.get("period") ||
      "month") as KpiPeriod;

    const dashboard = await getKpiDashboard(restaurantId, period);
    return Response.json(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
