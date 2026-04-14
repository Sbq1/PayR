import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import {
  logAuthEvent,
  AuthEventType,
  getAuthEventContext,
} from "@/lib/utils/auth-events";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";

const schema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const INVALID_TOKEN_MESSAGE =
  "El enlace no es válido o ha expirado. Solicita uno nuevo.";

class InvalidTokenError extends Error {
  constructor() {
    super("INVALID_TOKEN");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const { ip, userAgent } = await getAuthEventContext(request);

    const record = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.used_at !== null || record.expires_at < new Date()) {
      console.warn(
        `[reset-password] Token inválido/expirado desde ip=${ip ?? "unknown"}`
      );
      return Response.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction(async (tx) => {
      const used = await tx.passwordResetToken.updateMany({
        where: {
          token,
          used_at: null,
          expires_at: { gt: new Date() },
        },
        data: { used_at: new Date() },
      });
      if (used.count === 0) {
        throw new InvalidTokenError();
      }

      await tx.user.update({
        where: { id: record.user_id },
        data: {
          password_hash: passwordHash,
          session_version: { increment: 1 },
        },
      });
    });

    await logAuthEvent({
      userId: record.user_id,
      email: record.user.email,
      eventType: AuthEventType.PASSWORD_RESET_COMPLETED,
      ip,
      userAgent,
    });
    await logAuthEvent({
      userId: record.user_id,
      email: record.user.email,
      eventType: AuthEventType.PASSWORD_CHANGED,
      ip,
      userAgent,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      return Response.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 });
    }
    return handleApiError(error);
  }
}
