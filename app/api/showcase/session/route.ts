import { NextRequest } from "next/server";
import { getOrCreateShowcaseSession } from "@/lib/services/showcase.service";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { corsHeaders, handlePreflight } from "@/lib/utils/cors";

const limiter = rateLimit("showcase-session", { interval: 60_000, limit: 40 });

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success, resetAt } = await limiter.check(ip);
    if (!success) return rateLimitResponse(resetAt);

    const session = await getOrCreateShowcaseSession();
    return Response.json(session, { headers: corsHeaders(request) });
  } catch (error) {
    return handleApiError(error);
  }
}

export function OPTIONS(request: Request) {
  return handlePreflight(request);
}
