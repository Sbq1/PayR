import { NextRequest } from "next/server";
import { refreshSession } from "@/lib/auth";
import {
  logAuthEvent,
  AuthEventType,
  getAuthEventContext,
} from "@/lib/utils/auth-events";
import { handleApiError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await refreshSession();
    if (!user) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }
    const { ip, userAgent } = await getAuthEventContext(request);
    await logAuthEvent({
      userId: user.id,
      email: user.email,
      eventType: AuthEventType.SESSION_REFRESHED,
      ip,
      userAgent,
    });
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
