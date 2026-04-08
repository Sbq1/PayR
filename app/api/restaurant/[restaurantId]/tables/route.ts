import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, PlanLimitError } from "@/lib/utils/errors";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { z } from "zod/v4";

const tablesLimiter = rateLimit("tables", { interval: 60_000, limit: 30 });

// GET /api/restaurant/[restaurantId]/tables
export async function GET(
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

    const tables = await db.table.findMany({
      where: { restaurant_id: restaurantId, is_active: true },
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
  label: z.string().max(100).optional(),
  siigoCostCenterId: z.string().max(50).optional(),
});

// POST /api/restaurant/[restaurantId]/tables
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await tablesLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    const restaurant = await verifyOwnership(restaurantId, session.user.id);

    const body = await request.json();
    const parsed = createTableSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Plan limit check
    const currentTables = await db.table.count({
      where: { restaurant_id: restaurantId, is_active: true },
    });
    const maxTables = restaurant.subscription_plans.max_tables;
    if (maxTables !== -1 && currentTables >= maxTables) {
      throw new PlanLimitError(`más de ${maxTables} mesas. Actualiza tu plan`);
    }

    const { tableNumber, label, siigoCostCenterId } = parsed.data;

    // Check duplicate
    const existing = await db.table.findFirst({
      where: { restaurant_id: restaurantId, table_number: tableNumber, is_active: true },
    });
    if (existing) {
      return Response.json(
        { error: `Ya existe una mesa #${tableNumber} en tu restaurante` },
        { status: 409 }
      );
    }

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

const updateTableSchema = z.object({
  tableId: z.string(),
  label: z.string().max(100).optional(),
  siigoCostCenterId: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/restaurant/[restaurantId]/tables
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await tablesLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const body = await request.json();
    const parsed = updateTableSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { tableId, label, siigoCostCenterId, isActive } = parsed.data;

    // Verify table belongs to restaurant
    const table = await db.table.findFirst({
      where: { id: tableId, restaurant_id: restaurantId },
    });
    if (!table) {
      return Response.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    const updated = await db.table.update({
      where: { id: tableId },
      data: {
        ...(label !== undefined && { label }),
        ...(siigoCostCenterId !== undefined && { siigo_cost_center_id: siigoCostCenterId }),
        ...(isActive !== undefined && { is_active: isActive }),
      },
    });

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/restaurant/[restaurantId]/tables?tableId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await tablesLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const tableId = request.nextUrl.searchParams.get("tableId");
    if (!tableId) {
      return Response.json({ error: "tableId requerido" }, { status: 400 });
    }

    // Verify table belongs to restaurant
    const table = await db.table.findFirst({
      where: { id: tableId, restaurant_id: restaurantId },
    });
    if (!table) {
      return Response.json({ error: "Mesa no encontrada" }, { status: 404 });
    }

    // Check for active orders
    const activeOrders = await db.order.count({
      where: {
        table_id: tableId,
        status: { in: ["PENDING", "PAYING"] },
      },
    });
    if (activeOrders > 0) {
      return Response.json(
        { error: "No se puede eliminar una mesa con órdenes activas" },
        { status: 409 }
      );
    }

    // Soft delete
    await db.table.update({
      where: { id: tableId },
      data: { is_active: false },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
