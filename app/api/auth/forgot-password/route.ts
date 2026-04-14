import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit } from "@/lib/utils/rate-limit";
import {
  logAuthEvent,
  AuthEventType,
  getAuthEventContext,
} from "@/lib/utils/auth-events";
import { sendEmail } from "@/lib/services/email.service";
import { forgotPasswordEmail } from "@/lib/emails/templates/forgot-password";
import { z } from "zod/v4";
import crypto from "node:crypto";

const limiter = rateLimit("forgot_password_email", {
  interval: 60 * 60 * 1000,
  limit: 3,
});

const schema = z.object({ email: z.email() });

const TOKEN_TTL_MS = 60 * 60 * 1000;

const GENERIC_RESPONSE = {
  success: true,
  message:
    "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.",
};

function genericResponse() {
  return Response.json(GENERIC_RESPONSE, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return genericResponse();
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { ip, userAgent } = await getAuthEventContext(request);

    const { success } = await limiter.check(email);
    if (!success) {
      return genericResponse();
    }

    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

      await db.passwordResetToken.create({
        data: {
          token,
          user_id: user.id,
          expires_at: expiresAt,
        },
      });

      const origin =
        request.headers.get("origin") ?? new URL(request.url).origin;
      const link = `${origin}/reset-password/${token}`;

      const content = forgotPasswordEmail({ resetLink: link, userEmail: user.email });
      await sendEmail({
        to: user.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
        // Token único por reset → idempotency key estable si Resend retry
        idempotencyKey: `password-reset/${token.substring(0, 32)}`,
      });

      await logAuthEvent({
        userId: user.id,
        email: user.email,
        eventType: AuthEventType.PASSWORD_RESET_REQUESTED,
        ip,
        userAgent,
      });
    } else {
      await logAuthEvent({
        email,
        eventType: AuthEventType.PASSWORD_RESET_REQUESTED,
        ip,
        userAgent,
        metadata: { user_exists: false },
      });
    }

    return genericResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
