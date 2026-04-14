import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { getQrConfig, updateQrConfig } from "@/lib/services/qr.service";

const listLimiter = rateLimit("qr-config-get", { interval: 60_000, limit: 60 });
const updateLimiter = rateLimit("qr-config-patch", { interval: 60_000, limit: 10 });

const updateSchema = z.object({
  dark: z.string().trim().min(4).max(7).optional(),
  light: z.string().trim().min(4).max(7).optional(),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).optional(),
  frameStyle: z.enum(["none", "simple", "branded"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await listLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const data = await getQrConfig(restaurantId);
    return Response.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await updateLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const updated = await updateQrConfig(restaurantId, parsed.data);
    return Response.json({ config: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
