import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { generateConfigPreview } from "@/lib/services/qr.service";

const previewLimiter = rateLimit("qr-preview", { interval: 60_000, limit: 30 });

const previewSchema = z.object({
  dark: z.string().trim().min(4).max(7).optional(),
  light: z.string().trim().min(4).max(7).optional(),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await previewLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const result = await generateConfigPreview(restaurantId, parsed.data);
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
