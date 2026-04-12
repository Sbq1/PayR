import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/utils/errors";
import { verifyOwnership } from "@/lib/utils/verify-ownership";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/utils/rate-limit";
import { z } from "zod/v4";

const ordersLimiter = rateLimit("orders", { interval: 60_000, limit: 30 });
const PAGE_SIZE = 20;

const validStatuses = ["PENDING", "PAYING", "PAID", "CANCELLED"] as const;

// GET /api/restaurant/[restaurantId]/orders?status=PAID&from=...&to=...&page=1
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

    const url = request.nextUrl;
    const status = url.searchParams.get("status");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    // Validate status if provided
    if (status && !validStatuses.includes(status as typeof validStatuses[number])) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      restaurant_id: restaurantId,
    };

    if (status) {
      where.status = status;
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
      where.created_at = dateFilter;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          tables: { select: { table_number: true, label: true } },
          order_items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unit_price: true,
              total_price: true,
              is_upsell: true,
            },
          },
          payments: {
            select: {
              status: true,
              payment_method_type: true,
              amount_in_cents: true,
              paid_at: true,
            },
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { created_at: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      db.order.count({ where }),
    ]);

    return Response.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const cancelSchema = z.object({
  orderId: z.string(),
  status: z.literal("CANCELLED"),
});

// PATCH /api/restaurant/[restaurantId]/orders — Cancel an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    const rl = await ordersLimiter.check(getClientIp(request));
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const { restaurantId } = await params;
    await verifyOwnership(restaurantId, session.user.id);

    const body = await request.json();
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderId } = parsed.data;

    // Verify order belongs to restaurant
    const order = await db.order.findFirst({
      where: { id: orderId, restaurant_id: restaurantId },
    });

    if (!order) {
      return Response.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return Response.json(
        { error: `No se puede cancelar una orden con estado ${order.status}` },
        { status: 409 }
      );
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    // Release table back to available
    await db.table.update({
      where: { id: order.table_id },
      data: { status: "AVAILABLE" },
    });

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
