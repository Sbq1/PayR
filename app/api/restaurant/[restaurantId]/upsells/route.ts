import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
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
    await verifyOwnership(restaurantId, session.user.id);

    const products = await db.upsellProduct.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { sort_order: "asc" },
    });

    return Response.json(products);
  } catch (error) {
    return handleApiError(error);
  }
}

const createUpsellSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().min(0),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const body = await request.json();
    const parsed = createUpsellSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Datos invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Obtener siguiente sort_order
    const lastProduct = await db.upsellProduct.findFirst({
      where: { restaurant_id: restaurantId },
      orderBy: { sort_order: "desc" },
    });

    const product = await db.upsellProduct.create({
      data: {
        restaurant_id: restaurantId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        image_url: parsed.data.imageUrl || null,
        is_active: parsed.data.isActive,
        sort_order: (lastProduct?.sort_order || 0) + 1,
      },
    });

    return Response.json(product, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
