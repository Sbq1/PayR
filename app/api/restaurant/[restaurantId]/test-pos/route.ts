import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { SiigoAdapter } from "@/lib/adapters/pos/siigo.adapter";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";

const limiter = rateLimit("pos-test", {
  interval: 60 * 60 * 1000, // 1 hora
  limit: 10,
});

const bodySchema = z.object({
  username: z.string().email(),
  accessKey: z.string().min(20).max(200),
});

/**
 * POST /api/restaurant/[restaurantId]/test-pos
 *
 * Testa credenciales de Siigo sin guardarlas.
 * Body: { username, accessKey }
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

    const rl = await limiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    if (session.user.restaurantId !== restaurantId) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Credenciales con formato inválido" },
        { status: 400 }
      );
    }

    const adapter = new SiigoAdapter(parsed.data);
    await adapter.authenticate();

    return Response.json({ success: true, message: "Conexión exitosa con Siigo" });
  } catch (error) {
    return handleApiError(error);
  }
}
