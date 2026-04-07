import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, PlanLimitError } from "@/lib/utils/errors";
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

    const tables = await db.table.findMany({
      where: { restaurant_id: restaurantId },
      include: { qr_codes: true },
      orderBy: { table_number: "asc" },
    });

    return Response.json(tables);
  } catch (error) {
    return handleApiError(error);
  }
}

const createTableSchema = z.object({
  tableNumber: z.number().int().min(1),
  label: z.string().optional(),
  siigoCostCenterId: z.string().optional(),
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
    const body = await request.json();
    const parsed = createTableSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Datos invalidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Verificar limite de plan
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription_plans: true },
    });

    if (!restaurant) {
      return Response.json({ error: "Restaurante no encontrado" }, { status: 404 });
    }

    const currentTables = await db.table.count({
      where: { restaurant_id: restaurantId, is_active: true },
    });

    const maxTables = restaurant.subscription_plans.max_tables;
    if (maxTables !== -1 && currentTables >= maxTables) {
      throw new PlanLimitError(
        `mas de ${maxTables} mesas. Actualiza tu plan`
      );
    }

    const { tableNumber, label, siigoCostCenterId } = parsed.data;

    const table = await db.table.create({
      data: {
        restaurant_id: restaurantId,
        table_number: tableNumber,
        label: label || `Mesa ${tableNumber}`,
        siigo_cost_center_id: siigoCostCenterId || String(tableNumber),
      },
    });

    return Response.json(table, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
