"use server";

import { login } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/utils/rate-limit";

const limiter = rateLimit("login", { interval: 15 * 60 * 1000, limit: 5 }); // 5 intentos / 15 min

export async function loginAction(formData: { email: string; password: string }) {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  const { success, resetAt } = await limiter.check(ip);
  if (!success) {
    const minutes = Math.ceil((resetAt - Date.now()) / 60_000);
    return { error: `Demasiados intentos. Intenta en ${minutes} minuto(s).` };
  }

  const user = await login(formData.email, formData.password);

  if (!user) {
    return { error: "Email o contraseña incorrectos" };
  }

  redirect("/dashboard");
}
