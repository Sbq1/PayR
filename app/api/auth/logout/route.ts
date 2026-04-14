import { NextRequest } from "next/server";
import { auth, logout } from "@/lib/auth";
import {
  logAuthEvent,
  AuthEventType,
  getAuthEventContext,
} from "@/lib/utils/auth-events";
import { handleApiError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session) {
      const { ip, userAgent } = await getAuthEventContext(request);
      await logAuthEvent({
        userId: session.user.id,
        email: session.user.email,
        eventType: AuthEventType.LOGOUT,
        ip,
        userAgent,
      });
    }
    await logout();
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
