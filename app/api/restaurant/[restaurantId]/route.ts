import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { z } from "zod/v4";

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
      include: { subscription_plans: true },
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { restaurantId } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Datos invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.slug) data.slug = parsed.data.slug;
    if (parsed.data.primaryColor) data.primary_color = parsed.data.primaryColor;
    if (parsed.data.secondaryColor) data.secondary_color = parsed.data.secondaryColor;
    if (parsed.data.backgroundColor) data.background_color = parsed.data.backgroundColor;

    const restaurant = await db.restaurant.update({
      where: { id: restaurantId },
      data,
    });

    return Response.json({ success: true, slug: restaurant.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
