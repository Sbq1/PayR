import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getKpiDashboard } from "@/lib/services/kpi.service";
import { handleApiError } from "@/lib/utils/errors";
import type { KpiPeriod } from "@/types/kpi";

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
    const period = (request.nextUrl.searchParams.get("period") ||
      "month") as KpiPeriod;

    const dashboard = await getKpiDashboard(restaurantId, period);
    return Response.json(dashboard);
  } catch (error) {
    return handleApiError(error);
  }
}
