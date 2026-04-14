import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { sendEmail } from "@/lib/services/email.service";
import { welcomeEmail } from "@/lib/emails/templates/welcome";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";

const limiter = rateLimit("register", { interval: 60 * 60 * 1000, limit: 5 }); // 5/hora

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  restaurantName: z.string().min(2),
  restaurantSlug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success, resetAt } = await limiter.check(ip);
    if (!success) return rateLimitResponse(resetAt);

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Datos invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, restaurantName, restaurantSlug } = parsed.data;

    // Verificar email unico
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return Response.json({ error: "Este email ya esta registrado" }, { status: 409 });
    }

    // Verificar slug unico
    const existingSlug = await db.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });
    if (existingSlug) {
      return Response.json({ error: "Este slug ya esta en uso" }, { status: 409 });
    }

    // Obtener plan Starter por defecto
    const starterPlan = await db.subscriptionPlan.findUnique({
      where: { tier: "STARTER" },
    });

    if (!starterPlan) {
      return Response.json({ error: "Error de configuracion" }, { status: 500 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario + restaurante en transaccion
    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password_hash: passwordHash,
        },
      });

      await tx.restaurant.create({
        data: {
          name: restaurantName,
          slug: restaurantSlug,
          owner_id: newUser.id,
          plan_id: starterPlan.id,
          pos_provider: "demo",
        },
      });
    });

    // Welcome email — non-blocking (sendEmail no throws, hace fallback console.log si falla)
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const welcomeContent = welcomeEmail({
      userName: name,
      userEmail: email,
      restaurantName,
      dashboardLink: `${origin}/dashboard`,
    });
    await sendEmail({
      to: email,
      subject: welcomeContent.subject,
      html: welcomeContent.html,
      text: welcomeContent.text,
      // Email único: registro de este email = 1 welcome
      idempotencyKey: `welcome/${email}`,
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
