import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { SiigoAdapter } from "@/lib/adapters/pos/siigo.adapter";
import { handleApiError } from "@/lib/utils/errors";

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

    const { restaurantId } = await params;
    if (session.user.restaurantId !== restaurantId) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    const { username, accessKey } = await request.json();
    if (!username || !accessKey) {
      return Response.json({ error: "Username y accessKey son requeridos" }, { status: 400 });
    }

    const adapter = new SiigoAdapter({ username, accessKey });
    await adapter.authenticate();

    return Response.json({ success: true, message: "Conexión exitosa con Siigo" });
  } catch (error) {
    return handleApiError(error);
  }
}
