"use server";

import { login } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: { email: string; password: string }) {
  const user = await login(formData.email, formData.password);

  if (!user) {
    return { error: "Email o contraseña incorrectos" };
  }

  redirect("/dashboard");
}
