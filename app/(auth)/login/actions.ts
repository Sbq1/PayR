"use server";

import { login } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  isLockedOut,
  recordFailure,
  resetFailures,
} from "@/lib/utils/auth-lockout";
import { logAuthEvent, AuthEventType } from "@/lib/utils/auth-events";

const GENERIC_ERROR = "Credenciales inválidas";

function lockoutMessage(expiresAt: number): string {
  const minutes = Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000));
  return `Demasiados intentos. Intenta nuevamente en ${minutes} minuto(s).`;
}

export async function loginAction(formData: { email: string; password: string }) {
  const email = formData.email.trim().toLowerCase();
  const password = formData.password;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent");

  const emailLock = await isLockedOut("email", email);
  if (emailLock.locked) {
    await logAuthEvent({
      email,
      eventType: AuthEventType.LOGIN_FAILED,
      ip,
      userAgent,
      metadata: { reason: "lockout_email" },
    });
    return { error: lockoutMessage(emailLock.expiresAt!) };
  }

  const ipLock = await isLockedOut("ip", ip);
  if (ipLock.locked) {
    await logAuthEvent({
      email,
      eventType: AuthEventType.LOGIN_FAILED,
      ip,
      userAgent,
      metadata: { reason: "lockout_ip" },
    });
    return { error: lockoutMessage(ipLock.expiresAt!) };
  }

  const user = await login(email, password);

  if (!user) {
    const emailResult = await recordFailure("email", email);
    const ipResult = await recordFailure("ip", ip);
    await logAuthEvent({
      email,
      eventType: AuthEventType.LOGIN_FAILED,
      ip,
      userAgent,
      metadata: { reason: "invalid_credentials" },
    });
    if (emailResult.locked) {
      return { error: lockoutMessage(emailResult.expiresAt!) };
    }
    if (ipResult.locked) {
      return { error: lockoutMessage(ipResult.expiresAt!) };
    }
    return { error: GENERIC_ERROR };
  }

  await resetFailures("email", email);
  await resetFailures("ip", ip);

  await logAuthEvent({
    userId: user.id,
    email: user.email,
    eventType: AuthEventType.LOGIN_SUCCESS,
    ip,
    userAgent,
  });

  redirect("/dashboard");
}
