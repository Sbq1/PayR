import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { encrypt } from "@/lib/utils/crypto";
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";
import { z } from "zod/v4";

const updateLimiter = rateLimit("restaurant-update", {
  interval: 60 * 60 * 1000, // 1 hora
  limit: 10,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { restaurantId } = await params;

    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        subscription_plans: true,
        _count: { select: { tables: true } },
      },
    });

    if (!restaurant) {
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }

    // No exponer credenciales encriptadas
    return Response.json({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      logoUrl: restaurant.logo_url,
      primaryColor: restaurant.primary_color,
      secondaryColor: restaurant.secondary_color,
      backgroundColor: restaurant.background_color,
      posProvider: restaurant.pos_provider,
      hasSiigoCredentials: !!restaurant.siigo_username,
      hasWompiCredentials: !!restaurant.wompi_public_key,
      isActive: restaurant.is_active,
      plan: {
        tier: restaurant.subscription_plans.tier,
        name: restaurant.subscription_plans.name,
        maxTables: restaurant.subscription_plans.max_tables,
      },
      tableCount: restaurant._count.tables,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Wompi v1 key formats (validar en server para evitar basura en DB encriptada)
const WOMPI_PUB_RE = /^pub_(test|prod)_[A-Za-z0-9]+$/;
const WOMPI_PRV_RE = /^prv_(test|prod)_[A-Za-z0-9]+$/;
const WOMPI_INTEGRITY_RE = /^(test|prod)_integrity_[A-Za-z0-9]+$/;

const updateSchema = z
  .object({
    name: z.string().min(2).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    // POS credentials
    siigoUsername: z.string().email().optional(),
    siigoAccessKey: z.string().min(20).max(200).optional(),
    // Payment credentials
    wompiPublicKey: z.string().regex(WOMPI_PUB_RE).optional(),
    wompiPrivateKey: z.string().regex(WOMPI_PRV_RE).optional(),
    wompiEventsSecret: z.string().min(20).max(500).optional(),
    wompiIntegritySecret: z.string().regex(WOMPI_INTEGRITY_RE).optional(),
  })
  .refine(
    (data) => {
      // Mismo entorno (test/prod) en todas las wompi keys del request
      const presentKeys: string[] = [];
      if (data.wompiPublicKey) presentKeys.push(data.wompiPublicKey);
      if (data.wompiPrivateKey) presentKeys.push(data.wompiPrivateKey);
      if (data.wompiIntegritySecret) presentKeys.push(data.wompiIntegritySecret);

      if (presentKeys.length < 2) return true;
      const envs = presentKeys.map((k) => (k.includes("test") ? "test" : "prod"));
      return envs.every((e) => e === envs[0]);
    },
    {
      message:
        "Las credenciales de Wompi mezclan sandbox (test_) y producción (prod_). Deben ser del mismo entorno.",
      path: ["wompiPublicKey"],
    },
  );

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await updateLimiter.check(`user:${session.user.id}`);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;

    // Verificar ownership — solo el dueño puede editar su restaurante
    if (session.user.restaurantId !== restaurantId) {
      return Response.json({ error: "No autorizado para editar este restaurante" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.slug) data.slug = parsed.data.slug;
    if (parsed.data.primaryColor) data.primary_color = parsed.data.primaryColor;
    if (parsed.data.secondaryColor) data.secondary_color = parsed.data.secondaryColor;
    if (parsed.data.backgroundColor) data.background_color = parsed.data.backgroundColor;
    // POS — encrypt sensitive fields
    if (parsed.data.siigoUsername) data.siigo_username = encrypt(parsed.data.siigoUsername);
    if (parsed.data.siigoAccessKey) data.siigo_access_key = encrypt(parsed.data.siigoAccessKey);
    if (parsed.data.siigoUsername || parsed.data.siigoAccessKey) data.pos_provider = "siigo";
    // Payment — public key is not encrypted, private keys are
    if (parsed.data.wompiPublicKey) data.wompi_public_key = parsed.data.wompiPublicKey;
    if (parsed.data.wompiPrivateKey) data.wompi_private_key = encrypt(parsed.data.wompiPrivateKey);
    if (parsed.data.wompiEventsSecret) data.wompi_events_secret = encrypt(parsed.data.wompiEventsSecret);
    if (parsed.data.wompiIntegritySecret) data.wompi_integrity_secret = encrypt(parsed.data.wompiIntegritySecret);

    const restaurant = await db.restaurant.update({
      where: { id: restaurantId },
      data,
    });

    return Response.json({ success: true, slug: restaurant.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
