import { db } from "@/lib/db";
import { auth_event_type, Prisma } from "@/lib/generated/prisma/client";
import * as Sentry from "@sentry/nextjs";
import { headers as nextHeaders } from "next/headers";

export { auth_event_type as AuthEventType };

export interface AuthEventContext {
  ip: string | null;
  userAgent: string | null;
}

interface LogAuthEventParams {
  userId?: string | null;
  email?: string | null;
  eventType: auth_event_type;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuthEvent(params: LogAuthEventParams): Promise<void> {
  try {
    await db.authEvent.create({
      data: {
        user_id: params.userId ?? null,
        email: params.email ?? null,
        event_type: params.eventType,
        ip: params.ip ?? null,
        user_agent: params.userAgent ?? null,
        metadata:
          params.metadata == null
            ? Prisma.DbNull
            : (params.metadata as Prisma.InputJsonValue),
      },
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { layer: "auth-events" } });
  }
}

export async function getAuthEventContext(
  request?: Request
): Promise<AuthEventContext> {
  const hdrs = request ? request.headers : await nextHeaders();
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent");
  return { ip, userAgent };
}
